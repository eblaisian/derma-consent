import type { ConsentType, InjectionPoint } from '@/lib/types';

export interface TreatmentAreaDefinition {
  id: string;
  nameKey: string;
  consentType: ConsentType;
  siteCount: number;
  defaultUnits: number;
  defaultProduct: string;
  defaultTechnique: string;
}

export interface SelectedTreatmentArea {
  definitionId: string;
  product: string;
  technique: string;
  totalUnits: number;
  batchNumber: string;
  siteCount: number;
}

export interface ComboPreset {
  id: string;
  nameKey: string;
  consentType: ConsentType;
  areaIds: string[];
}

// --- Botox Areas ---

const BOTOX_AREAS: TreatmentAreaDefinition[] = [
  { id: 'glabellar', nameKey: 'glabellar', consentType: 'BOTOX', siteCount: 5, defaultUnits: 20, defaultProduct: 'Botox', defaultTechnique: 'bolus' },
  { id: 'frontalis', nameKey: 'frontalis', consentType: 'BOTOX', siteCount: 8, defaultUnits: 20, defaultProduct: 'Botox', defaultTechnique: 'bolus' },
  { id: 'crowsFeet', nameKey: 'crowsFeet', consentType: 'BOTOX', siteCount: 6, defaultUnits: 24, defaultProduct: 'Botox', defaultTechnique: 'bolus' },
  { id: 'masseter', nameKey: 'masseter', consentType: 'BOTOX', siteCount: 6, defaultUnits: 50, defaultProduct: 'Botox', defaultTechnique: 'bolus' },
  { id: 'lipFlip', nameKey: 'lipFlip', consentType: 'BOTOX', siteCount: 4, defaultUnits: 4, defaultProduct: 'Botox', defaultTechnique: 'micro_droplet' },
  { id: 'bunnyLines', nameKey: 'bunnyLines', consentType: 'BOTOX', siteCount: 2, defaultUnits: 4, defaultProduct: 'Botox', defaultTechnique: 'bolus' },
  { id: 'nefertitiLift', nameKey: 'nefertitiLift', consentType: 'BOTOX', siteCount: 10, defaultUnits: 30, defaultProduct: 'Botox', defaultTechnique: 'bolus' },
];

// --- Filler Areas ---

const FILLER_AREAS: TreatmentAreaDefinition[] = [
  { id: 'lipEnhancement', nameKey: 'lipEnhancement', consentType: 'FILLER', siteCount: 6, defaultUnits: 1, defaultProduct: 'Juvederm Ultra', defaultTechnique: 'linear_threading' },
  { id: 'cheekAugmentation', nameKey: 'cheekAugmentation', consentType: 'FILLER', siteCount: 4, defaultUnits: 2, defaultProduct: 'Juvederm Voluma', defaultTechnique: 'bolus' },
  { id: 'nasolabialFolds', nameKey: 'nasolabialFolds', consentType: 'FILLER', siteCount: 4, defaultUnits: 1, defaultProduct: 'Restylane', defaultTechnique: 'linear_threading' },
  { id: 'chinAugmentation', nameKey: 'chinAugmentation', consentType: 'FILLER', siteCount: 2, defaultUnits: 1, defaultProduct: 'Juvederm Voluma', defaultTechnique: 'bolus' },
  { id: 'jawlineContouring', nameKey: 'jawlineContouring', consentType: 'FILLER', siteCount: 6, defaultUnits: 2, defaultProduct: 'Juvederm Voluma', defaultTechnique: 'bolus' },
  { id: 'tearTroughCorrection', nameKey: 'tearTroughCorrection', consentType: 'FILLER', siteCount: 2, defaultUnits: 0.5, defaultProduct: 'Belotero', defaultTechnique: 'serial_puncture' },
];

const ALL_AREAS: TreatmentAreaDefinition[] = [...BOTOX_AREAS, ...FILLER_AREAS];

// --- Combo Presets ---

const COMBO_PRESETS: ComboPreset[] = [
  { id: 'fullUpperFace', nameKey: 'fullUpperFace', consentType: 'BOTOX', areaIds: ['glabellar', 'frontalis', 'crowsFeet'] },
];

// --- Lookup Helpers ---

export function getAreasForConsentType(consentType: ConsentType): TreatmentAreaDefinition[] {
  return ALL_AREAS.filter((a) => a.consentType === consentType);
}

export function getCombosForConsentType(consentType: ConsentType): ComboPreset[] {
  return COMBO_PRESETS.filter((c) => c.consentType === consentType);
}

export function getAreaDefinition(id: string): TreatmentAreaDefinition | undefined {
  return ALL_AREAS.find((a) => a.id === id);
}

// --- Conversion: SelectedTreatmentArea[] → InjectionPoint[] ---

export function selectedAreasToPoints(areas: SelectedTreatmentArea[]): InjectionPoint[] {
  return areas.flatMap((area) => {
    const def = getAreaDefinition(area.definitionId);
    if (!def) return [];
    const unitsPerSite = area.totalUnits / area.siteCount;
    return Array.from({ length: area.siteCount }, (_, i) => ({
      id: crypto.randomUUID(),
      x: 0,
      y: 0,
      product: area.product,
      units: Math.round(unitsPerSite * 100) / 100,
      batchNumber: area.batchNumber,
      technique: area.technique,
      notes: '',
      muscle: def.nameKey,
    }));
  });
}

// --- Conversion: InjectionPoint[] → SelectedTreatmentArea[] (for read-only display) ---

export function pointsToSelectedAreas(points: InjectionPoint[]): SelectedTreatmentArea[] {
  const grouped = new Map<string, InjectionPoint[]>();
  for (const p of points) {
    const key = p.muscle || 'unknown';
    const arr = grouped.get(key) ?? [];
    arr.push(p);
    grouped.set(key, arr);
  }

  const result: SelectedTreatmentArea[] = [];
  for (const [muscle, pts] of grouped) {
    const def = ALL_AREAS.find((a) => a.nameKey === muscle);
    const totalUnits = pts.reduce((sum, p) => sum + p.units, 0);
    result.push({
      definitionId: def?.id ?? muscle,
      product: pts[0].product,
      technique: pts[0].technique,
      totalUnits: Math.round(totalUnits * 100) / 100,
      batchNumber: pts[0].batchNumber,
      siteCount: pts.length,
    });
  }
  return result;
}

export function createDefaultSelectedArea(def: TreatmentAreaDefinition): SelectedTreatmentArea {
  return {
    definitionId: def.id,
    product: def.defaultProduct,
    technique: def.defaultTechnique,
    totalUnits: def.defaultUnits,
    batchNumber: '',
    siteCount: def.siteCount,
  };
}
