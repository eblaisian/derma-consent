export type ConsentType =
  | 'BOTOX'
  | 'FILLER'
  | 'LASER'
  | 'CHEMICAL_PEEL'
  | 'MICRONEEDLING'
  | 'PRP';

export interface FormFieldConfig {
  name: string;
  labelKey: string;
  type: 'text' | 'textarea' | 'checkbox' | 'select' | 'checkbox-group' | 'yes-no-chips' | 'condition-grid' | 'medication-tags';
  required?: boolean;
  optionKeys?: string[];
  /** Chip/condition keys for interactive field types */
  chipKeys?: string[];
}

// Common allergens for dermatology
const ALLERGY_CHIPS = [
  'penicillin', 'latex', 'nickel', 'fragrances',
  'preservatives', 'localAnesthetics', 'sulfonamides', 'nsaids',
];

// Common medical conditions relevant to dermatology procedures
const CONDITION_KEYS = [
  'hypertension', 'heartDisease', 'diabetes', 'thyroid',
  'eczema', 'psoriasis', 'rosacea', 'keloidScarring', 'coldSores',
  'lupus', 'rheumatoidArthritis', 'immunosuppression',
  'cancer', 'bloodClotting',
  'noneOfAbove',
];

const commonMedicalFields: FormFieldConfig[] = [
  {
    name: 'allergies',
    labelKey: 'allergies',
    type: 'yes-no-chips',
    required: true,
    chipKeys: ALLERGY_CHIPS,
  },
  {
    name: 'medications',
    labelKey: 'medications',
    type: 'medication-tags',
    required: false,
  },
  {
    name: 'medicalHistory',
    labelKey: 'medicalHistory',
    type: 'condition-grid',
    required: true,
    chipKeys: CONDITION_KEYS,
  },
  {
    name: 'pregnant',
    labelKey: 'pregnant',
    type: 'checkbox',
    required: false,
  },
  {
    name: 'bloodThinners',
    labelKey: 'bloodThinners',
    type: 'checkbox',
    required: false,
  },
];

const consentFormFields: Record<ConsentType, FormFieldConfig[]> = {
  BOTOX: [
    {
      name: 'treatmentAreas',
      labelKey: 'treatmentAreas',
      type: 'checkbox-group',
      required: true,
      optionKeys: [
        'forehead',
        'glabella',
        'crowsFeet',
        'bunnyLines',
        'chin',
        'masseter',
      ],
    },
    ...commonMedicalFields,
    {
      name: 'previousBotox',
      labelKey: 'previousBotox',
      type: 'text',
      required: false,
    },
  ],
  FILLER: [
    {
      name: 'treatmentAreas',
      labelKey: 'treatmentAreas',
      type: 'checkbox-group',
      required: true,
      optionKeys: [
        'lips',
        'nasolabialFold',
        'cheeks',
        'chin',
        'tearTrough',
        'jawline',
      ],
    },
    {
      name: 'fillerType',
      labelKey: 'fillerType',
      type: 'select',
      required: true,
      optionKeys: ['hyaluronicAcid', 'calciumHydroxylapatite', 'other'],
    },
    ...commonMedicalFields,
  ],
  LASER: [
    {
      name: 'treatmentAreas',
      labelKey: 'treatmentAreas',
      type: 'checkbox-group',
      required: true,
      optionKeys: ['face', 'neck', 'decollete', 'hands', 'other'],
    },
    {
      name: 'skinType',
      labelKey: 'skinType',
      type: 'select',
      required: true,
      optionKeys: [
        'fitzpatrickI',
        'fitzpatrickII',
        'fitzpatrickIII',
        'fitzpatrickIV',
        'fitzpatrickV',
        'fitzpatrickVI',
      ],
    },
    ...commonMedicalFields,
    {
      name: 'recentSunExposure',
      labelKey: 'recentSunExposure',
      type: 'checkbox',
      required: false,
    },
  ],
  CHEMICAL_PEEL: [
    {
      name: 'treatmentAreas',
      labelKey: 'treatmentAreas',
      type: 'checkbox-group',
      required: true,
      optionKeys: ['face', 'neck', 'hands'],
    },
    {
      name: 'peelType',
      labelKey: 'peelType',
      type: 'select',
      required: true,
      optionKeys: ['superficial', 'medium', 'deep'],
    },
    ...commonMedicalFields,
  ],
  MICRONEEDLING: [
    {
      name: 'treatmentAreas',
      labelKey: 'treatmentAreas',
      type: 'checkbox-group',
      required: true,
      optionKeys: ['face', 'neck', 'decollete', 'scalp'],
    },
    ...commonMedicalFields,
    {
      name: 'activeInfections',
      labelKey: 'activeInfections',
      type: 'checkbox',
      required: false,
    },
  ],
  PRP: [
    {
      name: 'treatmentAreas',
      labelKey: 'treatmentAreas',
      type: 'checkbox-group',
      required: true,
      optionKeys: ['face', 'scalpHairLoss', 'joints'],
    },
    ...commonMedicalFields,
    {
      name: 'bloodDisorders',
      labelKey: 'bloodDisorders',
      type: 'checkbox',
      required: false,
    },
  ],
};

export function getFormFields(type: ConsentType): FormFieldConfig[] {
  return consentFormFields[type] || commonMedicalFields;
}
