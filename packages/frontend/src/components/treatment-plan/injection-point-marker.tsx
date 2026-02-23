'use client';

import { useState } from 'react';
import { InjectionPointEditFields } from './injection-point-edit-fields';
import type { InjectionPoint } from '@/lib/types';

interface Props {
  point: InjectionPoint;
  readOnly?: boolean;
  onUpdate?: (point: InjectionPoint) => void;
  onRemove?: () => void;
}

export function InjectionPointMarker({ point, readOnly, onUpdate, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <g>
      {/* Marker circle */}
      <circle
        cx={`${point.x}%`}
        cy={`${point.y}%`}
        r="6"
        fill="hsl(var(--primary))"
        fillOpacity={0.8}
        stroke="white"
        strokeWidth="2"
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      />
      <text
        x={`${point.x}%`}
        y={`${point.y + 0.5}%`}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="7"
        fill="white"
        fontWeight="bold"
        className="pointer-events-none select-none"
      >
        {point.units}
      </text>

      {/* Muscle/target label in read-only mode */}
      {readOnly && point.muscle && (
        <text
          x={`${point.x}%`}
          y={`${point.y + 3.5}%`}
          textAnchor="middle"
          fontSize="6"
          fill="hsl(var(--muted-foreground))"
          className="pointer-events-none select-none"
        >
          {point.muscle}
        </text>
      )}

      {/* Popover rendered outside SVG via portal - using foreignObject for inline editing */}
      {expanded && !readOnly && (
        <foreignObject
          x={`${Math.min(point.x + 3, 60)}%`}
          y={`${Math.min(point.y - 5, 70)}%`}
          width="180"
          height="280"
        >
          <div className="bg-popover border rounded-md shadow-md p-2">
            <InjectionPointEditFields
              point={point}
              onUpdate={(p) => onUpdate?.(p)}
              onRemove={() => onRemove?.()}
              onDone={() => setExpanded(false)}
            />
          </div>
        </foreignObject>
      )}
    </g>
  );
}
