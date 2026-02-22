import type { DiagramType, Vec3, InjectionPoint } from '@/lib/types';

/** Bounding box in 3D model space for projecting to 2D percentages */
interface ModelBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

// Calibrated per model — update after placing actual GLB models
export const FACE_BOUNDS: ModelBounds = {
  minX: -0.5,
  maxX: 0.5,
  minY: -0.3,
  maxY: 0.7,
  minZ: -0.5,
  maxZ: 0.5,
};

export const BODY_BOUNDS: ModelBounds = {
  minX: -1.0,
  maxX: 1.0,
  minY: -1.5,
  maxY: 1.5,
  minZ: -0.5,
  maxZ: 0.5,
};

function getBounds(diagramType: DiagramType): ModelBounds {
  return diagramType === 'body-front' ? BODY_BOUNDS : FACE_BOUNDS;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Convert a 3D surface hit to 0-100% x/y for backwards compatibility.
 * For front views: project onto XY plane.
 * For side views: project onto ZY plane.
 */
export function surface3DToStorage(
  point: Vec3,
  _normal: Vec3,
  diagramType: DiagramType,
): { x: number; y: number } {
  const bounds = getBounds(diagramType);

  let horizontal: number;
  if (diagramType === 'face-side') {
    // Side view: Z maps to horizontal
    horizontal = (point.z - bounds.minZ) / (bounds.maxZ - bounds.minZ);
  } else {
    // Front view: X maps to horizontal
    horizontal = (point.x - bounds.minX) / (bounds.maxX - bounds.minX);
  }

  // Y maps to vertical (inverted: top of model = low y%)
  const vertical = 1 - (point.y - bounds.minY) / (bounds.maxY - bounds.minY);

  return {
    x: clamp(Math.round(horizontal * 1000) / 10, 0, 100),
    y: clamp(Math.round(vertical * 1000) / 10, 0, 100),
  };
}

/**
 * Convert legacy 2D percentage coords to approximate 3D position.
 * Returns a position on the front plane of the model.
 */
export function legacy2DTo3DPosition(
  x: number,
  y: number,
  diagramType: DiagramType,
): Vec3 {
  const bounds = getBounds(diagramType);
  const horizontal = x / 100;
  const vertical = 1 - y / 100; // Invert back

  if (diagramType === 'face-side') {
    return {
      x: 0,
      z: bounds.minZ + horizontal * (bounds.maxZ - bounds.minZ),
      y: bounds.minY + vertical * (bounds.maxY - bounds.minY),
    };
  }

  return {
    x: bounds.minX + horizontal * (bounds.maxX - bounds.minX),
    y: bounds.minY + vertical * (bounds.maxY - bounds.minY),
    z: bounds.maxZ, // Place on front face
  };
}

/**
 * Get the 3D position for a point, dispatching based on coordinateVersion.
 */
export function getPoint3DPosition(
  point: InjectionPoint,
  diagramType: DiagramType,
): Vec3 {
  if (point.coordinateVersion === 2 && point.position3D) {
    return point.position3D;
  }
  return legacy2DTo3DPosition(point.x, point.y, diagramType);
}
