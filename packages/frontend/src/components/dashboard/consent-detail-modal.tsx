'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { API_URL, fetcher } from '@/lib/api';
import { useVault } from '@/hooks/use-vault';
import { useAuthFetch } from '@/lib/auth-fetch';
import { usePdfGeneration } from '@/hooks/use-pdf-generation';
import { getFormFields, type ConsentType } from '@/components/consent-form/form-fields';
import type { ConsentFormSummary } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { toast } from 'sonner';
import Link from 'next/link';
import { SendMessageDialog } from '@/components/shared/send-message-dialog';
import { User, Download, FileText, Loader2, Send, Calendar, ExternalLink, Clock } from 'lucide-react';

interface ConsentDetailModalProps {
  consent: ConsentFormSummary;
  onClose: () => void;
  onRefresh: () => void;
  patientId?: string;
}

export function ConsentDetailModal({ consent, onClose, onRefresh, patientId }: ConsentDetailModalProps) {
  const t = useTranslations('consentDetail');
  const tFields = useTranslations('medicalFields');
  const tOptions = useTranslations('medicalOptions');
  const tTypes = useTranslations('consentTypes');
  const tConsent = useTranslations('consent');
  const tStatus = useTranslations('consentStatus');
  const tTable = useTranslations('consentTable');
  const { decryptForm, isUnlocked } = useVault();
  const { generatePdf, downloadPdf, isGenerating } = usePdfGeneration();
  const authFetch = useAuthFetch();
  const decryptFormRef = useRef(decryptForm);
  useEffect(() => { decryptFormRef.current = decryptForm; }, [decryptForm]);

  const [decryptedData, setDecryptedData] = useState<Record<string, unknown> | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [localHasPdf, setLocalHasPdf] = useState(consent.hasPdf);
  const [sendEmail, setSendEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [noFormData, setNoFormData] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);

  const hasDecryptableData = ['SIGNED', 'PAID', 'COMPLETED'].includes(consent.status);
  const consentDate = consent.signatureTimestamp || consent.createdAt;
  const typeName = consent.type as ConsentType;
  const typeLabel = tTypes.has(typeName) ? tTypes(typeName) : consent.type;

  // Fetch encrypted consent data
  const { data: consentData, error: fetchError, isLoading: isFetching } = useSWR(
    consent.token ? `${API_URL}/api/consent/${consent.token}` : null,
    fetcher,
  );

  // Auto-decrypt when vault is unlocked
  useEffect(() => {
    if (!consentData || !isUnlocked || decryptedData || isDecrypting || decryptError || noFormData) return;

    const encrypted = consentData.encryptedResponses;
    const sessionKey = consentData.encryptedSessionKey;

    if (!encrypted || !sessionKey) {
      setNoFormData(true);
      return;
    }

    let cancelled = false;
    setIsDecrypting(true);
    decryptFormRef.current({
      encryptedSessionKey: sessionKey,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
    })
      .then((data) => {
        if (cancelled) return;
        setDecryptedData(data as Record<string, unknown>);
      })
      .catch(() => { if (!cancelled) setDecryptError(t('fetchError')); })
      .finally(() => { if (!cancelled) setIsDecrypting(false); });
    return () => { cancelled = true; };
  }, [consentData, isUnlocked, decryptedData, decryptError, noFormData, t]);

  // Pre-fill patient email by decrypting encryptedEmail from patient record
  useEffect(() => {
    if (sendEmail || !isUnlocked || !consent.patient?.encryptedEmail) return;
    // Also pre-fill from previous send
    if (consent.pdfSentTo) { setSendEmail(consent.pdfSentTo); return; }

    let cancelled = false;
    try {
      const parsed = JSON.parse(consent.patient.encryptedEmail);
      if (parsed.encryptedSessionKey && parsed.iv && parsed.ciphertext) {
        decryptFormRef.current(parsed)
          .then((email) => {
            if (!cancelled && typeof email === 'string' && email.includes('@')) {
              setSendEmail(email);
            }
          })
          .catch(() => { /* email decryption failed — leave empty */ });
      }
    } catch { /* not valid JSON — skip */ }
    return () => { cancelled = true; };
  }, [isUnlocked, consent.patient?.encryptedEmail, consent.pdfSentTo, sendEmail]);

  const consentType = consentData?.type as ConsentType | undefined;
  const fields = consentType ? getFormFields(consentType) : [];

  const resolveFieldLabel = (labelKey: string): string => {
    return tFields.has(labelKey as keyof IntlMessages['medicalFields'])
      ? tFields(labelKey as keyof IntlMessages['medicalFields'])
      : labelKey;
  };

  const resolveOptionValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? tConsent('yes') : tConsent('no');
    if (value === 'none' || value === 'noneOfAbove') return t('noneValue');
    if (Array.isArray(value)) {
      return value.map((v) => {
        const key = String(v);
        if (key === 'none' || key === 'noneOfAbove') return null;
        return tOptions.has(key as keyof IntlMessages['medicalOptions'])
          ? tOptions(key as keyof IntlMessages['medicalOptions'])
          : key;
      }).filter(Boolean).join(', ') || t('noneValue');
    }
    const strVal = String(value);
    return tOptions.has(strVal as keyof IntlMessages['medicalOptions'])
      ? tOptions(strVal as keyof IntlMessages['medicalOptions'])
      : strVal;
  };

  const handleGeneratePdf = useCallback(async () => {
    const success = await generatePdf(consent);
    if (success) {
      toast.success(tTable('pdfGenerated'));
      setLocalHasPdf(true);
      onRefresh();
    } else {
      toast.error(tTable('pdfError'));
    }
  }, [consent, generatePdf, tTable, onRefresh]);

  const handleDownloadPdf = useCallback(() => {
    downloadPdf(consent.id);
  }, [consent.id, downloadPdf]);

  const handleSendCopy = useCallback(async (email: string) => {
    setIsSending(true);
    try {
      await authFetch(`/api/consent/${consent.id}/send-copy`, {
        method: 'POST',
        body: JSON.stringify({ recipientEmail: email }),
      });
      toast.success(t('sendSuccess'));
      setShowSendDialog(false);
      onRefresh();
    } catch {
      toast.error(t('sendError'));
    } finally {
      setIsSending(false);
    }
  }, [consent.id, authFetch, t, onRefresh]);

  const isLoading = isFetching || isDecrypting;

  return (
    <>
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col gap-0">
        {/* ── Header ── */}
        <DialogHeader className="shrink-0 pb-3">
          <div className="flex items-center gap-2.5">
            <DialogTitle className="text-lg leading-tight">{typeLabel}</DialogTitle>
            <StatusBadge
              status={consent.status as import('@/lib/types').ConsentStatus}
              label={tStatus.has(consent.status as keyof IntlMessages['consentStatus']) ? tStatus(consent.status as keyof IntlMessages['consentStatus']) : undefined}
            />
          </div>
          <DialogDescription className="flex items-center gap-3 text-xs mt-1">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Calendar className="size-3" />
              {new Date(consentDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            {patientId && (
              <Link
                href={`/patients/${patientId}`}
                onClick={onClose}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
              >
                <User className="size-3" />
                {t('viewPatient')}
                <ExternalLink className="size-2.5" />
              </Link>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6 space-y-5 pb-4">

          {/* Loading — only show if no data yet */}
          {isLoading && !decryptedData && !noFormData && (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{t('decrypting')}</p>
            </div>
          )}

          {/* Errors */}
          {fetchError && <p className="text-sm text-destructive">{t('fetchError')}</p>}
          {decryptError && <p className="text-sm text-destructive">{decryptError}</p>}

          {/* ── PENDING / EXPIRED / REVOKED states ── */}
          {!hasDecryptableData && !isLoading && (
            <>
              {consent.status === 'PENDING' && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/30 px-4 py-3">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{t('pendingTitle')}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">{t('pendingNotice')}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{t('consentLink')}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/consent/${consent.token}`}
                        className="text-xs font-mono"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/consent/${consent.token}`);
                          toast.success(tTable('linkCopied'));
                        }}
                      >
                        {tTable('link')}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('expiresOn')}: {new Date(consent.expiresAt).toLocaleDateString('de-DE', { dateStyle: 'long' })}
                  </p>
                </div>
              )}
              {consent.status === 'EXPIRED' && (
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <p className="text-sm font-medium">{t('expiredTitle')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('expiredNotice', { date: new Date(consent.expiresAt).toLocaleDateString('de-DE', { dateStyle: 'long' }) })}
                  </p>
                </div>
              )}
              {consent.status === 'REVOKED' && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                  <p className="text-sm font-medium text-destructive">{t('revokedTitle')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('revokedNotice')}</p>
                </div>
              )}
            </>
          )}

          {/* ── No form data (PENDING but vault unlocked) ── */}
          {noFormData && !isLoading && hasDecryptableData && (
            <p className="text-sm text-muted-foreground py-4">{t('pendingNotice')}</p>
          )}

          {/* ── Decrypted form data ── */}
          {decryptedData && (
            <>
              {/* Q&A Table */}
              <div className="divide-y divide-border/40">
                {fields.map((field) => {
                  const value = decryptedData[field.name];
                  if (value === undefined && !field.required) return null;
                  return (
                    <div key={field.name} className="flex justify-between gap-6 py-2.5 px-1 text-[13px]">
                      <span className="text-muted-foreground shrink-0">{resolveFieldLabel(field.labelKey)}</span>
                      <span className="text-right">{resolveOptionValue(value)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Signature */}
              {typeof decryptedData.signatureData === 'string' && (
                <div className="pt-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">{t('signature')}</Label>
                  <div className="rounded-lg bg-muted/20 px-3 py-2 max-h-28 overflow-hidden flex items-center justify-center">
                    <img src={decryptedData.signatureData as string} alt="Signature" className="max-h-20 max-w-full object-contain" />
                  </div>
                </div>
              )}

              {/* ── Actions ── */}
              <div className="flex items-center gap-2 border-t border-border/50 pt-3">
                {localHasPdf ? (
                  <>
                    <Button onClick={handleDownloadPdf} variant="outline" size="sm">
                      <Download className="size-3.5 mr-1.5" />
                      {tTable('downloadPdf')}
                    </Button>
                    <Button onClick={() => setShowSendDialog(true)} variant="outline" size="sm">
                      <Send className="size-3.5 mr-1.5" />
                      {t('tabSend')}
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleGeneratePdf} disabled={isGenerating} size="sm">
                    {isGenerating ? (
                      <><Loader2 className="size-3.5 mr-1.5 animate-spin" />{tTable('generatingPdf')}</>
                    ) : (
                      <><FileText className="size-3.5 mr-1.5" />{tTable('generatePdf')}</>
                    )}
                  </Button>
                )}

                {consent.pdfSentAt && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {t('lastSent')}: {consent.pdfSentTo}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>

    <SendMessageDialog
      open={showSendDialog}
      onOpenChange={setShowSendDialog}
      defaultEmail={sendEmail}
      title={t('tabSend')}
      description={t('sendDescription')}
      loading={isSending}
      onSend={handleSendCopy}
    />
    </>
  );
}
