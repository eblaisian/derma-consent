'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations, useFormatter } from 'next-intl';
import useSWR from 'swr';
import { API_URL, createAuthFetcher } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { usePractice } from '@/hooks/use-practice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Trash2, ArrowLeft, Upload, Plus, Columns2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PhotoGallery } from '@/components/photos/photo-gallery';
import { PhotoUploadDialog } from '@/components/photos/photo-upload-dialog';
import { PhotoComparisonViewer } from '@/components/photos/photo-comparison-viewer';
import { TreatmentHistory } from '@/components/treatment-plan/treatment-history';
import { TreatmentPlanEditor } from '@/components/treatment-plan/treatment-plan-editor';
import { TemplatePickerDialog } from '@/components/treatment-plan/template-picker-dialog';
import type { TreatmentPhotoSummary, TreatmentPlanSummary, TreatmentTemplateSummary } from '@/lib/types';

interface PatientDetail {
  id: string;
  encryptedName: string;
  encryptedDob: string | null;
  encryptedEmail: string | null;
  createdAt: string;
  consentForms: Array<{
    id: string;
    token: string;
    type: string;
    status: string;
    createdAt: string;
    signatureTimestamp: string | null;
    expiresAt: string;
  }>;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export default function PatientDetailPage() {
  const t = useTranslations('patientDetail');
  const tStatus = useTranslations('consentStatus');
  const tTypes = useTranslations('consentTypes');
  const tTable = useTranslations('consentTable');
  const tPatients = useTranslations('patients');
  const tPhotos = useTranslations('photos');
  const tPlan = useTranslations('treatmentPlan');
  const format = useFormatter();
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const { practice } = usePractice();
  const authFetch = useAuthFetch();
  const router = useRouter();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TreatmentTemplateSummary | null>(null);

  const fetcher = createAuthFetcher(session?.accessToken);

  const { data: patient } = useSWR<PatientDetail>(
    session?.accessToken && id ? `${API_URL}/api/patients/${id}` : null,
    fetcher,
  );

  const { data: photosData, mutate: mutatePhotos } = useSWR<PaginatedResponse<TreatmentPhotoSummary>>(
    session?.accessToken && id ? `${API_URL}/api/photos/patient/${id}` : null,
    fetcher,
  );

  const { data: plansData, mutate: mutatePlans } = useSWR<PaginatedResponse<TreatmentPlanSummary>>(
    session?.accessToken && id ? `${API_URL}/api/treatment-plans/patient/${id}` : null,
    fetcher,
  );

  const { data: templates } = useSWR<TreatmentTemplateSummary[]>(
    session?.accessToken ? `${API_URL}/api/treatment-templates` : null,
    fetcher,
  );

  const handleDelete = async () => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      await authFetch(`/api/patients/${id}`, { method: 'DELETE' });
      toast.success(t('deleted'));
      router.push('/patients');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('deleteError'));
    }
  };

  const handleTemplateSelect = (tmpl: TreatmentTemplateSummary) => {
    setSelectedTemplate(tmpl);
    setEditorOpen(true);
  };

  if (!patient) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const photos = photosData?.items ?? [];
  const plans = plansData?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/patients"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">ID: {patient.id}</p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          {t('delete')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('data')}</CardTitle>
          <CardDescription>{t('encryptedData')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">{t('nameLabel')}</span>
            <span className="text-sm">{tPatients('encrypted')}</span>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">{t('createdLabel')}</span>
            <span className="text-sm">
              {format.dateTime(new Date(patient.createdAt), { dateStyle: 'long' })}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('consents')}</CardTitle>
          <CardDescription>{t('consentCount', { count: patient.consentForms.length })}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tTable('type')}</TableHead>
                <TableHead>{tTable('status')}</TableHead>
                <TableHead>{tTable('createdAt')}</TableHead>
                <TableHead>{tStatus('SIGNED')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patient.consentForms.map((consent) => (
                <TableRow key={consent.id}>
                  <TableCell className="font-medium">
                    {tTypes.has(consent.type as keyof IntlMessages['consentTypes'])
                      ? tTypes(consent.type as keyof IntlMessages['consentTypes'])
                      : consent.type}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {tStatus.has(consent.status as keyof IntlMessages['consentStatus'])
                        ? tStatus(consent.status as keyof IntlMessages['consentStatus'])
                        : consent.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format.dateTime(new Date(consent.createdAt), { dateStyle: 'medium' })}
                  </TableCell>
                  <TableCell>
                    {consent.signatureTimestamp
                      ? format.dateTime(new Date(consent.signatureTimestamp), { dateStyle: 'medium', timeStyle: 'short' })
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {patient.consentForms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    {t('noConsents')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Photos Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('photos')}</CardTitle>
              <CardDescription>{t('photoCount', { count: photos.length })}</CardDescription>
            </div>
            <div className="flex gap-2">
              {photos.length >= 2 && (
                <Button variant="outline" size="sm" onClick={() => setComparisonOpen(true)}>
                  <Columns2 className="mr-2 h-4 w-4" />
                  {tPhotos('compare')}
                </Button>
              )}
              {practice && (
                <Button size="sm" onClick={() => setUploadOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  {tPhotos('upload')}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PhotoGallery photos={photos} />
        </CardContent>
      </Card>

      {/* Treatment Plans Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('treatmentPlans')}</CardTitle>
              <CardDescription>{t('treatmentPlanCount', { count: plans.length })}</CardDescription>
            </div>
            <div className="flex gap-2">
              {templates && templates.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setTemplatePickerOpen(true)}>
                  {tPlan('fromTemplate')}
                </Button>
              )}
              {practice && (
                <Button size="sm" onClick={() => { setSelectedTemplate(null); setEditorOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  {tPlan('newPlan')}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TreatmentHistory plans={plans} />
        </CardContent>
      </Card>

      {/* Dialogs */}
      {practice && (
        <>
          <PhotoUploadDialog
            open={uploadOpen}
            onOpenChange={setUploadOpen}
            patientId={id}
            practice={practice}
            onUploaded={() => mutatePhotos()}
          />
          <PhotoComparisonViewer
            open={comparisonOpen}
            onOpenChange={setComparisonOpen}
            photos={photos}
          />
          <TreatmentPlanEditor
            open={editorOpen}
            onOpenChange={setEditorOpen}
            patientId={id}
            practice={practice}
            template={selectedTemplate}
            onSaved={() => mutatePlans()}
          />
        </>
      )}
      {templates && (
        <TemplatePickerDialog
          open={templatePickerOpen}
          onOpenChange={setTemplatePickerOpen}
          templates={templates}
          onSelect={handleTemplateSelect}
        />
      )}
    </div>
  );
}
