import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ConsentStatus } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';
import * as crypto from 'crypto';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly supabase;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl = this.config.get('SUPABASE_URL');
    const supabaseKey = this.config.get('SUPABASE_SERVICE_KEY');
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  async generateConsentPdf(consentId: string): Promise<string> {
    const consent = await this.prisma.consentForm.findUniqueOrThrow({
      where: { id: consentId },
      include: {
        practice: { select: { name: true } },
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

    doc.end();
    const pdfBuffer = await pdfComplete;

    // Upload to Supabase Storage
    const storagePath = `consents/${consent.practiceId}/${consent.id}.pdf`;

    if (this.supabase) {
      const { error } = await this.supabase.storage
        .from('consent-pdfs')
        .upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (error) {
        this.logger.error(`Failed to upload PDF: ${error.message}`);
        throw error;
      }
    }

    // Update consent to COMPLETED
    await this.prisma.consentForm.update({
      where: { id: consentId },
      data: {
        status: ConsentStatus.COMPLETED,
        pdfStoragePath: storagePath,
      },
    });

    this.logger.log(`PDF generated for consent ${consentId}: ${storagePath}`);
    return storagePath;
  }
}
