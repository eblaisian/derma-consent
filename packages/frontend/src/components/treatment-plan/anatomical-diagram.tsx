'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { InjectionPointMarker } from './injection-point-marker';
import type { InjectionPoint, DiagramType } from '@/lib/types';

interface Props {
  diagramType: DiagramType;
  points: InjectionPoint[];
  onPointAdd?: (point: InjectionPoint) => void;
  onPointUpdate?: (point: InjectionPoint) => void;
  onPointRemove?: (id: string) => void;
  readOnly?: boolean;
}

export function AnatomicalDiagram({
  diagramType,
  points,
  onPointAdd,
  onPointUpdate,
  onPointRemove,
  readOnly = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    fetch(`/diagrams/${diagramType}.svg`)
      .then((res) => res.text())
      .then((text) => {
        // Remove the outer <svg> wrapper so we can embed in our own
        const inner = text
          .replace(/<svg[^>]*>/, '')
          .replace(/<\/svg>/, '');
        setSvgContent(inner);
      });
  }, [diagramType]);

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (readOnly || !onPointAdd) return;

      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Don't add points if clicking on existing markers
      const target = e.target as SVGElement;
      if (target.tagName === 'circle' || target.closest('foreignObject')) return;

      const point: InjectionPoint = {
        id: crypto.randomUUID(),
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        product: 'Botox',
        units: 4,
        batchNumber: '',
        technique: 'bolus',
        notes: '',
      };

      onPointAdd(point);
    },
    [readOnly, onPointAdd],
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        viewBox={diagramType === 'body-front' ? '0 0 400 600' : '0 0 400 500'}
        className="w-full h-auto cursor-crosshair"
        onClick={handleClick}
      >
        {/* Diagram background */}
        <g dangerouslySetInnerHTML={{ __html: svgContent }} />

        {/* Injection points overlay */}
        {points.map((point) => (
          <InjectionPointMarker
            key={point.id}
            point={point}
            readOnly={readOnly}
            onUpdate={onPointUpdate}
            onRemove={() => onPointRemove?.(point.id)}
          />
        ))}
      </svg>
    </div>
  );
}
