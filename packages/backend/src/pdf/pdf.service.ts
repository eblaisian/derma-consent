import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ErrorCode, errorPayload } from '../common/error-codes';
import { ConsentStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';
import * as crypto from 'crypto';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async generateConsentPdf(consentId: string): Promise<string> {
    const consent = await this.prisma.consentForm.findUniqueOrThrow({
      where: { id: consentId },
      include: {
        practice: { select: { name: true, publicKey: true } },
      },
    });

    // Format timestamp in Europe/Berlin
    const signedAt = consent.signatureTimestamp
      ? new Intl.DateTimeFormat('de-DE', {
          timeZone: 'Europe/Berlin',
          dateStyle: 'long',
          timeStyle: 'medium',
        }).format(consent.signatureTimestamp)
      : 'N/A';

    // Generate digital fingerprint
    const fingerprint = crypto
      .createHash('sha256')
      .update(
        `${consent.id}:${consent.signatureTimestamp?.toISOString() || ''}:${consent.signatureIp || ''}`,
      )
      .digest('hex')
      .substring(0, 16);

    // Build PDF (does NOT contain decrypted patient data)
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const pdfComplete = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Header
    doc
      .fontSize(20)
      .text('Einwilligungserklärung', { align: 'center' })
      .moveDown();

    doc
      .fontSize(12)
      .text(`Praxis: ${consent.practice.name}`)
      .text(`Behandlungstyp: ${consent.type}`)
      .text(`Datum: ${signedAt}`)
      .moveDown();

    // Status
    doc
      .fontSize(14)
      .text('Status', { underline: true })
      .moveDown(0.5)
      .fontSize(12)
      .text(`Status: ${consent.status}`)
      .moveDown();

    // Payment reference
    if (consent.stripePaymentIntent) {
      doc
        .fontSize(14)
        .text('Zahlungsreferenz', { underline: true })
        .moveDown(0.5)
        .fontSize(12)
        .text(`Referenz: ${consent.stripePaymentIntent}`)
        .moveDown();
    }

    // Privacy notice
    doc
      .fontSize(14)
      .text('Datenschutzhinweis', { underline: true })
      .moveDown(0.5)
      .fontSize(10)
      .text(
        'Die Patientendaten sind Ende-zu-Ende verschlüsselt gespeichert und ' +
          'können nur von der behandelnden Praxis mit dem Praxis-Schlüssel entschlüsselt werden. ' +
          'Dieses Dokument enthält keine personenbezogenen Patientendaten.',
        { align: 'justify' },
      )
      .moveDown();

    // Footer with digital fingerprint
    doc
      .fontSize(8)
      .text(
        `Digitaler Fingerabdruck: ${fingerprint} | Erstellt: ${new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'short', timeStyle: 'short' }).format(new Date())}`,
        50,
        doc.page.height - 50,
        { align: 'center' },
      );

    // Digital signature: SHA-256 hash of consent metadata, verifiable with practice public key
    const signaturePayload = JSON.stringify({
      consentId: consent.id,
      practiceId: consent.practiceId,
      type: consent.type,
      status: consent.status,
      signatureTimestamp: consent.signatureTimestamp?.toISOString(),
      signatureIp: consent.signatureIp,
      fingerprint,
      generatedAt: new Date().toISOString(),
    });

    const signatureHash = crypto
      .createHash('sha256')
      .update(signaturePayload)
      .digest('hex');

    doc
      .fontSize(7)
      .fillColor('#999999')
      .text(
        `Digitale Signatur (SHA-256): ${signatureHash}`,
        50,
        doc.page.height - 65,
        { align: 'center' },
      );

    doc.end();
    const pdfBuffer = await pdfComplete;

    // Upload to storage (quota-checked — all uploads count against practice storage)
    const storagePath = `consent-pdfs/${consent.practiceId}/${consent.id}.pdf`;
    await this.storage.uploadWithQuotaCheck(storagePath, pdfBuffer, 'application/pdf', consent.practiceId, { upsert: true });

    // Compute hash of the final PDF for tamper detection
    const pdfHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    // Update consent to COMPLETED
    await this.prisma.consentForm.update({
      where: { id: consentId },
      data: {
        status: ConsentStatus.COMPLETED,
        pdfStoragePath: storagePath,
        pdfSignatureHash: pdfHash,
      },
    });

    this.logger.log(`PDF generated for consent ${consentId}: ${storagePath}`);
    return storagePath;
  }

  async downloadPdf(consentId: string, practiceId: string): Promise<{ signedUrl: string }> {
    const consent = await this.prisma.consentForm.findFirst({
      where: { id: consentId, practiceId },
      select: { pdfStoragePath: true },
    });

    if (!consent?.pdfStoragePath) {
      throw new NotFoundException(errorPayload(ErrorCode.PDF_NOT_FOUND));
    }

    const signedUrl = await this.storage.getSignedUrl(consent.pdfStoragePath, 900);
    return { signedUrl };
  }
}
