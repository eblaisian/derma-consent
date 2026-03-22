import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ErrorCode, errorPayload } from '../common/error-codes';
import { ConsentStatus } from '@prisma/client';
import { type Locale } from '@derma-consent/shared';
import { GeneratePdfDto } from './pdf.dto';
import { getFormFieldsForType, type PdfFormField } from './pdf-form-fields';
import PDFDocument from 'pdfkit';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';

// ── Server-side i18n helpers ──────────────────────────

const SHARED_ROOT = path.resolve(__dirname, '../../../../shared');
const FONTS_DIR = path.join(SHARED_ROOT, 'assets/fonts');
const MESSAGES_DIR = path.join(SHARED_ROOT, 'i18n/messages');

function loadMessages(locale: string): Record<string, unknown> {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function t(messages: Record<string, unknown>, key: string): string {
  const parts = key.split('.');
  let current: unknown = messages;
  for (const part of parts) {
    if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof current === 'string' ? current : key;
}

// ── Constants ─────────────────────────────────────────

const MARGIN_X = 71;
const MARGIN_Y = 57;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN_X;
const FOOTER_Y = PAGE_HEIGHT - 35;

const FONT_REGULAR = 'NotoSans';
const FONT_BOLD = 'NotoSans-Bold';
const FONT_ARABIC = 'NotoSansArabic';

const DEFAULT_ACCENT = '#1E3A5F';
const BODY_COLOR = '#1a1a1a';
const SECONDARY_COLOR = '#6b7280';
const LIGHT_BG = '#f3f4f6';
const BORDER_COLOR = '#e5e7eb';
const ACCENT_BAND_HEIGHT = 4;

const TYPE_H1 = 17;
const TYPE_H2 = 12;
const TYPE_BODY = 9.5;
const TYPE_SMALL = 8;
const TYPE_TINY = 7;

const ROW_PAD_Y = 5;
const COL_LABEL_W = CONTENT_WIDTH * 0.55;
const COL_VALUE_W = CONTENT_WIDTH * 0.45;

const CONSENT_TYPE_DE: Record<string, string> = {
  BOTOX: 'Botulinumtoxin-Behandlung',
  FILLER: 'Dermal-Filler-Behandlung',
  LASER: 'Laserbehandlung',
  CHEMICAL_PEEL: 'Chemisches Peeling',
  MICRONEEDLING: 'Microneedling',
  PRP: 'PRP-Eigenbluttherapie',
};

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // ── Public API ──────────────────────────────────────

  async generateConsentPdf(
    consentId: string,
    dto: GeneratePdfDto,
    userId: string,
  ): Promise<{ storagePath: string }> {
    const consent = await this.prisma.consentForm.findUniqueOrThrow({
      where: { id: consentId },
      include: {
        practice: { include: { settings: true } },
        patient: { select: { lookupHash: true } },
      },
    });

    const practice = consent.practice;
    const settings = practice.settings;
    const locale = (dto.locale || consent.locale || 'de') as Locale;
    const accentColor = settings?.brandColor || DEFAULT_ACCENT;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const deMessages = loadMessages('de');
    const patientMessages = locale !== 'de' ? loadMessages(locale) : null;

    // Download practice logo
    let logoBuffer: Buffer | null = null;
    if (settings?.logoUrl) {
      try {
        logoBuffer = await this.storage.download(settings.logoUrl);
      } catch {
        this.logger.warn(`Failed to download logo for practice ${practice.id}`);
      }
    }

    // Format dates
    const signedAt = consent.signatureTimestamp
      ? new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'long', timeStyle: 'medium' }).format(consent.signatureTimestamp)
      : 'N/A';

    // Generate QR code
    const verifyUrl = `${frontendUrl}/verify/${consent.id}`;
    const qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 80, margin: 1, errorCorrectionLevel: 'M' });

    // Digital fingerprint
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${consent.id}:${consent.signatureTimestamp?.toISOString() || ''}:${consent.signatureIp || ''}`)
      .digest('hex')
      .substring(0, 16);

    // ── Build PDF ─────────────────────────────────────

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGIN_Y + ACCENT_BAND_HEIGHT, bottom: 50, left: MARGIN_X, right: MARGIN_X },
      info: {
        Title: `Einwilligungserklärung — ${CONSENT_TYPE_DE[consent.type] || consent.type}`,
        Author: practice.name,
        Subject: 'Patienteneinwilligung',
        Creator: 'DermaConsent',
      },
    });

    // Register fonts
    doc.registerFont(FONT_REGULAR, path.join(FONTS_DIR, 'NotoSans-Regular.ttf'));
    doc.registerFont(FONT_BOLD, path.join(FONTS_DIR, 'NotoSans-Bold.ttf'));
    doc.registerFont(FONT_ARABIC, path.join(FONTS_DIR, 'NotoSansArabic-Regular.ttf'));

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const pdfComplete = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // ── Page chrome ─────────────────────────────────────
    // PDFKit auto-paginates when text overflows. We use the 'pageAdded' event
    // to draw the accent band on every new page. Footers use only simple
    // graphics (moveTo/lineTo) and lineBreak:false text to avoid triggering
    // additional pagination.
    //
    // For forced section breaks (signature, audit), we call doc.addPage() directly.

    const drawAccentBand = () => {
      doc.save();
      doc.rect(0, 0, PAGE_WIDTH, ACCENT_BAND_HEIGHT).fill(accentColor);
      doc.restore();
    };

    // Track pages for footer numbering — rendered at doc.end() is not possible,
    // so we render footer on each page via the event.
    let pageNum = 0;
    doc.on('pageAdded', () => {
      pageNum++;
      drawAccentBand();
    });

    // ── PAGE 1: Accent band ──────────────────────────
    drawAccentBand();

    // ── Letterhead ────────────────────────────────────
    this.renderLetterhead(doc, practice, logoBuffer, accentColor);

    // ── Document Title ────────────────────────────────
    const deName = CONSENT_TYPE_DE[consent.type] || consent.type;
    doc.font(FONT_BOLD).fontSize(TYPE_H1).fillColor(accentColor);
    doc.text('Einwilligungserklärung', { align: 'center' });
    doc.font(FONT_REGULAR).fontSize(TYPE_H2).fillColor(BODY_COLOR);
    doc.text(deName, { align: 'center' });
    if (patientMessages && locale !== 'de') {
      const locName = t(patientMessages, `consentTypes.${consent.type}`);
      if (locName !== `consentTypes.${consent.type}`) {
        doc.font(FONT_REGULAR).fontSize(TYPE_SMALL).fillColor(SECONDARY_COLOR);
        doc.text(locName, { align: 'center' });
      }
    }
    doc.moveDown(0.8);

    // ── Patient Info ──────────────────────────────────
    doc.font(FONT_REGULAR).fontSize(TYPE_BODY).fillColor(BODY_COLOR);
    if (dto.patientName) {
      doc.font(FONT_BOLD).text(`Patient: ${dto.patientName}`, { continued: false });
      doc.font(FONT_REGULAR);
    }
    if (dto.patientDob) {
      doc.text(`Geburtsdatum: ${dto.patientDob}`);
    }
    doc.text(`Datum: ${signedAt}`);
    if (consent.patient?.lookupHash) {
      doc.fontSize(TYPE_TINY).fillColor(SECONDARY_COLOR)
        .text(`Ref: ${consent.patient.lookupHash.substring(0, 8).toUpperCase()}`)
        .fillColor(BODY_COLOR).fontSize(TYPE_BODY);
    }
    doc.moveDown(0.6);

    // ── Form Data Table (all fields) ──────────────────
    this.renderSectionHeader(doc, 'Patientenangaben', accentColor);
    this.renderFormDataTable(doc, dto.formData, consent.type, deMessages);

    // ── PAGE 2: Consent Declaration ───────────────────
    if (doc.y > PAGE_HEIGHT - 250) doc.addPage();
    else doc.moveDown(0.8);

    this.renderSectionHeader(doc, 'Einwilligungserklärung', accentColor);
    doc.font(FONT_REGULAR).fontSize(TYPE_BODY).fillColor(BODY_COLOR);
    doc.text(
      `Hiermit bestätige ich, dass ich am ${signedAt} durch die behandelnde Ärztin / ` +
      `den behandelnden Arzt der ${practice.name} mündlich und ausführlich über den ` +
      `geplanten Eingriff (${deName}) aufgeklärt wurde.`,
      { align: 'justify', lineGap: 2 },
    );
    doc.moveDown(0.3);
    doc.text(
      'Ich hatte ausreichend Gelegenheit, Fragen zu stellen, und habe die Informationen zu ' +
      'Ablauf, Risiken, Nebenwirkungen und Behandlungsalternativen verstanden.',
      { align: 'justify', lineGap: 2 },
    );
    doc.moveDown(0.5);

    // Comprehension score
    if (consent.comprehensionScore != null) {
      doc.font(FONT_REGULAR).fontSize(TYPE_SMALL).fillColor(SECONDARY_COLOR);
      doc.text(`Verständnis-Score: ${Math.round(consent.comprehensionScore * 100)}%`);
      doc.fillColor(BODY_COLOR).moveDown(0.3);
    }

    // ── DSGVO Notice ──────────────────────────────────
    this.renderSectionHeader(doc, 'Datenschutz (DSGVO)', accentColor);
    doc.font(FONT_REGULAR).fontSize(TYPE_SMALL).fillColor(BODY_COLOR);
    doc.text(
      `Verantwortliche Stelle: ${practice.name}, ${practice.dsgvoContact}. ` +
      'Die Verarbeitung erfolgt auf Grundlage von Art. 9 Abs. 2 lit. a DSGVO ' +
      '(ausdrückliche Einwilligung) sowie § 630f BGB (Dokumentationspflicht). ' +
      'Die Unterlagen werden gemäß § 630f Abs. 3 BGB für 10 Jahre aufbewahrt. ' +
      'Widerrufsrecht: Art. 7 Abs. 3 DSGVO.',
      { align: 'justify', lineGap: 1.5 },
    );
    doc.moveDown(0.2);
    doc.fontSize(TYPE_TINY).fillColor(SECONDARY_COLOR);
    doc.text(
      'Patientendaten sind Ende-zu-Ende verschlüsselt und nur mit dem Praxis-Schlüssel entschlüsselbar.',
      { align: 'justify' },
    );
    doc.fillColor(BODY_COLOR).moveDown(0.6);

    // ── Signature Section ─────────────────────────────
    if (doc.y > PAGE_HEIGHT - 220) doc.addPage();

    this.renderSectionHeader(doc, 'Unterschrift', accentColor);
    this.renderSignatureBlock(doc, dto.signatureData, signedAt, practice.city);

    // ── Verification & Audit (Page 3) ─────────────────
    doc.addPage();
    this.renderSectionHeader(doc, 'Verifizierung & Prüfprotokoll', accentColor);
    doc.font(FONT_REGULAR).fontSize(TYPE_SMALL).fillColor(SECONDARY_COLOR);
    doc.text(
      'Dieses Dokument wurde digital erstellt und ist maschinenverifizierbar.',
    );
    doc.fillColor(BODY_COLOR).moveDown(0.5);

    // Audit table
    const auditRows: [string, string][] = [
      ['Vorgangs-ID', consent.id],
      ['Zeitstempel', signedAt],
      ['IP-Adresse', consent.signatureIp || 'N/A'],
      ['User-Agent', (consent.signatureUserAgent || 'N/A').substring(0, 60)],
      ['Fingerabdruck', fingerprint],
      ['Verifizierung', verifyUrl],
    ];
    this.renderKeyValueTable(doc, auditRows);
    doc.moveDown(0.5);

    // QR code
    doc.image(qrBuffer, MARGIN_X, doc.y, { width: 80, height: 80 });
    const qrTextX = MARGIN_X + 95;
    doc.font(FONT_REGULAR).fontSize(TYPE_SMALL).fillColor(SECONDARY_COLOR);
    doc.text('QR-Code scannen zur', qrTextX, doc.y);
    doc.text('Echtheitsprüfung', qrTextX);
    doc.y = Math.max(doc.y, doc.y) + 20;

    doc.end();
    const pdfBuffer = await pdfComplete;

    // ── Upload + hash ─────────────────────────────────

    if (consent.pdfStoragePath) {
      try { await this.storage.remove([consent.pdfStoragePath]); } catch { /* ignore */ }
    }

    const storagePath = `consent-pdfs/${consent.practiceId}/${consent.id}.pdf`;
    await this.storage.uploadWithQuotaCheck(storagePath, pdfBuffer, 'application/pdf', consent.practiceId, { upsert: true });

    const pdfHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    await this.prisma.consentForm.update({
      where: { id: consentId },
      data: {
        status: ConsentStatus.COMPLETED,
        pdfStoragePath: storagePath,
        pdfSignatureHash: pdfHash,
      },
    });

    this.logger.log(`PDF generated for consent ${consentId} by user ${userId}: ${storagePath}`);
    return { storagePath };
  }

  async downloadPdf(consentId: string, practiceId: string): Promise<{ buffer: Buffer; filename: string }> {
    const consent = await this.prisma.consentForm.findFirst({
      where: { id: consentId, practiceId },
      select: { pdfStoragePath: true },
    });

    if (!consent?.pdfStoragePath) {
      throw new NotFoundException(errorPayload(ErrorCode.PDF_NOT_FOUND));
    }

    const buffer = await this.storage.download(consent.pdfStoragePath);
    return { buffer, filename: `consent-${consentId}.pdf` };
  }

  // ── Private Rendering Helpers ───────────────────────

  private renderLetterhead(
    doc: PDFKit.PDFDocument,
    practice: { name: string; street?: string | null; houseNumber?: string | null; postalCode?: string | null; city?: string | null; phone?: string | null; practiceEmail?: string | null; website?: string | null },
    logoBuffer: Buffer | null,
    accentColor: string,
  ) {
    const startY = doc.y;
    const logoWidth = 70;
    const textX = logoBuffer ? MARGIN_X + logoWidth + 12 : MARGIN_X;

    if (logoBuffer) {
      try {
        doc.image(logoBuffer, MARGIN_X, startY, { fit: [logoWidth, 45] });
      } catch { /* logo decode failed */ }
    }

    doc.font(FONT_BOLD).fontSize(12).fillColor(BODY_COLOR);
    doc.text(practice.name, textX, startY, { width: PAGE_WIDTH - textX - MARGIN_X });

    doc.font(FONT_REGULAR).fontSize(TYPE_TINY).fillColor(SECONDARY_COLOR);
    const addrParts = [
      [practice.street, practice.houseNumber].filter(Boolean).join(' '),
      [practice.postalCode, practice.city].filter(Boolean).join(' '),
    ].filter(Boolean);
    if (addrParts.length) doc.text(addrParts.join(', '), textX);

    const contactParts = [practice.phone, practice.practiceEmail, practice.website].filter(Boolean);
    if (contactParts.length) doc.text(contactParts.join(' | '), textX);

    const lineY = Math.max(doc.y, startY + 48) + 6;
    doc.moveTo(MARGIN_X, lineY).lineTo(PAGE_WIDTH - MARGIN_X, lineY)
      .strokeColor(accentColor).lineWidth(1.5).stroke();
    doc.y = lineY + 12;
    doc.fillColor(BODY_COLOR);
  }

  private renderSectionHeader(doc: PDFKit.PDFDocument, title: string, accentColor: string) {
    doc.font(FONT_BOLD).fontSize(TYPE_H2).fillColor(accentColor);
    doc.text(title);
    doc.moveTo(MARGIN_X, doc.y + 1).lineTo(MARGIN_X + CONTENT_WIDTH, doc.y + 1)
      .strokeColor(BORDER_COLOR).lineWidth(0.5).stroke();
    doc.moveDown(0.3);
    doc.fillColor(BODY_COLOR);
  }

  private renderFormDataTable(
    doc: PDFKit.PDFDocument,
    formData: Record<string, unknown>,
    type: string,
    deMessages: Record<string, unknown>,
  ) {
    const fields = getFormFieldsForType(type);
    let rowIndex = 0;

    for (const field of fields) {
      const rawValue = formData[field.name];
      const label = t(deMessages, `medicalFields.${field.labelKey}`);
      const displayLabel = label !== `medicalFields.${field.labelKey}` ? label : field.labelKey;
      const value = this.resolveFieldValue(field, rawValue, deMessages);

      if (!value && rawValue === undefined) continue; // Skip truly missing fields

      // PDFKit auto-paginates when text overflows the bottom margin

      // Alternating row background
      const rowY = doc.y;
      if (rowIndex % 2 === 0) {
        doc.save();
        doc.rect(MARGIN_X, rowY - 1, CONTENT_WIDTH, 0).fill('white'); // measure first
        doc.restore();
      }

      // Measure text height
      const valueText = value || '—';
      doc.font(FONT_REGULAR).fontSize(TYPE_BODY);
      const textHeight = doc.heightOfString(valueText, { width: COL_VALUE_W - 10 });
      const rowHeight = Math.max(textHeight + ROW_PAD_Y * 2, 18);

      // Draw row background
      if (rowIndex % 2 === 0) {
        doc.save();
        doc.rect(MARGIN_X, rowY, CONTENT_WIDTH, rowHeight).fill(LIGHT_BG);
        doc.restore();
      }

      // Draw label
      doc.font(FONT_BOLD).fontSize(TYPE_BODY).fillColor(BODY_COLOR);
      doc.text(displayLabel, MARGIN_X + 6, rowY + ROW_PAD_Y, { width: COL_LABEL_W - 12, continued: false });

      // Draw value
      doc.font(FONT_REGULAR).fontSize(TYPE_BODY).fillColor(BODY_COLOR);
      doc.text(valueText, MARGIN_X + COL_LABEL_W + 4, rowY + ROW_PAD_Y, { width: COL_VALUE_W - 10 });

      // Move to next row
      doc.y = rowY + rowHeight;

      // Bottom border
      doc.moveTo(MARGIN_X, doc.y).lineTo(MARGIN_X + CONTENT_WIDTH, doc.y)
        .strokeColor(BORDER_COLOR).lineWidth(0.3).stroke();

      rowIndex++;
    }

    doc.moveDown(0.3);
  }

  private resolveFieldValue(field: PdfFormField, rawValue: unknown, deMessages: Record<string, unknown>): string {
    if (rawValue === undefined || rawValue === null || rawValue === '') return '—';

    switch (field.type) {
      case 'checkbox':
        return (rawValue === true || rawValue === 'true') ? 'Ja' : 'Nein';

      case 'checkbox-group':
      case 'yes-no-chips': {
        if (typeof rawValue !== 'string') return '—';
        if (rawValue === 'none' || rawValue === '') return 'Keine';
        const items = rawValue.split(',').map((v: string) => {
          const key = v.trim();
          const label = t(deMessages, `medicalOptions.${key}`);
          return label !== `medicalOptions.${key}` ? label : key;
        });
        return items.join(', ');
      }

      case 'condition-grid': {
        if (typeof rawValue !== 'string') return '—';
        if (rawValue === 'noneOfAbove' || rawValue === '') return 'Keine Vorerkrankungen';
        const conditions = rawValue.split(',').map((v: string) => {
          const key = v.trim();
          if (key.startsWith('notes:')) return `Anmerkung: ${key.slice(6)}`;
          if (key === 'noneOfAbove') return null;
          const label = t(deMessages, `medicalOptions.${key}`);
          return label !== `medicalOptions.${key}` ? label : key;
        }).filter(Boolean);
        return conditions.length > 0 ? conditions.join(', ') : 'Keine Vorerkrankungen';
      }

      case 'select': {
        const strVal = String(rawValue);
        const label = t(deMessages, `medicalOptions.${strVal}`);
        return label !== `medicalOptions.${strVal}` ? label : strVal;
      }

      case 'medication-tags':
        return typeof rawValue === 'string' && rawValue.length > 0 ? rawValue : 'Keine';

      case 'text':
      case 'textarea':
        return String(rawValue);

      default:
        return String(rawValue);
    }
  }

  private renderSignatureBlock(doc: PDFKit.PDFDocument, signatureData: string | undefined, signedAt: string, city: string | null | undefined) {
    const boxX = MARGIN_X;
    const boxW = Math.min(350, CONTENT_WIDTH);
    const boxH = 80;

    // Signature image in bordered box
    if (signatureData) {
      doc.rect(boxX, doc.y, boxW, boxH).strokeColor(BORDER_COLOR).lineWidth(1).stroke();
      try {
        const sigData = signatureData.includes(',') ? signatureData.split(',')[1] : signatureData;
        const sigBuffer = Buffer.from(sigData, 'base64');
        doc.image(sigBuffer, boxX + 10, doc.y + 5, { fit: [boxW - 20, boxH - 10] });
      } catch {
        doc.font(FONT_REGULAR).fontSize(TYPE_SMALL).fillColor(SECONDARY_COLOR);
        doc.text('[Digitale Unterschrift liegt vor]', boxX + 10, doc.y + 30);
      }
      doc.y += boxH + 6;
    }

    // Date and location
    doc.font(FONT_REGULAR).fontSize(TYPE_BODY).fillColor(BODY_COLOR);
    doc.text(`Datum: ${signedAt}`, MARGIN_X);
    doc.text(`Ort: ${city || 'Deutschland'}`, MARGIN_X);
    doc.moveDown(0.5);

    // Patient signature line
    const lineWidth = 280;
    doc.moveTo(MARGIN_X, doc.y).lineTo(MARGIN_X + lineWidth, doc.y)
      .strokeColor(BODY_COLOR).lineWidth(0.5).stroke();
    doc.moveDown(0.15);
    doc.font(FONT_REGULAR).fontSize(TYPE_TINY).fillColor(SECONDARY_COLOR);
    doc.text('Unterschrift des Patienten / der Patientin', MARGIN_X);
    doc.moveDown(1.2);

    // Physician signature line
    doc.moveTo(MARGIN_X, doc.y).lineTo(MARGIN_X + lineWidth, doc.y)
      .strokeColor(BODY_COLOR).lineWidth(0.5).stroke();
    doc.moveDown(0.15);
    doc.font(FONT_REGULAR).fontSize(TYPE_TINY).fillColor(SECONDARY_COLOR);
    doc.text('Unterschrift der behandelnden Ärztin / des behandelnden Arztes', MARGIN_X);
    doc.fillColor(BODY_COLOR);
  }

  private renderKeyValueTable(doc: PDFKit.PDFDocument, rows: [string, string][]) {
    const labelW = 100;
    const valueW = CONTENT_WIDTH - labelW - 10;

    for (const [label, value] of rows) {
      const y = doc.y;
      doc.font(FONT_BOLD).fontSize(TYPE_SMALL).fillColor(SECONDARY_COLOR);
      doc.text(label, MARGIN_X, y, { width: labelW });
      doc.font(FONT_REGULAR).fontSize(TYPE_SMALL).fillColor(BODY_COLOR);
      doc.text(value, MARGIN_X + labelW + 10, y, { width: valueW });
      doc.y = Math.max(doc.y, y + 14);
    }
  }
}
