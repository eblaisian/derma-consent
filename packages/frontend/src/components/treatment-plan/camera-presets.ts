import type { DiagramType } from '@/lib/types';

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

const presets: Record<DiagramType, CameraPreset> = {
  'face-front': {
    position: [0, 0.2, 2.5],
    target: [0, 0.2, 0],
    fov: 40,
  },
  'face-side': {
    position: [2.5, 0.2, 0],
    target: [0, 0.2, 0],
    fov: 40,
  },
  'body-front': {
    position: [0, 0, 4],
    target: [0, 0, 0],
    fov: 50,
  },
};

export function getCameraPreset(diagramType: DiagramType): CameraPreset {
  return presets[diagramType];
}
