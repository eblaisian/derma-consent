'use client';

import { lazy, Suspense, useMemo, Component, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { detectWebGL } from './webgl-support';
import { AnatomicalDiagramLegacy } from './anatomical-diagram-legacy';
import type { InjectionPoint, DiagramType } from '@/lib/types';

const AnatomicalDiagram3D = lazy(() =>
  import('./anatomical-diagram-3d').then((m) => ({ default: m.AnatomicalDiagram3D })),
);

interface Props {
  diagramType: DiagramType;
  points: InjectionPoint[];
  onPointAdd?: (point: InjectionPoint) => void;
  onPointUpdate?: (point: InjectionPoint) => void;
  onPointRemove?: (id: string) => void;
  readOnly?: boolean;
}

function LoadingSkeleton() {
  const t = useTranslations('treatmentPlan');
  return (
    <div className="w-full flex items-center justify-center bg-muted/30 rounded-lg" style={{ height: '450px' }}>
      <div className="text-center space-y-2">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-sm text-muted-foreground">{t('loading3D')}</p>
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function AnatomicalDiagram(props: Props) {
  const t = useTranslations('treatmentPlan');
  const supportsWebGL = useMemo(() => detectWebGL(), []);

  if (!supportsWebGL) {
    return (
      <div>
        <p className="text-xs text-muted-foreground mb-2">{t('webglUnsupported')}</p>
        <AnatomicalDiagramLegacy {...props} />
      </div>
    );
  }

  const legacyFallback = <AnatomicalDiagramLegacy {...props} />;

  return (
    <WebGLErrorBoundary fallback={legacyFallback}>
      <Suspense fallback={<LoadingSkeleton />}>
        <AnatomicalDiagram3D {...props} />
      </Suspense>
    </WebGLErrorBoundary>
  );
}
