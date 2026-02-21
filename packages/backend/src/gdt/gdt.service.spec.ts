import { GdtService } from './gdt.service';
import { Satzart, FieldId, GdtField } from './gdt.types';
import { GDT_ENCODING, CRLF } from './gdt.constants';

describe('GdtService', () => {
  let service: GdtService;

  beforeEach(() => {
    service = new GdtService();
  });

  describe('formatLine', () => {
    it('should format a simple line with correct 3-digit byte length', () => {
      const line = service.formatLine('8000', '6310');
      // length: 3 (length) + 4 (fieldId) + 4 (content) + 2 (CRLF) = 13
      expect(line).toBe('0138000' + '6310' + CRLF);
    });

    it('should compute byte length using ISO-8859-1, not UTF-8', () => {
      // 'ü' is 1 byte in latin1 (0xFC), but 2 bytes in UTF-8 (0xC3 0xBC)
      const line = service.formatLine('3101', 'Müller');
      // length: 3 + 4 + 6 (Müller is 6 bytes in latin1) + 2 = 15
      expect(line).toBe('0153101' + 'Müller' + CRLF);
    });

    it('should handle empty value', () => {
      const line = service.formatLine('8410', '');
      // length: 3 + 4 + 0 + 2 = 9
      expect(line).toBe('0098410' + CRLF);
    });
  });

  describe('generateRecord', () => {
    it('should produce a valid GDT record buffer in ISO-8859-1', () => {
      const buffer = service.generateRecord({
        satzart: Satzart.UNTERSUCHUNGSDATEN_UEBERMITTELN,
        senderId: 'DERM01',
        receiverId: 'PVS01',
        fields: [
          { fieldId: FieldId.PATIENT_NUMMER, value: '12345' },
          { fieldId: FieldId.PATIENT_NAME, value: 'Schmidt' },
        ],
      });

      expect(buffer).toBeInstanceOf(Buffer);
      const text = buffer.toString(GDT_ENCODING);

      // Should start with Satzart line
      expect(text).toMatch(/^\d{3}8000/);

      // Should contain Satzart 6310
      expect(text).toContain('80006310');

      // Should contain Satzlaenge
      expect(text).toContain('8100');

      // Should contain patient fields
      expect(text).toContain('300012345');
      expect(text).toContain('3101Schmidt');
    });

    it('should encode umlauts as single bytes (ISO-8859-1)', () => {
      const buffer = service.generateRecord({
        satzart: Satzart.STAMMDATEN_UEBERMITTELN,
        senderId: 'DERM01',
        receiverId: 'PVS01',
        fields: [
          { fieldId: FieldId.PATIENT_NAME, value: 'Müller' },
          { fieldId: FieldId.PATIENT_VORNAME, value: 'Jürgen' },
        ],
      });

      // 'ü' should be 0xFC in ISO-8859-1, NOT 0xC3 0xBC (UTF-8)
      const bytes = Array.from(buffer);

      // Find 'ü' occurrences - should be 0xFC
      const umlautBytes = bytes.filter((b) => b === 0xfc);
      expect(umlautBytes.length).toBe(2); // one in Müller, one in Jürgen

      // Should NOT contain the UTF-8 sequence 0xC3 0xBC
      for (let i = 0; i < bytes.length - 1; i++) {
        if (bytes[i] === 0xc3 && bytes[i + 1] === 0xbc) {
          fail('Found UTF-8 encoding of ü (0xC3 0xBC) - should be latin1 (0xFC)');
        }
      }
    });

    it('should have accurate Satzlaenge matching actual byte count', () => {
      const buffer = service.generateRecord({
        satzart: Satzart.UNTERSUCHUNGSDATEN_UEBERMITTELN,
        senderId: 'DERM01',
        receiverId: 'PVS01',
        fields: [
          { fieldId: FieldId.PATIENT_NUMMER, value: '999' },
        ],
      });

      const text = buffer.toString(GDT_ENCODING);
      const lines = text.split(CRLF).filter((l) => l.length > 0);

      // Find Satzlaenge line
      const satzlaengeLine = lines.find((l) => l.substring(3, 7) === '8100');
      expect(satzlaengeLine).toBeDefined();

      const declaredLength = parseInt(satzlaengeLine!.substring(7), 10);
      const actualLength = buffer.length;

      expect(declaredLength).toBe(actualLength);
    });
  });

  describe('parseRecord', () => {
    it('should round-trip: generate then parse back', () => {
      const inputFields: GdtField[] = [
        { fieldId: FieldId.PATIENT_NUMMER, value: '42' },
        { fieldId: FieldId.PATIENT_NAME, value: 'Böhm' },
        { fieldId: FieldId.PATIENT_VORNAME, value: 'Günter' },
        { fieldId: FieldId.BEFUND, value: 'https://example.com/consent/abc' },
      ];

      const buffer = service.generateRecord({
        satzart: Satzart.UNTERSUCHUNGSDATEN_UEBERMITTELN,
        senderId: 'DERM01',
        receiverId: 'PVS01',
        fields: inputFields,
      });

      const parsed = service.parseRecord(buffer);

      expect(parsed.satzart).toBe(Satzart.UNTERSUCHUNGSDATEN_UEBERMITTELN);

      // Check that all input fields are present in parsed result
      for (const inputField of inputFields) {
        const found = parsed.fields.find(
          (f) => f.fieldId === inputField.fieldId && f.value === inputField.value,
        );
        expect(found).toBeDefined();
      }
    });

    it('should preserve umlauts through round-trip', () => {
      const buffer = service.generateRecord({
        satzart: Satzart.STAMMDATEN_UEBERMITTELN,
        senderId: 'S',
        receiverId: 'R',
        fields: [
          { fieldId: FieldId.PATIENT_NAME, value: 'Größe' },
        ],
      });

      const parsed = service.parseRecord(buffer);
      const nameField = parsed.fields.find(
        (f) => f.fieldId === FieldId.PATIENT_NAME,
      );
      expect(nameField?.value).toBe('Größe');
    });

    it('should throw on invalid record without Satzart', () => {
      const badBuffer = Buffer.from('0098100123' + CRLF, GDT_ENCODING);
      expect(() => service.parseRecord(badBuffer)).toThrow('missing Satzart');
    });
  });

  describe('generateConsentResultRecord', () => {
    it('should produce a valid 6310 consent result', () => {
      const buffer = service.generateConsentResultRecord({
        senderId: 'DERMACONSENT',
        receiverId: 'TURBOMED',
        patientId: 'P-1001',
        patientName: 'Müller',
        patientVorname: 'Anna',
        patientGeburtsdatum: '15031990',
        consentType: 'BOTOX',
        resultUrl: 'https://app.dermaconsent.de/result/abc123',
        status: 'SIGNED',
      });

      const parsed = service.parseRecord(buffer);
      expect(parsed.satzart).toBe(Satzart.UNTERSUCHUNGSDATEN_UEBERMITTELN);

      const testIdent = parsed.fields.find(
        (f) => f.fieldId === FieldId.TEST_IDENT,
      );
      expect(testIdent?.value).toBe('CONSENT');

      const result = parsed.fields.find(
        (f) => f.fieldId === FieldId.ERGEBNIS_WERT,
      );
      expect(result?.value).toBe('SIGNED');
    });

    it('should work without optional Geburtsdatum', () => {
      const buffer = service.generateConsentResultRecord({
        senderId: 'S',
        receiverId: 'R',
        patientId: 'P1',
        patientName: 'Test',
        patientVorname: 'Max',
        consentType: 'LASER',
        resultUrl: 'https://example.com',
        status: 'COMPLETED',
      });

      const parsed = service.parseRecord(buffer);
      const dobField = parsed.fields.find(
        (f) => f.fieldId === FieldId.PATIENT_GEBURTSDATUM,
      );
      expect(dobField).toBeUndefined();
    });
  });

  describe('field ordering', () => {
    it('should place Satzart first and Satzlaenge second', () => {
      const buffer = service.generateRecord({
        satzart: Satzart.STAMMDATEN_ANFORDERN,
        senderId: 'A',
        receiverId: 'B',
        fields: [],
      });

      const text = buffer.toString(GDT_ENCODING);
      const lines = text.split(CRLF).filter((l) => l.length > 0);

      expect(lines[0].substring(3, 7)).toBe(FieldId.SATZART);
      expect(lines[1].substring(3, 7)).toBe(FieldId.SATZLAENGE);
    });
  });
});
