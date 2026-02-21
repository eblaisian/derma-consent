'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useVault } from '@/hooks/use-vault';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { AnatomicalDiagram } from './anatomical-diagram';
import type {
  InjectionPoint, DiagramType, TreatmentPlanData, ConsentType, Practice,
  TreatmentTemplateSummary,
} from '@/lib/types';

const DIAGRAM_TYPES: DiagramType[] = ['face-front', 'face-side', 'body-front'];
const CONSENT_TYPES: ConsentType[] = ['BOTOX', 'FILLER', 'LASER', 'CHEMICAL_PEEL', 'MICRONEEDLING', 'PRP'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  practice: Practice;
  template?: TreatmentTemplateSummary | null;
  onSaved: () => void;
}

export function TreatmentPlanEditor({
  open, onOpenChange, patientId, practice, template, onSaved,
}: Props) {
  const t = useTranslations('treatmentPlan');
  const tTypes = useTranslations('consentTypes');
  const tTech = useTranslations('techniques');
  const authFetch = useAuthFetch();
  const { encryptForPractice } = useVault();

  const [type, setType] = useState<ConsentType>(template?.type ?? 'BOTOX');
  const [diagramType, setDiagramType] = useState<DiagramType>(
    template?.templateData?.diagramType ?? 'face-front',
  );
  const [points, setPoints] = useState<InjectionPoint[]>(
    template?.templateData?.points ?? [],
  );
  const [overallNotes, setOverallNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePointAdd = useCallback((point: InjectionPoint) => {
    setPoints((prev) => [...prev, point]);
  }, []);

  const handlePointUpdate = useCallback((updated: InjectionPoint) => {
    setPoints((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const handlePointRemove = useCallback((id: string) => {
    setPoints((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const totalUnits = points.reduce((sum, p) => sum + p.units, 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      const planData: TreatmentPlanData = {
        diagramType,
        points,
        totalUnits,
        overallNotes,
      };

      const encrypted = await encryptForPractice(planData, practice.publicKey);

      await authFetch('/api/treatment-plans', {
        method: 'POST',
        body: JSON.stringify({
          patientId,
          type,
          encryptedSessionKey: encrypted.encryptedSessionKey,
          encryptedData: { iv: encrypted.iv, ciphertext: encrypted.ciphertext },
          templateId: template?.id,
        }),
      });

      toast.success(t('saved'));
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    try {
      await authFetch('/api/treatment-templates', {
        method: 'POST',
        body: JSON.stringify({
          name: `${tTypes(type as keyof IntlMessages['consentTypes'])} - ${t(diagramType as keyof IntlMessages['treatmentPlan'])}`,
          type,
          bodyRegion: 'OTHER',
          templateData: { diagramType, points, totalUnits, overallNotes },
        }),
      });
      toast.success(t('templateSaved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('templateSaveError'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('editorTitle')}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Diagram */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Select value={diagramType} onValueChange={(v) => setDiagramType(v as DiagramType)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIAGRAM_TYPES.map((dt) => (
                    <SelectItem key={dt} value={dt}>{t(dt as keyof IntlMessages['treatmentPlan'])}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={type} onValueChange={(v) => setType(v as ConsentType)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONSENT_TYPES.map((ct) => (
                    <SelectItem key={ct} value={ct}>{tTypes(ct as keyof IntlMessages['consentTypes'])}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">{t('clickToAdd')}</p>
            <AnatomicalDiagram
              diagramType={diagramType}
              points={points}
              onPointAdd={handlePointAdd}
              onPointUpdate={handlePointUpdate}
              onPointRemove={handlePointRemove}
            />
          </div>

          {/* Right: Data table */}
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
                {points.map((point) => (
                  <TableRow key={point.id}>
                    <TableCell className="text-sm">{point.product}</TableCell>
                    <TableCell className="text-sm">{point.units}</TableCell>
                    <TableCell className="text-sm">{tTech(point.technique as keyof IntlMessages['techniques'])}</TableCell>
                    <TableCell className="text-sm">{point.batchNumber || '—'}</TableCell>
                  </TableRow>
                ))}
                {points.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                      {t('noPoints')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between text-sm font-medium">
              <span>{t('totalUnits')}</span>
              <span>{totalUnits}</span>
            </div>

            <div>
              <Label>{t('overallNotes')}</Label>
              <Input
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={handleSaveAsTemplate} disabled={points.length === 0}>
            {t('saveAsTemplate')}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving || points.length === 0}>
            {saving ? t('saving') : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
