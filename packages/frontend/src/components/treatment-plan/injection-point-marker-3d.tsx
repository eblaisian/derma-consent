'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import type { InjectionPoint, DiagramType } from '@/lib/types';
import { getPoint3DPosition } from './coordinate-utils';

const PRODUCTS = ['Botox', 'Dysport', 'Xeomin', 'Juvederm Ultra', 'Juvederm Voluma', 'Restylane', 'Belotero'];
const TECHNIQUES = ['bolus', 'linear_threading', 'fan', 'cross_hatching', 'serial_puncture', 'blanching', 'micro_droplet'];

const NORMAL_OFFSET = 0.02;

interface Props {
  point: InjectionPoint;
  diagramType: DiagramType;
  readOnly?: boolean;
  isActive: boolean;
  onActivate: (id: string) => void;
  onUpdate?: (point: InjectionPoint) => void;
  onRemove?: () => void;
}

export function InjectionPointMarker3D({
  point,
  diagramType,
  readOnly,
  isActive,
  onActivate,
  onUpdate,
  onRemove,
}: Props) {
  const t = useTranslations('treatmentPlan');
  const tTech = useTranslations('techniques');
  const [hovered, setHovered] = useState(false);

  const pos = getPoint3DPosition(point, diagramType);
  const normal = point.normal3D ?? { x: 0, y: 0, z: 1 };

  // Offset marker slightly above the surface
  const position: [number, number, number] = [
    pos.x + normal.x * NORMAL_OFFSET,
    pos.y + normal.y * NORMAL_OFFSET,
    pos.z + normal.z * NORMAL_OFFSET,
  ];

  return (
    <group position={position}>
      {/* Marker sphere */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onActivate(point.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshStandardMaterial
          color={isActive ? '#ef4444' : hovered ? '#60a5fa' : '#3b82f6'}
          emissive={isActive ? '#ef4444' : '#3b82f6'}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Units badge - always visible */}
      <Html center distanceFactor={3} style={{ pointerEvents: 'none' }}>
        <div className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center -translate-y-4 select-none">
          {point.units}
        </div>
      </Html>

      {/* Edit form when active and not readOnly */}
      {isActive && !readOnly && (
        <Html
          distanceFactor={4}
          style={{ pointerEvents: 'auto' }}
          position={[0.1, 0.05, 0]}
        >
          <div
            className="bg-popover border rounded-md shadow-md p-2 space-y-2 text-xs w-44"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <Label className="text-xs">{t('product')}</Label>
              <Select value={point.product} onValueChange={(v) => onUpdate?.({ ...point, product: v })}>
                <SelectTrigger className="h-7 text-xs w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t('units')}</Label>
              <Input
                type="number"
                className="h-7 text-xs"
                value={point.units}
                onChange={(e) => onUpdate?.({ ...point, units: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label className="text-xs">{t('technique')}</Label>
              <Select value={point.technique} onValueChange={(v) => onUpdate?.({ ...point, technique: v })}>
                <SelectTrigger className="h-7 text-xs w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TECHNIQUES.map((tech) => (
                    <SelectItem key={tech} value={tech}>{tTech(tech as keyof IntlMessages['techniques'])}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t('batchNumber')}</Label>
              <Input
                className="h-7 text-xs"
                value={point.batchNumber}
                onChange={(e) => onUpdate?.({ ...point, batchNumber: e.target.value })}
              />
            </div>
            <div className="flex justify-between">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                onClick={() => onActivate('')}
              >
                {t('done')}
              </Button>
              <Button size="sm" variant="ghost" className="h-6 text-xs text-destructive" onClick={onRemove}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
