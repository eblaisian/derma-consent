'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { useVault } from '@/hooks/use-vault';
import { AnatomicalDiagram } from './anatomical-diagram';
import { PhotoAnnotationCanvas } from './photo-annotation-canvas';
import { TreatmentAreasSummary } from './treatment-areas-summary';
import { AftercareDialog } from './aftercare-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Trash2, Syringe, FileText, Camera, LayoutGrid } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { TreatmentPlanSummary, TreatmentPlanData } from '@/lib/types';

interface Props {
  plan: TreatmentPlanSummary;
  onDelete?: () => void;
}

const SVG_DIAGRAM_TYPES = new Set(['face-front', 'face-side', 'body-front']);

export function TreatmentSummary({ plan, onDelete }: Props) {
  const t = useTranslations('treatmentPlan');
  const tTypes = useTranslations('consentTypes');
  const tTech = useTranslations('techniques');
  const format = useFormatter();
  const { isUnlocked, decryptForm } = useVault();
  const [data, setData] = useState<TreatmentPlanData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isUnlocked) return;

    const decrypt = async () => {
      try {
        const result = await decryptForm({
          encryptedSessionKey: plan.encryptedSessionKey,
          iv: plan.encryptedData.iv,
          ciphertext: plan.encryptedData.ciphertext,
        });
        setData(result as TreatmentPlanData);
      } catch {
        setError(true);
      }
    };

    decrypt();
  }, [isUnlocked, plan.encryptedSessionKey, plan.encryptedData, decryptForm]);

  if (!isUnlocked) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        {t('vaultLocked')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive py-4 text-center">
        {t('decryptionFailed')}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center py-8">
        <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const points = data.points ?? [];
  const hasPoints = points.length > 0;
  const isPhotoMode = data.diagramType === 'patient-photo';
  const hasPhoto = isPhotoMode && !!data.photoDataUrl;
  const isSvgDiagram = !!data.diagramType && SVG_DIAGRAM_TYPES.has(data.diagramType);
  const isAreasMode = data.diagramType === 'treatment-areas';
  const typeName = tTypes.has(plan.type as keyof IntlMessages['consentTypes'])
    ? tTypes(plan.type as keyof IntlMessages['consentTypes'])
    : plan.type;

  // Mode label for the header
  const modeLabel = isPhotoMode
    ? t('patient-photo')
    : isAreasMode
      ? t('treatment-areas')
      : isSvgDiagram && data.diagramType
        ? (t.has(data.diagramType as keyof IntlMessages['treatmentPlan']) ? t(data.diagramType as keyof IntlMessages['treatmentPlan']) : data.diagramType)
        : null;

  // --- Header: type badge + mode + dates ---
  const header = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-sm">{typeName}</Badge>
        {modeLabel && (
          <Badge variant="secondary" className="gap-1 text-xs font-normal">
            {isPhotoMode ? <Camera className="h-3 w-3" /> : isAreasMode ? <LayoutGrid className="h-3 w-3" /> : null}
            {modeLabel}
          </Badge>
        )}
        {plan.performedAt && (
          <Badge variant="secondary" className="gap-1">
            <Calendar className="h-3 w-3" />
            {format.dateTime(new Date(plan.performedAt), { dateStyle: 'medium' })}
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {t('createdOn')}: {format.dateTime(new Date(plan.createdAt), { dateStyle: 'medium' })}
        </span>
        {hasPoints && (
          <span className="flex items-center gap-1">
            <Syringe className="h-3 w-3" />
            {points.length} {t('injectionPoints', { count: points.length })} · {data.totalUnits ?? 0} {t('totalUnits').toLowerCase()}
          </span>
        )}
      </div>
    </div>
  );

  // --- Notes block ---
  const notesBlock = data.overallNotes ? (
    <div className="rounded-md bg-muted/50 p-3">
      <p className="text-sm text-muted-foreground flex items-start gap-2">
        <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        {data.overallNotes}
      </p>
    </div>
  ) : null;

  // --- Actions footer ---
  const actions = (
    <div className="flex items-center justify-between pt-1">
      <AftercareDialog treatmentType={plan.type} />
      {onDelete && (
        <Button variant="ghost" size="sm" onClick={onDelete} className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-3.5 w-3.5" />
          {t('deletePlan')}
        </Button>
      )}
    </div>
  );

  // ===========================
  // Treatment Areas mode
  // ===========================
  if (isAreasMode) {
    return (
      <div className="space-y-4">
        {header}
        <Separator />
        {hasPoints ? (
          <TreatmentAreasSummary points={points} />
        ) : (
          <EmptyPoints />
        )}
        {notesBlock}
        <Separator />
        {actions}
      </div>
    );
  }

  // ===========================
  // Photo mode
  // ===========================
  if (isPhotoMode) {
    return (
      <div className="space-y-4">
        {header}
        <Separator />
        {hasPhoto ? (
          hasPoints ? (
            // Photo + points: photo with markers + table below
            <div className="space-y-4">
              <PhotoAnnotationCanvas
                photoDataUrl={data.photoDataUrl!}
                points={points}
                readOnly
              />
              <InjectionTable points={points} t={t} tTech={tTech} />
              <div className="flex justify-between text-sm font-medium px-1">
                <span>{t('totalUnits')}</span>
                <span>{data.totalUnits ?? 0}</span>
              </div>
            </div>
          ) : (
            // Photo only, no points
            <div className="space-y-3">
              <PhotoAnnotationCanvas
                photoDataUrl={data.photoDataUrl!}
                points={[]}
                readOnly
              />
              <p className="text-xs text-center text-muted-foreground">{t('photoNoPoints')}</p>
            </div>
          )
        ) : (
          // Photo mode but photoDataUrl missing (corrupted plan)
          <EmptyPoints />
        )}
        {notesBlock}
        <Separator />
        {actions}
      </div>
    );
  }

  // ===========================
  // SVG diagram mode (face-front, face-side, body-front)
  // ===========================
  if (isSvgDiagram) {
    return (
      <div className="space-y-4">
        {header}
        <Separator />
        {hasPoints ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnatomicalDiagram
              diagramType={data.diagramType}
              points={points}
              readOnly
            />
            <div className="space-y-3">
              <InjectionTable points={points} t={t} tTech={tTech} />
              <div className="flex justify-between text-sm font-medium px-1">
                <span>{t('totalUnits')}</span>
                <span>{data.totalUnits ?? 0}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="max-w-xs mx-auto">
              <AnatomicalDiagram
                diagramType={data.diagramType}
                points={[]}
                readOnly
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">{t('noPoints')}</p>
          </div>
        )}
        {notesBlock}
        <Separator />
        {actions}
      </div>
    );
  }

  // ===========================
  // Fallback: unknown/missing diagramType (old seed data)
  // ===========================
  return (
    <div className="space-y-4">
      {header}
      <Separator />
      {hasPoints ? (
        <div className="space-y-3">
          <InjectionTable points={points} t={t} tTech={tTech} />
          <div className="flex justify-between text-sm font-medium px-1">
            <span>{t('totalUnits')}</span>
            <span>{data.totalUnits ?? 0}</span>
          </div>
        </div>
      ) : (
        <EmptyPoints />
      )}
      {notesBlock}
      <Separator />
      {actions}
    </div>
  );
}

// --- Empty state for plans with no injection data ---
function EmptyPoints() {
  const t = useTranslations('treatmentPlan');
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
      <Syringe className="h-8 w-8 opacity-30" />
      <p className="text-sm">{t('noPoints')}</p>
    </div>
  );
}

// --- Extracted injection table component ---
function InjectionTable({
  points,
  t,
  tTech,
}: {
  points: Array<{ id: string; product: string; units: number; technique: string; batchNumber?: string }>;
  t: ReturnType<typeof useTranslations<'treatmentPlan'>>;
  tTech: ReturnType<typeof useTranslations<'techniques'>>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('product')}</TableHead>
          <TableHead className="text-right">{t('units')}</TableHead>
          <TableHead>{t('technique')}</TableHead>
          <TableHead>{t('batchNumber')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {points.map((point) => (
          <TableRow key={point.id}>
            <TableCell className="text-sm font-medium">{point.product}</TableCell>
            <TableCell className="text-sm text-right tabular-nums">{point.units}</TableCell>
            <TableCell className="text-sm">{tTech(point.technique as keyof IntlMessages['techniques'])}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{point.batchNumber || '\u2014'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
