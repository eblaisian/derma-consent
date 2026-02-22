import { describe, it, expect } from 'vitest';
import {
  surface3DToStorage,
  legacy2DTo3DPosition,
  getPoint3DPosition,
  FACE_BOUNDS,
  BODY_BOUNDS,
} from '@/components/treatment-plan/coordinate-utils';
import type { InjectionPoint } from '@/lib/types';

describe('coordinate-utils', () => {
  describe('surface3DToStorage', () => {
    it('maps center of face-front model to ~50% x/y', () => {
      const midX = (FACE_BOUNDS.minX + FACE_BOUNDS.maxX) / 2;
      const midY = (FACE_BOUNDS.minY + FACE_BOUNDS.maxY) / 2;
      const result = surface3DToStorage(
        { x: midX, y: midY, z: 0 },
        { x: 0, y: 0, z: 1 },
        'face-front',
      );
      expect(result.x).toBeCloseTo(50, 0);
      expect(result.y).toBeCloseTo(50, 0);
    });

    it('maps center of body-front model to ~50% x/y', () => {
      const midX = (BODY_BOUNDS.minX + BODY_BOUNDS.maxX) / 2;
      const midY = (BODY_BOUNDS.minY + BODY_BOUNDS.maxY) / 2;
      const result = surface3DToStorage(
        { x: midX, y: midY, z: 0 },
        { x: 0, y: 0, z: 1 },
        'body-front',
      );
      expect(result.x).toBeCloseTo(50, 0);
      expect(result.y).toBeCloseTo(50, 0);
    });

    it('uses Z axis for face-side horizontal mapping', () => {
      const result = surface3DToStorage(
        { x: 0, y: 0.2, z: FACE_BOUNDS.maxZ },
        { x: 1, y: 0, z: 0 },
        'face-side',
      );
      expect(result.x).toBeCloseTo(100, 0);
    });

    it('clamps values to 0-100 range', () => {
      const result = surface3DToStorage(
        { x: 10, y: 10, z: 0 },
        { x: 0, y: 0, z: 1 },
        'face-front',
      );
      expect(result.x).toBeLessThanOrEqual(100);
      expect(result.x).toBeGreaterThanOrEqual(0);
      expect(result.y).toBeLessThanOrEqual(100);
      expect(result.y).toBeGreaterThanOrEqual(0);
    });
  });

  describe('legacy2DTo3DPosition', () => {
    it('maps 0,0 percentage to top-left of model bounds', () => {
      const pos = legacy2DTo3DPosition(0, 0, 'face-front');
      expect(pos.x).toBe(FACE_BOUNDS.minX);
      expect(pos.y).toBe(FACE_BOUNDS.maxY); // 0% y = top = max Y
    });

    it('maps 100,100 percentage to bottom-right', () => {
      const pos = legacy2DTo3DPosition(100, 100, 'face-front');
      expect(pos.x).toBe(FACE_BOUNDS.maxX);
      expect(pos.y).toBe(FACE_BOUNDS.minY); // 100% y = bottom = min Y
    });

    it('maps face-side using Z axis for horizontal', () => {
      const pos = legacy2DTo3DPosition(50, 50, 'face-side');
      expect(pos.x).toBe(0); // Side view: x is always 0
      const expectedZ = (FACE_BOUNDS.minZ + FACE_BOUNDS.maxZ) / 2;
      expect(pos.z).toBeCloseTo(expectedZ, 5);
    });
  });

  describe('round-trip conversion', () => {
    it('3D -> 2D -> 3D is approximately consistent for face-front', () => {
      const original = { x: 0.1, y: 0.3, z: 0.2 };
      const normal = { x: 0, y: 0, z: 1 };
      const stored = surface3DToStorage(original, normal, 'face-front');
      const recovered = legacy2DTo3DPosition(stored.x, stored.y, 'face-front');

      // X and Y should be close (Z is lost in projection)
      expect(recovered.x).toBeCloseTo(original.x, 0);
      expect(recovered.y).toBeCloseTo(original.y, 0);
    });
  });

  describe('getPoint3DPosition', () => {
    it('returns position3D for v2 points', () => {
      const point: InjectionPoint = {
        id: '1',
        x: 50,
        y: 50,
        position3D: { x: 0.1, y: 0.2, z: 0.3 },
        normal3D: { x: 0, y: 0, z: 1 },
        coordinateVersion: 2,
        product: 'Botox',
        units: 4,
        batchNumber: '',
        technique: 'bolus',
        notes: '',
      };

      const pos = getPoint3DPosition(point, 'face-front');
      expect(pos).toEqual({ x: 0.1, y: 0.2, z: 0.3 });
    });

    it('converts legacy v1 points using 2D coordinates', () => {
      const point: InjectionPoint = {
        id: '2',
        x: 50,
        y: 50,
        product: 'Botox',
        units: 4,
        batchNumber: '',
        technique: 'bolus',
        notes: '',
      };

      const pos = getPoint3DPosition(point, 'face-front');
      // Should use legacy2DTo3DPosition with 50/50 -> center of bounds
      const midX = (FACE_BOUNDS.minX + FACE_BOUNDS.maxX) / 2;
      const midY = (FACE_BOUNDS.minY + FACE_BOUNDS.maxY) / 2;
      expect(pos.x).toBeCloseTo(midX, 5);
      expect(pos.y).toBeCloseTo(midY, 5);
    });
  });
});
