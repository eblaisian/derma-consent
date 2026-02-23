'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useVault } from '@/hooks/use-vault';
import { AnatomicalDiagram } from './anatomical-diagram';
import { PhotoAnnotationCanvas } from './photo-annotation-canvas';
import { TreatmentAreasSummary } from './treatment-areas-summary';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { TreatmentPlanSummary, TreatmentPlanData } from '@/lib/types';

interface Props {
  plan: TreatmentPlanSummary;
}

export function TreatmentSummary({ plan }: Props) {
  const t = useTranslations('treatmentPlan');
  const tTech = useTranslations('techniques');
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
      <div className="flex justify-center py-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Treatment Areas mode — full-width card summary
  if (data.diagramType === 'treatment-areas') {
    return (
      <div className="space-y-3">
        <TreatmentAreasSummary points={data.points} />
        {data.overallNotes && (
          <p className="text-sm text-muted-foreground">{data.overallNotes}</p>
        )}
      </div>
    );
  }

  // Photo or SVG diagram modes — two-column layout
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {data.diagramType === 'patient-photo' && data.photoDataUrl ? (
        <PhotoAnnotationCanvas
          photoDataUrl={data.photoDataUrl}
          points={data.points}
          readOnly
        />
      ) : (
        <AnatomicalDiagram
          diagramType={data.diagramType}
          points={data.points}
          readOnly
        />
      )}
      <div className="space-y-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('product')}</TableHead>
              <TableHead>{t('units')}</TableHead>
              <TableHead>{t('technique')}</TableHead>
              <TableHead>{t('batchNumber')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.points.map((point) => (
              <TableRow key={point.id}>
                <TableCell className="text-sm">{point.product}</TableCell>
                <TableCell className="text-sm">{point.units}</TableCell>
                <TableCell className="text-sm">{tTech(point.technique as keyof IntlMessages['techniques'])}</TableCell>
                <TableCell className="text-sm">{point.batchNumber || '\u2014'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex justify-between text-sm font-medium">
          <span>{t('totalUnits')}</span>
          <span>{data.totalUnits}</span>
        </div>
        {data.overallNotes && (
          <p className="text-sm text-muted-foreground">{data.overallNotes}</p>
        )}
      </div>
    </div>
  );
}
