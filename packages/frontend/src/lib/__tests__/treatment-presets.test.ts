import { describe, it, expect } from 'vitest';
import {
  TREATMENT_PRESETS,
  getPresetsForConsentType,
  applyPreset,
  getDefaultDiagramType,
  getDiagramTypesForConsent,
} from '@/components/treatment-plan/treatment-presets';

describe('TREATMENT_PRESETS', () => {
  it('contains 14 presets total', () => {
    expect(TREATMENT_PRESETS).toHaveLength(14);
  });

  it('has 8 BOTOX presets', () => {
    const botox = TREATMENT_PRESETS.filter((p) => p.consentType === 'BOTOX');
    expect(botox).toHaveLength(8);
  });

  it('has 6 FILLER presets', () => {
    const filler = TREATMENT_PRESETS.filter((p) => p.consentType === 'FILLER');
    expect(filler).toHaveLength(6);
  });

  it('every preset has unique id', () => {
    const ids = TREATMENT_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every preset has at least one injection site', () => {
    for (const preset of TREATMENT_PRESETS) {
      expect(preset.sites.length).toBeGreaterThan(0);
    }
  });

  it('all sites have coordinates in 0-100 range', () => {
    for (const preset of TREATMENT_PRESETS) {
      for (const site of preset.sites) {
        expect(site.x).toBeGreaterThanOrEqual(0);
        expect(site.x).toBeLessThanOrEqual(100);
        expect(site.y).toBeGreaterThanOrEqual(0);
        expect(site.y).toBeLessThanOrEqual(100);
      }
    }
  });

  it('all sites have positive units', () => {
    for (const preset of TREATMENT_PRESETS) {
      for (const site of preset.sites) {
        expect(site.units).toBeGreaterThan(0);
      }
    }
  });

  it('all sites have a muscle/target string', () => {
    for (const preset of TREATMENT_PRESETS) {
      for (const site of preset.sites) {
        expect(site.muscle).toBeTruthy();
      }
    }
  });
});

describe('getPresetsForConsentType', () => {
  it('returns only BOTOX presets for BOTOX', () => {
    const result = getPresetsForConsentType('BOTOX');
    expect(result.length).toBe(8);
    expect(result.every((p) => p.consentType === 'BOTOX')).toBe(true);
  });

  it('returns only FILLER presets for FILLER', () => {
    const result = getPresetsForConsentType('FILLER');
    expect(result.length).toBe(6);
    expect(result.every((p) => p.consentType === 'FILLER')).toBe(true);
  });

  it('returns empty array for LASER', () => {
    expect(getPresetsForConsentType('LASER')).toEqual([]);
  });

  it('returns empty array for other types', () => {
    expect(getPresetsForConsentType('PRP')).toEqual([]);
    expect(getPresetsForConsentType('CHEMICAL_PEEL')).toEqual([]);
    expect(getPresetsForConsentType('MICRONEEDLING')).toEqual([]);
  });
});

describe('applyPreset', () => {
  it('returns InjectionPoint[] with unique IDs', () => {
    const preset = TREATMENT_PRESETS[0];
    const points = applyPreset(preset);
    expect(points).toHaveLength(preset.sites.length);
    const ids = points.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('copies coordinates, product, units, technique, and muscle', () => {
    const preset = TREATMENT_PRESETS[0];
    const points = applyPreset(preset);
    for (let i = 0; i < points.length; i++) {
      expect(points[i].x).toBe(preset.sites[i].x);
      expect(points[i].y).toBe(preset.sites[i].y);
      expect(points[i].product).toBe(preset.sites[i].product);
      expect(points[i].units).toBe(preset.sites[i].units);
      expect(points[i].technique).toBe(preset.sites[i].technique);
      expect(points[i].muscle).toBe(preset.sites[i].muscle);
    }
  });

  it('sets empty batchNumber and notes', () => {
    const points = applyPreset(TREATMENT_PRESETS[0]);
    for (const point of points) {
      expect(point.batchNumber).toBe('');
      expect(point.notes).toBe('');
    }
  });
});

describe('getDefaultDiagramType', () => {
  it('returns botox-face-front for BOTOX', () => {
    expect(getDefaultDiagramType('BOTOX')).toBe('botox-face-front');
  });

  it('returns filler-face-front for FILLER', () => {
    expect(getDefaultDiagramType('FILLER')).toBe('filler-face-front');
  });

  it('returns face-front for LASER', () => {
    expect(getDefaultDiagramType('LASER')).toBe('face-front');
  });

  it('returns face-front for other types', () => {
    expect(getDefaultDiagramType('CHEMICAL_PEEL')).toBe('face-front');
    expect(getDefaultDiagramType('MICRONEEDLING')).toBe('face-front');
    expect(getDefaultDiagramType('PRP')).toBe('face-front');
  });
});

describe('getDiagramTypesForConsent', () => {
  it('includes botox-specific diagrams for BOTOX', () => {
    const types = getDiagramTypesForConsent('BOTOX');
    expect(types).toContain('botox-face-front');
    expect(types).toContain('botox-face-side');
    expect(types).toContain('face-front');
    expect(types).toContain('body-front');
  });

  it('includes filler-specific diagram for FILLER', () => {
    const types = getDiagramTypesForConsent('FILLER');
    expect(types).toContain('filler-face-front');
    expect(types).toContain('face-front');
    expect(types).not.toContain('botox-face-front');
  });

  it('returns only generic diagrams for LASER', () => {
    const types = getDiagramTypesForConsent('LASER');
    expect(types).toEqual(['face-front', 'face-side', 'body-front']);
  });
});
