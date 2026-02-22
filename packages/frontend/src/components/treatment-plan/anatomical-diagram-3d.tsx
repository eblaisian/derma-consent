'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { ModelViewer } from './model-viewer';
import { InjectionPointMarker3D } from './injection-point-marker-3d';
import { getCameraPreset } from './camera-presets';
import { surface3DToStorage } from './coordinate-utils';
import type { InjectionPoint, DiagramType } from '@/lib/types';

interface Props {
  diagramType: DiagramType;
  points: InjectionPoint[];
  onPointAdd?: (point: InjectionPoint) => void;
  onPointUpdate?: (point: InjectionPoint) => void;
  onPointRemove?: (id: string) => void;
  readOnly?: boolean;
}

function getModelPath(diagramType: DiagramType): string {
  return diagramType === 'body-front' ? '/models/body.glb' : '/models/face.glb';
}

export function AnatomicalDiagram3D({
  diagramType,
  points,
  onPointAdd,
  onPointUpdate,
  onPointRemove,
  readOnly = false,
}: Props) {
  const [activePointId, setActivePointId] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const preset = getCameraPreset(diagramType);

  // Animate camera to new preset when diagramType changes
  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      controls.object.position.set(...preset.position);
      controls.target.set(...preset.target);
      controls.update();
    }
  }, [diagramType, preset]);

  const handleSurfaceClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (readOnly || !onPointAdd) return;

      // Get the hit point and face normal
      const hitPoint = event.point;
      const faceNormal = event.face?.normal ?? { x: 0, y: 0, z: 1 };

      // Convert 3D to 2D storage coordinates
      const pos3D = { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z };
      const norm3D = { x: faceNormal.x, y: faceNormal.y, z: faceNormal.z };
      const { x, y } = surface3DToStorage(pos3D, norm3D, diagramType);

      const point: InjectionPoint = {
        id: crypto.randomUUID(),
        x,
        y,
        position3D: pos3D,
        normal3D: norm3D,
        coordinateVersion: 2,
        product: 'Botox',
        units: 4,
        batchNumber: '',
        technique: 'bolus',
        notes: '',
      };

      onPointAdd(point);
    },
    [readOnly, onPointAdd, diagramType],
  );

  return (
    <div className="relative w-full" style={{ height: '450px' }}>
      <Canvas
        frameloop="demand"
        camera={{
          position: preset.position,
          fov: preset.fov,
          near: 0.1,
          far: 100,
        }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-3, 3, -3]} intensity={0.4} />

        {/* 3D Model */}
        <ModelViewer
          modelPath={getModelPath(diagramType)}
          readOnly={readOnly}
          onClick={handleSurfaceClick}
        />

        {/* Injection point markers */}
        {points.map((point) => (
          <InjectionPointMarker3D
            key={point.id}
            point={point}
            diagramType={diagramType}
            readOnly={readOnly}
            isActive={activePointId === point.id}
            onActivate={setActivePointId}
            onUpdate={onPointUpdate}
            onRemove={() => onPointRemove?.(point.id)}
          />
        ))}

        {/* Ground shadow */}
        <ContactShadows
          position={[0, -1.5, 0]}
          opacity={0.3}
          scale={5}
          blur={2}
        />

        {/* Camera controls */}
        <OrbitControls
          ref={controlsRef}
          target={preset.target}
          enablePan={false}
          minDistance={1}
          maxDistance={8}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI - Math.PI / 6}
        />
      </Canvas>
    </div>
  );
}
