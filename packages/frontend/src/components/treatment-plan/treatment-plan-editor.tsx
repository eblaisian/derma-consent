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
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { Camera, LayoutGrid } from 'lucide-react';
import { PhotoCapture } from './photo-capture';
import { PhotoAnnotationCanvas } from './photo-annotation-canvas';
import { TreatmentAreasBuilder } from './treatment-areas-builder';
import { selectedAreasToPoints, type SelectedTreatmentArea } from './treatment-area-definitions';
import type {
  InjectionPoint, TreatmentPlanData, ConsentType, Practice,
  TreatmentTemplateSummary,
} from '@/lib/types';

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

  const initialType = template?.type ?? 'BOTOX';
  const [type, setType] = useState<ConsentType>(initialType);
  const [points, setPoints] = useState<InjectionPoint[]>(
    template?.templateData?.points ?? [],
  );
  const [overallNotes, setOverallNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Photo mode state
  const [activeTab, setActiveTab] = useState<string>('photo');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoAspectRatio, setPhotoAspectRatio] = useState<number>(4 / 3);

  // Treatment Areas mode state
  const [selectedAreas, setSelectedAreas] = useState<SelectedTreatmentArea[]>([]);

  const handleTypeChange = useCallback((newType: ConsentType) => {
    setType(newType);
    setSelectedAreas([]);
  }, []);

  const handleClearAll = useCallback(() => {
    setPoints([]);
  }, []);

  const handlePointAdd = useCallback((point: InjectionPoint) => {
    setPoints((prev) => [...prev, point]);
  }, []);

  const handlePointUpdate = useCallback((updated: InjectionPoint) => {
    setPoints((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const handlePointRemove = useCallback((id: string) => {
    setPoints((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handlePhotoCapture = useCallback((result: { dataUrl: string; aspectRatio: number }) => {
    setPhotoDataUrl(result.dataUrl);
    setPhotoAspectRatio(result.aspectRatio);
  }, []);

  // Derive totals based on active tab
  const isAreasTab = activeTab === 'areas';
  const totalUnits = isAreasTab
    ? selectedAreas.reduce((sum, a) => sum + a.totalUnits, 0)
    : points.reduce((sum, p) => sum + p.units, 0);

  const hasContent = isAreasTab
    ? selectedAreas.length > 0
    : points.length > 0 || (activeTab === 'photo' && photoDataUrl);

  const handleSave = async () => {
    setSaving(true);
    try {
      const isPhotoMode = activeTab === 'photo' && photoDataUrl;
      const finalPoints = isAreasTab ? selectedAreasToPoints(selectedAreas) : points;
      const finalTotalUnits = isAreasTab
        ? selectedAreas.reduce((sum, a) => sum + a.totalUnits, 0)
        : points.reduce((sum, p) => sum + p.units, 0);

      const planData: TreatmentPlanData = {
        diagramType: isAreasTab ? 'treatment-areas' : (isPhotoMode ? 'patient-photo' : 'face-front'),
        points: finalPoints,
        totalUnits: Math.round(finalTotalUnits * 100) / 100,
        overallNotes,
        ...(isPhotoMode ? { photoDataUrl, photoAspectRatio } : {}),
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
      const finalPoints = isAreasTab ? selectedAreasToPoints(selectedAreas) : points;
      const diagramType = isAreasTab ? 'treatment-areas' as const : 'face-front' as const;
      await authFetch('/api/treatment-templates', {
        method: 'POST',
        body: JSON.stringify({
          name: `${tTypes(type as keyof IntlMessages['consentTypes'])} - ${t(diagramType as keyof IntlMessages['treatmentPlan'])}`,
          type,
          bodyRegion: 'OTHER',
          templateData: { diagramType, points: finalPoints, totalUnits: Math.round(totalUnits * 100) / 100, overallNotes },
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

        {/* Consent type selector */}
        <Select value={type} onValueChange={(v) => handleTypeChange(v as ConsentType)}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CONSENT_TYPES.map((ct) => (
              <SelectItem key={ct} value={ct}>{tTypes(ct as keyof IntlMessages['consentTypes'])}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="photo" className="flex-1 gap-1.5">
              <Camera className="h-3.5 w-3.5" />
              {t('photoMode')}
            </TabsTrigger>
            <TabsTrigger value="areas" className="flex-1 gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" />
              {t('treatmentAreasMode')}
            </TabsTrigger>
          </TabsList>

          {/* Photo tab — two-column layout */}
          <TabsContent value="photo" className="mt-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                {!photoDataUrl ? (
                  <PhotoCapture onCapture={handlePhotoCapture} />
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{t('photoAnnotationHint')}</p>
                      <div className="flex gap-2">
                        {points.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearAll}
                            className="text-xs text-destructive hover:underline"
                          >
                            {t('clearAll')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setPhotoDataUrl(null)}
                          className="text-xs text-muted-foreground hover:underline"
                        >
                          {t('retakePhoto')}
                        </button>
                      </div>
                    </div>
                    <PhotoAnnotationCanvas
                      photoDataUrl={photoDataUrl}
                      points={points}
                      onPointAdd={handlePointAdd}
                      onPointUpdate={handlePointUpdate}
                      onPointRemove={handlePointRemove}
                      consentType={type}
                    />
                  </>
                )}
              </div>
              <div className="space-y-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('target')}</TableHead>
                      <TableHead>{t('product')}</TableHead>
                      <TableHead>{t('units')}</TableHead>
                      <TableHead>{t('technique')}</TableHead>
                      <TableHead>{t('batchNumber')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {points.map((point) => (
                      <TableRow key={point.id}>
                        <TableCell className="text-sm text-muted-foreground">{point.muscle || '\u2014'}</TableCell>
                        <TableCell className="text-sm">{point.product}</TableCell>
                        <TableCell className="text-sm">{point.units}</TableCell>
                        <TableCell className="text-sm">{tTech(point.technique as keyof IntlMessages['techniques'])}</TableCell>
                        <TableCell className="text-sm">{point.batchNumber || '\u2014'}</TableCell>
                      </TableRow>
                    ))}
                    {points.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
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
              </div>
            </div>
          </TabsContent>

          {/* Treatment Areas tab — full-width */}
          <TabsContent value="areas" className="mt-3">
            <TreatmentAreasBuilder
              consentType={type}
              selectedAreas={selectedAreas}
              onSelectedAreasChange={setSelectedAreas}
            />
          </TabsContent>
        </Tabs>

        {/* Notes — always visible */}
        <div>
          <Label>{t('overallNotes')}</Label>
          <Input
            value={overallNotes}
            onChange={(e) => setOverallNotes(e.target.value)}
            placeholder={t('notesPlaceholder')}
          />
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={handleSaveAsTemplate} disabled={!hasContent}>
            {t('saveAsTemplate')}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasContent}>
            {saving ? t('saving') : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
