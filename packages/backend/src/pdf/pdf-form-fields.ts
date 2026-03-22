/**
 * Server-side form field definitions per consent type.
 * Mirrors the frontend form-fields.ts config for PDF rendering.
 */

export type FieldType = 'text' | 'textarea' | 'checkbox' | 'select' | 'checkbox-group' | 'yes-no-chips' | 'condition-grid' | 'medication-tags';

export interface PdfFormField {
  name: string;
  labelKey: string;
  type: FieldType;
  optionKeys?: string[];
  chipKeys?: string[];
}

const ALLERGY_CHIPS = [
  'penicillin', 'latex', 'nickel', 'fragrances',
  'preservatives', 'localAnesthetics', 'sulfonamides', 'nsaids',
];

const CONDITION_KEYS = [
  'hypertension', 'heartDisease', 'diabetes', 'thyroid',
  'eczema', 'psoriasis', 'rosacea', 'keloidScarring', 'coldSores',
  'lupus', 'rheumatoidArthritis', 'immunosuppression',
  'cancer', 'bloodClotting',
];

const commonMedical: PdfFormField[] = [
  { name: 'allergies', labelKey: 'allergies', type: 'yes-no-chips', chipKeys: ALLERGY_CHIPS },
  { name: 'medications', labelKey: 'medications', type: 'medication-tags' },
  { name: 'medicalHistory', labelKey: 'medicalHistory', type: 'condition-grid', chipKeys: CONDITION_KEYS },
  { name: 'pregnant', labelKey: 'pregnant', type: 'checkbox' },
  { name: 'bloodThinners', labelKey: 'bloodThinners', type: 'checkbox' },
];

const formFields: Record<string, PdfFormField[]> = {
  BOTOX: [
    { name: 'treatmentAreas', labelKey: 'treatmentAreas', type: 'checkbox-group', optionKeys: ['forehead', 'glabella', 'crowsFeet', 'bunnyLines', 'chin', 'masseter'] },
    ...commonMedical,
    { name: 'previousBotox', labelKey: 'previousBotox', type: 'text' },
  ],
  FILLER: [
    { name: 'treatmentAreas', labelKey: 'treatmentAreas', type: 'checkbox-group', optionKeys: ['lips', 'nasolabialFold', 'cheeks', 'chin', 'tearTrough', 'jawline'] },
    { name: 'fillerType', labelKey: 'fillerType', type: 'select', optionKeys: ['hyaluronicAcid', 'calciumHydroxylapatite', 'other'] },
    ...commonMedical,
  ],
  LASER: [
    { name: 'treatmentAreas', labelKey: 'treatmentAreas', type: 'checkbox-group', optionKeys: ['face', 'neck', 'decollete', 'hands', 'other'] },
    { name: 'skinType', labelKey: 'skinType', type: 'select', optionKeys: ['fitzpatrickI', 'fitzpatrickII', 'fitzpatrickIII', 'fitzpatrickIV', 'fitzpatrickV', 'fitzpatrickVI'] },
    ...commonMedical,
    { name: 'recentSunExposure', labelKey: 'recentSunExposure', type: 'checkbox' },
  ],
  CHEMICAL_PEEL: [
    { name: 'treatmentAreas', labelKey: 'treatmentAreas', type: 'checkbox-group', optionKeys: ['face', 'neck', 'hands'] },
    { name: 'peelType', labelKey: 'peelType', type: 'select', optionKeys: ['superficial', 'medium', 'deep'] },
    ...commonMedical,
  ],
  MICRONEEDLING: [
    { name: 'treatmentAreas', labelKey: 'treatmentAreas', type: 'checkbox-group', optionKeys: ['face', 'neck', 'decollete', 'scalp'] },
    ...commonMedical,
    { name: 'activeInfections', labelKey: 'activeInfections', type: 'checkbox' },
  ],
  PRP: [
    { name: 'treatmentAreas', labelKey: 'treatmentAreas', type: 'checkbox-group', optionKeys: ['face', 'scalpHairLoss', 'joints'] },
    ...commonMedical,
    { name: 'bloodDisorders', labelKey: 'bloodDisorders', type: 'checkbox' },
  ],
};

export function getFormFieldsForType(type: string): PdfFormField[] {
  return formFields[type] || commonMedical;
}
