import { Injectable } from '@nestjs/common';
import {
  GdtField,
  GdtRecord,
  GenerateRecordOptions,
  ConsentResultOptions,
  Satzart,
  FieldId,
} from './gdt.types';
import {
  CRLF,
  GDT_VERSION,
  GDT_ENCODING,
  CHARSET_ISO_8859_1,
} from './gdt.constants';

@Injectable()
export class GdtService {
  /**
   * Formats a single GDT line.
   * Format: [3-digit byte length][4-digit field ID][content]\r\n
   * Byte length is computed on ISO-8859-1 encoding, not UTF-8.
   */
  formatLine(fieldId: string, value: string): string {
    // Calculate byte length in latin1: length_field(3) + fieldId(4) + content_bytes + CRLF(2)
    const contentByteLength = Buffer.byteLength(value, GDT_ENCODING);
    const totalLength = 3 + 4 + contentByteLength + 2; // 3 for length, 4 for fieldId, 2 for CRLF
    const lengthStr = totalLength.toString().padStart(3, '0');
    return `${lengthStr}${fieldId}${value}${CRLF}`;
  }

  /**
   * Generates a complete GDT record with header fields (Satzart, version, charset, sender/receiver)
   * and user-provided fields. Returns a Buffer encoded in ISO-8859-1.
   */
  generateRecord(options: GenerateRecordOptions): Buffer {
    const { satzart, senderId, receiverId, fields } = options;

    // Build all lines except Satzart and Satzlaenge first
    const headerFields: GdtField[] = [
      { fieldId: FieldId.GDT_VERSION, value: GDT_VERSION },
      { fieldId: FieldId.ZEICHENSATZ, value: CHARSET_ISO_8859_1 },
      { fieldId: FieldId.GDT_ID_SENDER, value: senderId },
      { fieldId: FieldId.GDT_ID_EMPFAENGER, value: receiverId },
    ];

    const allContentFields = [...headerFields, ...fields];

    // Format all content lines
    const contentLines = allContentFields.map((f) =>
      this.formatLine(f.fieldId, f.value),
    );

    // Calculate Satzart line
    const satzartLine = this.formatLine(FieldId.SATZART, satzart);

    // Calculate total record length in bytes (latin1)
    // Satzlaenge includes everything: satzart line + satzlaenge line + all content lines
    const contentBytes = contentLines.reduce(
      (sum, line) => sum + Buffer.byteLength(line, GDT_ENCODING),
      0,
    );
    const satzartBytes = Buffer.byteLength(satzartLine, GDT_ENCODING);

    // Satzlaenge line itself: 3 + 4 + length_of_value + 2
    // We need to figure out the value first, which depends on total length (circular)
    // The value is the total byte count as a string
    // Satzlaenge = satzartLine + satzlaengeLine + contentLines
    // satzlaengeLine = "NNN8100VVVVV\r\n" where VVVVV is the total
    // We iterate: estimate, then check
    let satzlaengeValue = (satzartBytes + contentBytes + 20).toString(); // initial estimate
    let satzlaengeLine = this.formatLine(FieldId.SATZLAENGE, satzlaengeValue);
    let total =
      satzartBytes +
      Buffer.byteLength(satzlaengeLine, GDT_ENCODING) +
      contentBytes;

    // Re-calculate if the length string changed the total
    satzlaengeValue = total.toString();
    satzlaengeLine = this.formatLine(FieldId.SATZLAENGE, satzlaengeValue);
    total =
      satzartBytes +
      Buffer.byteLength(satzlaengeLine, GDT_ENCODING) +
      contentBytes;

    // Final pass in case digit count changed
    if (total.toString() !== satzlaengeValue) {
      satzlaengeValue = total.toString();
      satzlaengeLine = this.formatLine(FieldId.SATZLAENGE, satzlaengeValue);
    }

    const fullRecord = satzartLine + satzlaengeLine + contentLines.join('');
    return Buffer.from(fullRecord, GDT_ENCODING);
  }

  /**
   * Convenience method to generate a Satzart 6310 (Untersuchungsdaten übermitteln)
   * record for a consent result.
   */
  generateConsentResultRecord(options: ConsentResultOptions): Buffer {
    const fields: GdtField[] = [
      { fieldId: FieldId.PATIENT_NUMMER, value: options.patientId },
      { fieldId: FieldId.PATIENT_NAME, value: options.patientName },
      { fieldId: FieldId.PATIENT_VORNAME, value: options.patientVorname },
    ];

    if (options.patientGeburtsdatum) {
      fields.push({
        fieldId: FieldId.PATIENT_GEBURTSDATUM,
        value: options.patientGeburtsdatum,
      });
    }

    fields.push(
      { fieldId: FieldId.TEST_IDENT, value: 'CONSENT' },
      {
        fieldId: FieldId.TEST_BEZEICHNUNG,
        value: `Einwilligung ${options.consentType}`,
      },
      { fieldId: FieldId.ERGEBNIS_WERT, value: options.status },
      { fieldId: FieldId.BEFUND, value: options.resultUrl },
    );

    return this.generateRecord({
      satzart: Satzart.UNTERSUCHUNGSDATEN_UEBERMITTELN,
      senderId: options.senderId,
      receiverId: options.receiverId,
      fields,
    });
  }

  /**
   * Parses a GDT buffer (ISO-8859-1 encoded) back into a structured record.
   */
  parseRecord(buffer: Buffer): GdtRecord {
    const content = buffer.toString(GDT_ENCODING);
    const lines = content.split(CRLF).filter((line) => line.length > 0);

    let satzart: Satzart | undefined;
    const fields: GdtField[] = [];

    for (const line of lines) {
      if (line.length < 7) continue; // minimum: 3 length + 4 fieldId

      const fieldId = line.substring(3, 7);
      const value = line.substring(7);

      if (fieldId === FieldId.SATZART) {
        satzart = value as Satzart;
      } else if (fieldId !== FieldId.SATZLAENGE) {
        fields.push({ fieldId, value });
      }
    }

    if (!satzart) {
      throw new Error('Invalid GDT record: missing Satzart (8000)');
    }

    return { satzart, fields };
  }
}
