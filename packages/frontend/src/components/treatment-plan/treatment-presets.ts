import type {
  TreatmentPreset,
  ConsentType,
  DiagramType,
  InjectionPoint,
} from '@/lib/types';

// --- Botox Presets ---

const glabellarComplex: TreatmentPreset = {
  id: 'botox-glabellar',
  nameKey: 'glabellarComplex',
  consentType: 'BOTOX',
  diagramType: 'botox-face-front',
  totalUnits: 20,
  sites: [
    { x: 50, y: 30.5, muscle: 'procerus', units: 4, product: 'Botox', technique: 'bolus' },
    { x: 42, y: 28.5, muscle: 'corrugator', units: 4, product: 'Botox', technique: 'bolus' },
    { x: 58, y: 28.5, muscle: 'corrugator', units: 4, product: 'Botox', technique: 'bolus' },
    { x: 39, y: 26, muscle: 'corrugator', units: 4, product: 'Botox', technique: 'bolus' },
    { x: 61, y: 26, muscle: 'corrugator', units: 4, product: 'Botox', technique: 'bolus' },
  ],
};

const frontalis: TreatmentPreset = {
  id: 'botox-frontalis',
  nameKey: 'frontalis',
  consentType: 'BOTOX',
  diagramType: 'botox-face-front',
  totalUnits: 20,
  sites: [
    { x: 30, y: 18, muscle: 'frontalis', units: 2.5, product: 'Botox', technique: 'bolus' },
    { x: 38, y: 16, muscle: 'frontalis', units: 2.5, product: 'Botox', technique: 'bolus' },
    { x: 46, y: 15, muscle: 'frontalis', units: 2.5, product: 'Botox', technique: 'bolus' },
    { x: 54, y: 15, muscle: 'frontalis', units: 2.5, product: 'Botox', technique: 'bolus' },
    { x: 62, y: 16, muscle: 'frontalis', units: 2.5, product: 'Botox', technique: 'bolus' },
    { x: 70, y: 18, muscle: 'frontalis', units: 2.5, product: 'Botox', technique: 'bolus' },
    { x: 34, y: 22, muscle: 'frontalis', units: 2.5, product: 'Botox', technique: 'bolus' },
    { x: 66, y: 22, muscle: 'frontalis', units: 2.5, product: 'Botox', technique: 'bolus' },
  ],
};

const crowsFeet: TreatmentPreset = {
  id: 'botox-crows-feet',
  nameKey: 'crowsFeet',
  consentType: 'BOTOX',
  diagramType: 'botox-face-front',
  totalUnits: 24,
  sites: [
    { x: 19, y: 33, muscle: 'orbicularisOculi', units: 4, product: 'Botox', technique: 'bolus' },
    { x: 17, y: 36, muscle: 'orbicularisOculi', units: 4, product: 'Botox', technique: 'bolus' },
    { x: 19, y: 39, muscle: 'orbicularisOculi', units: 4, product: 'Botox', technique: 'bolus' },
    { x: 81, y: 33, muscle: 'orbicularisOculi', units: 4, product: 'Botox', technique: 'bolus' },
    { x: 83, y: 36, muscle: 'orbicularisOculi', units: 4, product: 'Botox', technique: 'bolus' },
    { x: 81, y: 39, muscle: 'orbicularisOculi', units: 4, product: 'Botox', technique: 'bolus' },
  ],
};

const fullUpperFace: TreatmentPreset = {
  id: 'botox-full-upper',
  nameKey: 'fullUpperFace',
  consentType: 'BOTOX',
  diagramType: 'botox-face-front',
  totalUnits: 64,
  sites: [
    ...glabellarComplex.sites,
    ...frontalis.sites,
    ...crowsFeet.sites,
  ],
};

const masseter: TreatmentPreset = {
  id: 'botox-masseter',
  nameKey: 'masseter',
  consentType: 'BOTOX',
  diagramType: 'botox-face-front',
  totalUnits: 50,
  sites: [
    { x: 18, y: 62, muscle: 'masseter', units: 8, product: 'Botox', technique: 'bolus' },
    { x: 20, y: 66, muscle: 'masseter', units: 9, product: 'Botox', technique: 'bolus' },
    { x: 18, y: 70, muscle: 'masseter', units: 8, product: 'Botox', technique: 'bolus' },
    { x: 82, y: 62, muscle: 'masseter', units: 8, product: 'Botox', technique: 'bolus' },
    { x: 80, y: 66, muscle: 'masseter', units: 9, product: 'Botox', technique: 'bolus' },
    { x: 82, y: 70, muscle: 'masseter', units: 8, product: 'Botox', technique: 'bolus' },
  ],
};

const lipFlip: TreatmentPreset = {
  id: 'botox-lip-flip',
  nameKey: 'lipFlip',
  consentType: 'BOTOX',
  diagramType: 'botox-face-front',
  totalUnits: 4,
  sites: [
    { x: 46, y: 60, muscle: 'orbicularisOris', units: 1, product: 'Botox', technique: 'micro_droplet' },
    { x: 50, y: 59.5, muscle: 'orbicularisOris', units: 1, product: 'Botox', technique: 'micro_droplet' },
    { x: 54, y: 60, muscle: 'orbicularisOris', units: 1, product: 'Botox', technique: 'micro_droplet' },
    { x: 50, y: 61.5, muscle: 'orbicularisOris', units: 1, product: 'Botox', technique: 'micro_droplet' },
  ],
};

const bunnyLines: TreatmentPreset = {
  id: 'botox-bunny-lines',
  nameKey: 'bunnyLines',
  consentType: 'BOTOX',
  diagramType: 'botox-face-front',
  totalUnits: 4,
  sites: [
    { x: 44, y: 44, muscle: 'nasalis', units: 2, product: 'Botox', technique: 'bolus' },
    { x: 56, y: 44, muscle: 'nasalis', units: 2, product: 'Botox', technique: 'bolus' },
  ],
};

const nefertitiLift: TreatmentPreset = {
  id: 'botox-nefertiti',
  nameKey: 'nefertitiLift',
  consentType: 'BOTOX',
  diagramType: 'botox-face-side',
  totalUnits: 30,
  sites: [
    { x: 32, y: 72, muscle: 'platysma', units: 3, product: 'Botox', technique: 'bolus' },
    { x: 37, y: 74, muscle: 'platysma', units: 3, product: 'Botox', technique: 'bolus' },
    { x: 42, y: 76, muscle: 'platysma', units: 3, product: 'Botox', technique: 'bolus' },
    { x: 48, y: 78, muscle: 'platysma', units: 3, product: 'Botox', technique: 'bolus' },
    { x: 54, y: 79, muscle: 'platysma', units: 3, product: 'Botox', technique: 'bolus' },
    { x: 60, y: 80, muscle: 'platysma', units: 3, product: 'Botox', technique: 'bolus' },
    { x: 65, y: 79, muscle: 'platysma', units: 3, product: 'Botox', technique: 'bolus' },
    { x: 70, y: 78, muscle: 'platysma', units: 3, product: 'Botox', technique: 'bolus' },
    { x: 74, y: 76, muscle: 'platysma', units: 3, product: 'Botox', technique: 'bolus' },
    { x: 78, y: 74, muscle: 'platysma', units: 3, product: 'Botox', technique: 'bolus' },
  ],
};

// --- Filler Presets ---

const lipEnhancement: TreatmentPreset = {
  id: 'filler-lips',
  nameKey: 'lipEnhancement',
  consentType: 'FILLER',
  diagramType: 'filler-face-front',
  totalUnits: 1,
  sites: [
    { x: 44, y: 61, muscle: 'lips', units: 0.15, product: 'Juvederm Ultra', technique: 'linear_threading' },
    { x: 50, y: 59.5, muscle: 'lips', units: 0.2, product: 'Juvederm Ultra', technique: 'linear_threading' },
    { x: 56, y: 61, muscle: 'lips', units: 0.15, product: 'Juvederm Ultra', technique: 'linear_threading' },
    { x: 44, y: 63, muscle: 'lips', units: 0.15, product: 'Juvederm Ultra', technique: 'linear_threading' },
    { x: 50, y: 64, muscle: 'lips', units: 0.2, product: 'Juvederm Ultra', technique: 'linear_threading' },
    { x: 56, y: 63, muscle: 'lips', units: 0.15, product: 'Juvederm Ultra', technique: 'linear_threading' },
  ],
};

const cheekAugmentation: TreatmentPreset = {
  id: 'filler-cheeks',
  nameKey: 'cheekAugmentation',
  consentType: 'FILLER',
  diagramType: 'filler-face-front',
  totalUnits: 2,
  sites: [
    { x: 26, y: 44, muscle: 'cheeks', units: 0.5, product: 'Juvederm Voluma', technique: 'bolus' },
    { x: 30, y: 48, muscle: 'cheeks', units: 0.5, product: 'Juvederm Voluma', technique: 'bolus' },
    { x: 74, y: 44, muscle: 'cheeks', units: 0.5, product: 'Juvederm Voluma', technique: 'bolus' },
    { x: 70, y: 48, muscle: 'cheeks', units: 0.5, product: 'Juvederm Voluma', technique: 'bolus' },
  ],
};

const nasolabialFolds: TreatmentPreset = {
  id: 'filler-nasolabial',
  nameKey: 'nasolabialFolds',
  consentType: 'FILLER',
  diagramType: 'filler-face-front',
  totalUnits: 1,
  sites: [
    { x: 40, y: 53, muscle: 'nasolabialFold', units: 0.25, product: 'Restylane', technique: 'linear_threading' },
    { x: 38, y: 58, muscle: 'nasolabialFold', units: 0.25, product: 'Restylane', technique: 'linear_threading' },
    { x: 60, y: 53, muscle: 'nasolabialFold', units: 0.25, product: 'Restylane', technique: 'linear_threading' },
    { x: 62, y: 58, muscle: 'nasolabialFold', units: 0.25, product: 'Restylane', technique: 'linear_threading' },
  ],
};

const chinAugmentation: TreatmentPreset = {
  id: 'filler-chin',
  nameKey: 'chinAugmentation',
  consentType: 'FILLER',
  diagramType: 'filler-face-front',
  totalUnits: 1,
  sites: [
    { x: 48, y: 76, muscle: 'chin', units: 0.5, product: 'Juvederm Voluma', technique: 'bolus' },
    { x: 52, y: 76, muscle: 'chin', units: 0.5, product: 'Juvederm Voluma', technique: 'bolus' },
  ],
};

const jawlineContouring: TreatmentPreset = {
  id: 'filler-jawline',
  nameKey: 'jawlineContouring',
  consentType: 'FILLER',
  diagramType: 'filler-face-front',
  totalUnits: 2,
  sites: [
    { x: 22, y: 68, muscle: 'jawline', units: 0.35, product: 'Juvederm Voluma', technique: 'bolus' },
    { x: 28, y: 72, muscle: 'jawline', units: 0.35, product: 'Juvederm Voluma', technique: 'bolus' },
    { x: 36, y: 74, muscle: 'jawline', units: 0.3, product: 'Juvederm Voluma', technique: 'bolus' },
    { x: 78, y: 68, muscle: 'jawline', units: 0.35, product: 'Juvederm Voluma', technique: 'bolus' },
    { x: 72, y: 72, muscle: 'jawline', units: 0.35, product: 'Juvederm Voluma', technique: 'bolus' },
    { x: 64, y: 74, muscle: 'jawline', units: 0.3, product: 'Juvederm Voluma', technique: 'bolus' },
  ],
};

const tearTroughCorrection: TreatmentPreset = {
  id: 'filler-tear-trough',
  nameKey: 'tearTroughCorrection',
  consentType: 'FILLER',
  diagramType: 'filler-face-front',
  totalUnits: 0.5,
  sites: [
    { x: 36, y: 40, muscle: 'tearTrough', units: 0.25, product: 'Belotero', technique: 'serial_puncture' },
    { x: 64, y: 40, muscle: 'tearTrough', units: 0.25, product: 'Belotero', technique: 'serial_puncture' },
  ],
};

// --- All Presets ---

export const TREATMENT_PRESETS: TreatmentPreset[] = [
  glabellarComplex,
  frontalis,
  crowsFeet,
  fullUpperFace,
  masseter,
  lipFlip,
  bunnyLines,
  nefertitiLift,
  lipEnhancement,
  cheekAugmentation,
  nasolabialFolds,
  chinAugmentation,
  jawlineContouring,
  tearTroughCorrection,
];

/** Get presets matching a given consent type */
export function getPresetsForConsentType(consentType: ConsentType): TreatmentPreset[] {
  return TREATMENT_PRESETS.filter((p) => p.consentType === consentType);
}

/** Convert a preset into InjectionPoint[] ready for the editor */
export function applyPreset(preset: TreatmentPreset): InjectionPoint[] {
  return preset.sites.map((site) => ({
    id: crypto.randomUUID(),
    x: site.x,
    y: site.y,
    product: site.product,
    units: site.units,
    batchNumber: '',
    technique: site.technique,
    notes: '',
    muscle: site.muscle,
  }));
}

/** Return the recommended default diagram type for a consent type */
export function getDefaultDiagramType(consentType: ConsentType): DiagramType {
  switch (consentType) {
    case 'BOTOX':
      return 'botox-face-front';
    case 'FILLER':
      return 'filler-face-front';
    default:
      return 'face-front';
  }
}

/** Return the set of diagram types relevant to a consent type */
export function getDiagramTypesForConsent(consentType: ConsentType): DiagramType[] {
  switch (consentType) {
    case 'BOTOX':
      return ['botox-face-front', 'botox-face-side', 'face-front', 'face-side', 'body-front'];
    case 'FILLER':
      return ['filler-face-front', 'face-front', 'face-side', 'body-front'];
    default:
      return ['face-front', 'face-side', 'body-front'];
  }
}
