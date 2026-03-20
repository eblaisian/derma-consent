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
import { VaultUnlockBanner } from '@/components/vault/vault-unlock-banner';
import { EmptyState } from '@/components/ui/empty-state';
import { Trash2, ArrowLeft, Upload, Plus, Columns2, FileSignature, Eye, Link as LinkIcon, Ban } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { StatusBadge } from '@/components/ui/status-badge';
import { DecryptedFormViewer } from '@/components/dashboard/decrypted-form-viewer';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PhotoGallery } from '@/components/photos/photo-gallery';
import { PhotoUploadDialog } from '@/components/photos/photo-upload-dialog';
import { PhotoComparisonViewer } from '@/components/photos/photo-comparison-viewer';
import { TreatmentHistory } from '@/components/treatment-plan/treatment-history';
import { TreatmentPlanEditor } from '@/components/treatment-plan/treatment-plan-editor';
import { TemplatePickerDialog } from '@/components/treatment-plan/template-picker-dialog';
import type { TreatmentPhotoSummary, TreatmentPlanSummary, TreatmentTemplateSummary } from '@/lib/types';
import { NewConsentDialog } from '@/components/dashboard/new-consent-dialog';
import { extractDecryptedValue } from '@/lib/decrypt-utils';

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

  const userRole = session?.user?.role || 'EMPFANG';
  const isClinical = userRole === 'ADMIN' || userRole === 'ARZT';
  const isAdmin = userRole === 'ADMIN';
  const { isUnlocked, decryptForm, requestUnlock } = useVault();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TreatmentTemplateSummary | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewConsentToken, setViewConsentToken] = useState<string | null>(null);
  const [revokeConsentToken, setRevokeConsentToken] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [decryptedName, setDecryptedName] = useState<string | null>(null);
  const [decryptedDob, setDecryptedDob] = useState<string | null>(null);
  const [decryptedEmail, setDecryptedEmail] = useState<string | null>(null);

  const fetcher = createAuthFetcher(session?.accessToken);

  const { data: patient, mutate: mutatePatient } = useSWR<PatientDetail>(
    session?.accessToken && id ? `${API_URL}/api/patients/${id}` : null,
    fetcher,
  );

  const { data: photosData, mutate: mutatePhotos } = useSWR<PaginatedResponse<TreatmentPhotoSummary>>(
    isClinical && session?.accessToken && id ? `${API_URL}/api/photos/patient/${id}` : null,
    fetcher,
  );

  const { data: plansData, mutate: mutatePlans } = useSWR<PaginatedResponse<TreatmentPlanSummary>>(
    isClinical && session?.accessToken && id ? `${API_URL}/api/treatment-plans/patient/${id}` : null,
    fetcher,
  );

  const { data: templates } = useSWR<TreatmentTemplateSummary[]>(
    isClinical && session?.accessToken ? `${API_URL}/api/treatment-templates` : null,
    fetcher,
  );

  // Auto-decrypt patient fields when vault is unlocked
  const decryptPatientFields = useCallback(async () => {
    if (!isUnlocked || !patient) return;

    try {
      const namePayload = JSON.parse(patient.encryptedName);
      const name = await decryptForm(namePayload);
      setDecryptedName(extractDecryptedValue(name));
    } catch {
      setDecryptedName(tPatients('decryptionFailed'));
    }

    if (patient.encryptedDob) {
      try {
        const dobPayload = JSON.parse(patient.encryptedDob);
        const dob = await decryptForm(dobPayload);
        setDecryptedDob(extractDecryptedValue(dob));
      } catch {
        setDecryptedDob(null);
      }
    }

    if (patient.encryptedEmail) {
      try {
        const emailPayload = JSON.parse(patient.encryptedEmail);
        const email = await decryptForm(emailPayload);
        setDecryptedEmail(extractDecryptedValue(email));
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

  const handleCopyConsentLink = async (token: string) => {
    const link = `${window.location.origin}/consent/${token}`;
    await navigator.clipboard.writeText(link);
    toast.success(tTable('linkCopied'));
  };

  const handleViewConsent = (token: string) => {
    if (isUnlocked) {
      setViewConsentToken(token);
    } else {
      requestUnlock(() => setViewConsentToken(token));
    }
  };

  const handleRevokeConsent = async () => {
    if (!revokeConsentToken) return;
    setIsRevoking(true);
    try {
      await authFetch(`/api/consent/${revokeConsentToken}/revoke`, { method: 'PATCH' });
      toast.success(tTable('revoked'));
      setRevokeConsentToken(null);
      mutatePatient();
    } catch {
      toast.error(tTable('revokeError'));
    } finally {
      setIsRevoking(false);
    }
  };

  const canRevoke = (status: string) =>
    status === 'SIGNED' || status === 'COMPLETED' || status === 'PAID';

  const hasDecryptableData = (status: string) =>
    status === 'SIGNED' || status === 'PAID' || status === 'COMPLETED';

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
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const photos = photosData?.items ?? [];
  const plans = plansData?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/patients"><ArrowLeft className="size-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-page-title font-display font-light text-balance">{t('title')}</h1>
        </div>
        {isAdmin && (
          <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 size-4" />
            {t('delete')}
          </Button>
        )}
      </div>

      <VaultUnlockBanner />

      {/* Clinical Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{t('summaryTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-2 gap-4 ${isClinical ? 'sm:grid-cols-4' : 'sm:grid-cols-2'} stagger-children`}>
            <div className="animate-fade-in-up">
              <p className="text-2xl font-bold tabular-nums">{patient.consentForms.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('summaryConsents')}</p>
            </div>
            {isClinical && (
              <>
                <div className="animate-fade-in-up">
                  <p className="text-2xl font-bold tabular-nums">{plans.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('summaryPlans')}</p>
                </div>
                <div className="animate-fade-in-up">
                  <p className="text-2xl font-bold tabular-nums">{photos.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('summaryPhotos')}</p>
                </div>
              </>
            )}
            <div className="animate-fade-in-up">
              <p className="text-2xl font-bold tabular-nums">
                {(() => {
                  const dates = [
                    ...patient.consentForms.map(c => c.signatureTimestamp || c.createdAt),
                    ...plans.map(p => p.createdAt),
                    ...photos.map(p => p.takenAt),
                  ].filter(Boolean).map(d => new Date(d).getTime());
                  if (dates.length === 0) return '—';
                  return format.dateTime(new Date(Math.max(...dates)), { dateStyle: 'short' });
                })()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('summaryLastActivity')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('data')}</CardTitle>
          <CardDescription>{t('encryptedData')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!isUnlocked ? (
            <VaultLockedPlaceholder size="lg" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t('nameLabel')}</p>
                {decryptedName ? (
                  <p className="text-sm font-medium animate-fade-in">{decryptedName}</p>
                ) : (
                  <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
                )}
              </div>
              {(decryptedDob || patient.encryptedDob) && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{tPatients('dateOfBirth')}</p>
                  {decryptedDob ? (
                    <p className="text-sm font-medium tabular-nums animate-fade-in">{decryptedDob}</p>
                  ) : (
                    <div className="h-5 w-24 animate-pulse rounded-md bg-muted" />
                  )}
                </div>
              )}
              {(decryptedEmail || patient.encryptedEmail) && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{tPatients('email')}</p>
                  {decryptedEmail ? (
                    <p className="text-sm font-medium animate-fade-in">{decryptedEmail}</p>
                  ) : (
                    <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
                  )}
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t('createdLabel')}</p>
                <p className="text-sm font-medium tabular-nums">
                  {format.dateTime(new Date(patient.createdAt), { dateStyle: 'long' })}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Treatment Plans Section — clinical roles only */}
      {isClinical && (
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
                    <Plus className="mr-2 size-4" />
                    {tPlan('newPlan')}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TreatmentHistory plans={plans} onRefresh={() => mutatePlans()} patientEmail={decryptedEmail} />
          </CardContent>
        </Card>
      )}

      {/* Consents Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('consents')}</CardTitle>
            <CardDescription>{t('consentCount', { count: patient.consentForms.length })}</CardDescription>
          </div>
          <NewConsentDialog patientId={id} onCreated={() => mutatePatient()} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tTable('type')}</TableHead>
                <TableHead>{tTable('status')}</TableHead>
                <TableHead>{tTable('createdAt')}</TableHead>
                <TableHead className="text-end">{tTable('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patient.consentForms.map((consent) => (
                <TableRow key={consent.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">
                    {tTypes.has(consent.type as keyof IntlMessages['consentTypes'])
                      ? tTypes(consent.type as keyof IntlMessages['consentTypes'])
                      : consent.type}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={consent.status as import('@/lib/types').ConsentStatus}
                      label={tStatus.has(consent.status as keyof IntlMessages['consentStatus']) ? tStatus(consent.status as keyof IntlMessages['consentStatus']) : undefined}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format.dateTime(new Date(consent.createdAt), { dateStyle: 'medium' })}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon-xs" onClick={() => handleCopyConsentLink(consent.token)} aria-label={tTable('link')}>
                            <LinkIcon className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{tTable('link')}</TooltipContent>
                      </Tooltip>

                      {hasDecryptableData(consent.status) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon-xs" onClick={() => handleViewConsent(consent.token)} aria-label={tTable('decrypt')}>
                              <Eye className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{tTable('decrypt')}</TooltipContent>
                        </Tooltip>
                      )}

                      {isClinical && canRevoke(consent.status) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon-xs" className="text-destructive hover:text-destructive" onClick={() => setRevokeConsentToken(consent.token)} aria-label={tTable('revoke')}>
                              <Ban className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{tTable('revoke')}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
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

          <ConfirmDialog
            open={!!revokeConsentToken}
            onOpenChange={(open) => !open && setRevokeConsentToken(null)}
            title={tTable('revokeTitle')}
            description={tTable('revokeDescription')}
            confirmLabel={isRevoking ? tTable('revoking') : tTable('revoke')}
            cancelLabel={tTable('cancel')}
            onConfirm={handleRevokeConsent}
            variant="destructive"
            loading={isRevoking}
          />

          {viewConsentToken && (
            <DecryptedFormViewer
              token={viewConsentToken}
              onClose={() => setViewConsentToken(null)}
              patientName={decryptedName ?? undefined}
              patientId={id}
            />
          )}
        </CardContent>
      </Card>

      {/* Photos Section — clinical roles only */}
      {isClinical && (
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
                    <Columns2 className="mr-2 size-4" />
                    {tPhotos('compare')}
                  </Button>
                )}
                {practice && (
                  <Button size="sm" onClick={() => setUploadOpen(true)}>
                    <Upload className="mr-2 size-4" />
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
      )}

      {/* Clinical dialogs — ADMIN and ARZT only */}
      {isClinical && practice && (
        <>
          <PhotoUploadDialog
            open={uploadOpen}
            onOpenChange={setUploadOpen}
            patientId={id}
            practice={practice}
            onUploaded={() => mutatePhotos()}
            plans={plans}
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
      {isClinical && templates && (
        <TemplatePickerDialog
          open={templatePickerOpen}
          onOpenChange={setTemplatePickerOpen}
          templates={templates}
          onSelect={handleTemplateSelect}
        />
      )}

      {isAdmin && (
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
      )}
    </div>
  );
}
