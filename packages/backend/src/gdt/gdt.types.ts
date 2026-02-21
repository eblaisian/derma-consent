/** GDT 2.1 Satzarten (Record Types) */
export enum Satzart {
  /** Stammdaten anfordern */
  STAMMDATEN_ANFORDERN = '6300',
  /** Stammdaten übermitteln */
  STAMMDATEN_UEBERMITTELN = '6301',
  /** Neue Untersuchung anfordern */
  NEUE_UNTERSUCHUNG_ANFORDERN = '6302',
  /** Untersuchungsdaten übermitteln */
  UNTERSUCHUNGSDATEN_UEBERMITTELN = '6310',
  /** Daten einer Untersuchung zeigen */
  DATEN_ZEIGEN = '6311',
}

/** GDT 2.1 Field Identifiers (Feldkennungen) */
export enum FieldId {
  /** Satzidentifikation */
  SATZART = '8000',
  /** Satzlänge */
  SATZLAENGE = '8100',
  /** GDT-ID des Senders */
  GDT_ID_SENDER = '8315',
  /** GDT-ID des Empfängers */
  GDT_ID_EMPFAENGER = '8316',
  /** Zeichensatz */
  ZEICHENSATZ = '9206',
  /** GDT-Version */
  GDT_VERSION = '9218',
  /** Patient: Nummer */
  PATIENT_NUMMER = '3000',
  /** Patient: Name */
  PATIENT_NAME = '3101',
  /** Patient: Vorname */
  PATIENT_VORNAME = '3102',
  /** Patient: Geburtsdatum (DDMMYYYY) */
  PATIENT_GEBURTSDATUM = '3103',
  /** Patient: Geschlecht (1=M, 2=W) */
  PATIENT_GESCHLECHT = '3110',
  /** Befund / Fremdbefund */
  BEFUND = '6228',
  /** Testident */
  TEST_IDENT = '8410',
  /** Testbezeichnung */
  TEST_BEZEICHNUNG = '8411',
  /** Ergebniswert */
  ERGEBNIS_WERT = '8420',
  /** Einheit */
  EINHEIT = '8421',
  /** Kommentar */
  KOMMENTAR = '6227',
}

export interface GdtField {
  fieldId: string;
  value: string;
}

export interface GdtRecord {
  satzart: Satzart;
  fields: GdtField[];
}

export interface GenerateRecordOptions {
  satzart: Satzart;
  senderId: string;
  receiverId: string;
  fields: GdtField[];
}

export interface ConsentResultOptions {
  senderId: string;
  receiverId: string;
  patientId: string;
  patientName: string;
  patientVorname: string;
  patientGeburtsdatum?: string;
  consentType: string;
  resultUrl: string;
  status: string;
}
