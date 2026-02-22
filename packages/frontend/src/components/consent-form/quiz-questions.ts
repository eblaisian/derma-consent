import type { ConsentType } from './form-fields';

export interface QuizQuestion {
  id: string;
  questionKey: string;
  optionKeys: string[];
  correctIndex: number;
}

export const quizQuestions: Record<ConsentType, QuizQuestion[]> = {
  BOTOX: [
    {
      id: 'botox-1',
      questionKey: 'botoxDuration',
      optionKeys: ['botoxDurationA', 'botoxDurationB', 'botoxDurationC', 'botoxDurationD'],
      correctIndex: 1,
    },
    {
      id: 'botox-2',
      questionKey: 'botoxSideEffect',
      optionKeys: ['botoxSideEffectA', 'botoxSideEffectB', 'botoxSideEffectC', 'botoxSideEffectD'],
      correctIndex: 1,
    },
    {
      id: 'botox-3',
      questionKey: 'botoxReversible',
      optionKeys: ['botoxReversibleA', 'botoxReversibleB', 'botoxReversibleC'],
      correctIndex: 1,
    },
  ],
  FILLER: [
    {
      id: 'filler-1',
      questionKey: 'fillerDuration',
      optionKeys: ['fillerDurationA', 'fillerDurationB', 'fillerDurationC', 'fillerDurationD'],
      correctIndex: 1,
    },
    {
      id: 'filler-2',
      questionKey: 'fillerRisk',
      optionKeys: ['fillerRiskA', 'fillerRiskB', 'fillerRiskC', 'fillerRiskD'],
      correctIndex: 2,
    },
    {
      id: 'filler-3',
      questionKey: 'fillerReversible',
      optionKeys: ['fillerReversibleA', 'fillerReversibleB', 'fillerReversibleC'],
      correctIndex: 0,
    },
  ],
  LASER: [
    {
      id: 'laser-1',
      questionKey: 'laserAftercare',
      optionKeys: ['laserAftercareA', 'laserAftercareB', 'laserAftercareC', 'laserAftercareD'],
      correctIndex: 0,
    },
    {
      id: 'laser-2',
      questionKey: 'laserSideEffect',
      optionKeys: ['laserSideEffectA', 'laserSideEffectB', 'laserSideEffectC', 'laserSideEffectD'],
      correctIndex: 1,
    },
  ],
  CHEMICAL_PEEL: [
    {
      id: 'peel-1',
      questionKey: 'peelAftercare',
      optionKeys: ['peelAftercareA', 'peelAftercareB', 'peelAftercareC', 'peelAftercareD'],
      correctIndex: 2,
    },
    {
      id: 'peel-2',
      questionKey: 'peelSideEffect',
      optionKeys: ['peelSideEffectA', 'peelSideEffectB', 'peelSideEffectC', 'peelSideEffectD'],
      correctIndex: 0,
    },
  ],
  MICRONEEDLING: [
    {
      id: 'micro-1',
      questionKey: 'microDowntime',
      optionKeys: ['microDowntimeA', 'microDowntimeB', 'microDowntimeC', 'microDowntimeD'],
      correctIndex: 1,
    },
    {
      id: 'micro-2',
      questionKey: 'microContraindication',
      optionKeys: ['microContraindicationA', 'microContraindicationB', 'microContraindicationC', 'microContraindicationD'],
      correctIndex: 0,
    },
  ],
  PRP: [
    {
      id: 'prp-1',
      questionKey: 'prpSource',
      optionKeys: ['prpSourceA', 'prpSourceB', 'prpSourceC', 'prpSourceD'],
      correctIndex: 1,
    },
    {
      id: 'prp-2',
      questionKey: 'prpSessions',
      optionKeys: ['prpSessionsA', 'prpSessionsB', 'prpSessionsC', 'prpSessionsD'],
      correctIndex: 2,
    },
  ],
};
