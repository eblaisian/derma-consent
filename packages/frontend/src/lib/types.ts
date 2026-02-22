export type ConsentStatus =
  | 'PENDING'
  | 'FILLED'
  | 'SIGNED'
  | 'PAID'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'REVOKED';

export type ConsentType =
  | 'BOTOX'
  | 'FILLER'
  | 'LASER'
  | 'CHEMICAL_PEEL'
  | 'MICRONEEDLING'
  | 'PRP';

export interface Practice {
  id: string;
  name: string;
  dsgvoContact: string;
  publicKey: JsonWebKey;
  encryptedPrivKey: {
    salt: string;
    iv: string;
    ciphertext: string;
  };
  gdtSenderId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentFormSummary {
  id: string;
  token: string;
  type: ConsentType;
  status: ConsentStatus;
  expiresAt: string;
  createdAt: string;
  signatureTimestamp: string | null;
}

// --- Photos ---

export type PhotoType = 'BEFORE' | 'AFTER';

export type BodyRegion =
  | 'FOREHEAD'
  | 'GLABELLA'
  | 'PERIORBITAL'
  | 'CHEEKS'
  | 'NASOLABIAL'
  | 'LIPS'
  | 'CHIN'
  | 'JAWLINE'
  | 'NECK'
  | 'DECOLLETE'
  | 'HANDS'
  | 'SCALP'
  | 'OTHER';

export interface TreatmentPhotoSummary {
  id: string;
  type: PhotoType;
  bodyRegion: BodyRegion;
  encryptedSessionKey: string;
  encryptedMetadata: { iv: string; ciphertext: string } | null;
  photoConsentGranted: boolean;
  takenAt: string;
  createdAt: string;
  treatmentPlanId: string | null;
  consentFormId: string | null;
}

// --- Treatment Plans ---

export interface InjectionPoint {
  id: string;
  x: number; // 0-100% on diagram
  y: number; // 0-100% on diagram
  product: string;
  units: number;
  batchNumber: string;
  technique: string;
  notes: string;
}

export type DiagramType = 'face-front' | 'face-side' | 'body-front';

export interface TreatmentPlanData {
  diagramType: DiagramType;
  points: InjectionPoint[];
  totalUnits: number;
  overallNotes: string;
}

export interface TreatmentPlanSummary {
  id: string;
  type: ConsentType;
  encryptedSessionKey: string;
  encryptedData: { iv: string; ciphertext: string };
  encryptedSummary: { iv: string; ciphertext: string } | null;
  performedAt: string | null;
  createdAt: string;
  consentFormId: string | null;
  templateId: string | null;
}

export interface TreatmentTemplateSummary {
  id: string;
  name: string;
  type: ConsentType;
  bodyRegion: BodyRegion;
  templateData: TreatmentPlanData;
  createdAt: string;
}
