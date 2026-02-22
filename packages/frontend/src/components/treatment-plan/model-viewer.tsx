'use client';

import { useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';

interface Props {
  modelPath: string;
  readOnly?: boolean;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
}

export function ModelViewer({ modelPath, readOnly, onClick }: Props) {
  const { scene } = useGLTF(modelPath);
  const groupRef = useRef<THREE.Group>(null);

  // Clone scene to avoid shared state between instances
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    // Apply neutral skin-tone material
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#e8d5c4'),
      roughness: 0.7,
      metalness: 0.05,
    });
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });
    return clone;
  }, [scene]);

  return (
    <group ref={groupRef}>
      <primitive
        object={clonedScene}
        onClick={readOnly ? undefined : onClick}
        onPointerOver={
          readOnly
            ? undefined
            : () => {
                document.body.style.cursor = 'crosshair';
              }
        }
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      />
    </group>
  );
}

// Preload models at module level for faster loading
useGLTF.preload('/models/face.glb');
useGLTF.preload('/models/body.glb');
