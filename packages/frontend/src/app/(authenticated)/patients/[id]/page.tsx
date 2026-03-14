'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations, useFormatter } from 'next-intl';
import useSWR from 'swr';
import { API_URL, createAuthFetcher } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { usePractice } from '@/hooks/use-practice';
import { useVault } from '@/hooks/use-vault';
import { VaultLockedPlaceholder } from '@/components/vault/vault-locked-placeholder';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { VaultUnlockBanner } from '@/components/vault/vault-unlock-banner';
import { EmptyState } from '@/components/ui/empty-state';
import { Trash2, ArrowLeft, Upload, Plus, Columns2, FileSignature } from 'lucide-react';
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

  const { isUnlocked, decryptForm } = useVault();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TreatmentTemplateSummary | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [decryptedName, setDecryptedName] = useState<string | null>(null);
  const [decryptedDob, setDecryptedDob] = useState<string | null>(null);
  const [decryptedEmail, setDecryptedEmail] = useState<string | null>(null);

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

  // Auto-decrypt patient fields when vault is unlocked
  const decryptPatientFields = useCallback(async () => {
    if (!isUnlocked || !patient) return;

    try {
      const namePayload = JSON.parse(patient.encryptedName);
      const name = await decryptForm(namePayload);
      setDecryptedName(typeof name === 'string' ? name : JSON.stringify(name));
    } catch {
      setDecryptedName(tPatients('decryptionFailed'));
    }

    if (patient.encryptedDob) {
      try {
        const dobPayload = JSON.parse(patient.encryptedDob);
        const dob = await decryptForm(dobPayload);
        setDecryptedDob(typeof dob === 'string' ? dob : JSON.stringify(dob));
      } catch {
        setDecryptedDob(null);
      }
    }

    if (patient.encryptedEmail) {
      try {
        const emailPayload = JSON.parse(patient.encryptedEmail);
        const email = await decryptForm(emailPayload);
        setDecryptedEmail(typeof email === 'string' ? email : JSON.stringify(email));
      } catch {
        setDecryptedEmail(null);
      }
    }
  }, [isUnlocked, patient, decryptForm, tPatients]);

  useEffect(() => {
    if (isUnlocked && patient) {
      decryptPatientFields();
    }
    if (!isUnlocked) {
      setDecryptedName(null);
      setDecryptedDob(null);
      setDecryptedEmail(null);
    }
  }, [isUnlocked, patient, decryptPatientFields]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await authFetch(`/api/patients/${id}`, { method: 'DELETE' });
      toast.success(t('deleted'));
      router.push('/patients');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('deleteError'));
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
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
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{t('title')}</h1>
        </div>
        <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          {t('delete')}
        </Button>
      </div>

      <VaultUnlockBanner />

      {/* Clinical Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{t('summaryTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-2xl font-bold tabular-nums">{patient.consentForms.length}</p>
              <p className="text-xs text-muted-foreground">{t('summaryConsents')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{plans.length}</p>
              <p className="text-xs text-muted-foreground">{t('summaryPlans')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{photos.length}</p>
              <p className="text-xs text-muted-foreground">{t('summaryPhotos')}</p>
            </div>
            <div>
              <p className="text-sm font-medium">
                {(() => {
                  const dates = [
                    ...patient.consentForms.map(c => c.signatureTimestamp || c.createdAt),
                    ...plans.map(p => p.createdAt),
                    ...photos.map(p => p.takenAt),
                  ].filter(Boolean).map(d => new Date(d).getTime());
                  if (dates.length === 0) return '—';
                  return format.dateTime(new Date(Math.max(...dates)), { dateStyle: 'medium' });
                })()}
              </p>
              <p className="text-xs text-muted-foreground">{t('summaryLastActivity')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('data')}</CardTitle>
          <CardDescription>{t('encryptedData')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">{t('nameLabel')}</span>
            {decryptedName ? (
              <span className="text-sm">{decryptedName}</span>
            ) : isUnlocked ? (
              <span className="inline-block h-4 w-24 animate-pulse rounded bg-muted align-middle" />
            ) : (
              <VaultLockedPlaceholder size="sm" className="inline-flex h-6 w-auto px-2 text-xs" />
            )}
          </div>
          <div>
            <span className="text-sm text-muted-foreground">{tPatients('dateOfBirth')}: </span>
            {decryptedDob ? (
              <span className="text-sm">{decryptedDob}</span>
            ) : !isUnlocked ? (
              <VaultLockedPlaceholder size="sm" className="inline-flex h-6 w-auto px-2 text-xs" />
            ) : null}
          </div>
          <div>
            <span className="text-sm text-muted-foreground">{tPatients('email')}: </span>
            {decryptedEmail ? (
              <span className="text-sm">{decryptedEmail}</span>
            ) : !isUnlocked ? (
              <VaultLockedPlaceholder size="sm" className="inline-flex h-6 w-auto px-2 text-xs" />
            ) : null}
          </div>
          <div>
            <span className="text-sm text-muted-foreground">{t('createdLabel')}</span>
            <span className="text-sm">
              {format.dateTime(new Date(patient.createdAt), { dateStyle: 'long' })}
            </span>
          </div>
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

      {/* Consents Section */}
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
                  <TableCell colSpan={4} className="p-0">
                    <EmptyState
                      icon={FileSignature}
                      title={t('noConsents')}
                      description={t('noConsentsDescription')}
                      className="py-12"
                    />
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

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('deleteConfirmTitle')}
        description={t('deleteConfirmDescription')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        onConfirm={handleDelete}
        variant="destructive"
        loading={isDeleting}
      />
    </div>
  );
}
