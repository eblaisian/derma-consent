'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { API_URL, fetcher } from '@/lib/api';
import { useVault } from '@/hooks/use-vault';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useSession } from 'next-auth/react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { EncryptionBadge } from '@/components/ui/encryption-badge';
import { toast } from 'sonner';
import Link from 'next/link';
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
  const { data: session } = useSession();
  const authFetch = useAuthFetch();
  const decryptFormRef = useRef(decryptForm);
  useEffect(() => { decryptFormRef.current = decryptForm; }, [decryptForm]);

  const [decryptedData, setDecryptedData] = useState<Record<string, unknown> | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [localHasPdf, setLocalHasPdf] = useState(consent.hasPdf);
  const [sendEmail, setSendEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [noFormData, setNoFormData] = useState(false);

  const hasDecryptableData = ['SIGNED', 'PAID', 'COMPLETED'].includes(consent.status);
  const consentDate = consent.signatureTimestamp || consent.createdAt;
  const typeName = consent.type as ConsentType;
  const typeLabel = tTypes.has(typeName) ? tTypes(typeName) : consent.type;

  // Fetch encrypted consent data
  const { data: consentData, error: fetchError, isLoading: isFetching } = useSWR(
    consent.token ? `${API_URL}/api/consent/${consent.token}` : null,
    fetcher,
  );

  // Auto-decrypt when vault is unlocked (Issue #2 fix: separate "no data" from "decrypt error")
  useEffect(() => {
    if (!consentData || !isUnlocked || decryptedData || isDecrypting || decryptError || noFormData) return;

    const encrypted = consentData.encryptedResponses;
    const sessionKey = consentData.encryptedSessionKey;

    if (!encrypted || !sessionKey) {
      setNoFormData(true); // Not an error — form simply hasn't been filled
      return;
    }

    let cancelled = false;
    setIsDecrypting(true);
    decryptFormRef.current({
      encryptedSessionKey: sessionKey,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
    })
      .then((data) => { if (!cancelled) setDecryptedData(data as Record<string, unknown>); })
      .catch(() => { if (!cancelled) setDecryptError(t('fetchError')); })
      .finally(() => { if (!cancelled) setIsDecrypting(false); });
    return () => { cancelled = true; };
  }, [consentData, isUnlocked, decryptedData, decryptError, noFormData, t]);

  // Load PDF blob for preview
  useEffect(() => {
    if (!localHasPdf || !session?.accessToken) return;
    let cancelled = false;

    fetch(`${API_URL}/api/consent/${consent.id}/pdf`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load PDF');
        return res.blob();
      })
      .then((blob) => {
        if (!cancelled) setPdfBlobUrl(URL.createObjectURL(blob));
      })
      .catch(() => { /* PDF not available */ });

    return () => {
      cancelled = true;
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [localHasPdf, consent.id, session?.accessToken]);

  const consentType = consentData?.type as ConsentType | undefined;
  const fields = consentType ? getFormFields(consentType) : [];

  const resolveFieldLabel = (labelKey: string): string => {
    return tFields.has(labelKey as keyof IntlMessages['medicalFields'])
      ? tFields(labelKey as keyof IntlMessages['medicalFields'])
      : labelKey;
  };

  const resolveOptionValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? tConsent('yes') : tConsent('no');
    if (Array.isArray(value)) {
      return value.map((v) => {
        const key = String(v);
        return tOptions.has(key as keyof IntlMessages['medicalOptions'])
          ? tOptions(key as keyof IntlMessages['medicalOptions'])
          : key;
      }).join(', ');
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

  const handleSendCopy = useCallback(async () => {
    if (!sendEmail) return;
    setIsSending(true);
    try {
      await authFetch(`/api/consent/${consent.id}/send-copy`, {
        method: 'POST',
        body: JSON.stringify({ recipientEmail: sendEmail }),
      });
      toast.success(t('sendSuccess'));
      onRefresh();
    } catch {
      toast.error(t('sendError'));
    } finally {
      setIsSending(false);
    }
  }, [consent.id, sendEmail, authFetch, t, onRefresh]);

  const isLoading = isFetching || isDecrypting;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header — Issue #1 fix: date prominently shown */}
        <DialogHeader className="pb-0">
          <div className="flex items-center gap-2.5">
            <DialogTitle className="text-lg leading-tight">
              {typeLabel}
            </DialogTitle>
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
            {/* Issue #6 fix: remove noisy encryption badge, keep only for decrypted content */}
          </DialogDescription>
        </DialogHeader>

        {/* Patient link — Issue #4 fix: show "View patient" instead of UUID */}
        {patientId && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-1.5 -mt-1">
            <User className="size-3.5 text-muted-foreground" />
            <Link href={`/patients/${patientId}`} onClick={onClose} className="text-sm text-primary hover:underline underline-offset-4 inline-flex items-center gap-1">
              {t('viewPatient')}
              <ExternalLink className="size-3" />
            </Link>
          </div>
        )}

        <Tabs defaultValue={hasDecryptableData ? 'form' : 'info'} className="flex-1 flex flex-col min-h-0">
          <TabsList variant="line" className="w-full justify-start border-b shrink-0">
            {hasDecryptableData ? (
              <>
                <TabsTrigger value="form">
                  <FileText className="size-3.5 mr-1.5" />
                  {t('tabForm')}
                </TabsTrigger>
                <TabsTrigger value="pdf">
                  <Download className="size-3.5 mr-1.5" />
                  {t('tabPdf')}
                </TabsTrigger>
                <TabsTrigger value="send">
                  <Send className="size-3.5 mr-1.5" />
                  {t('tabSend')}
                </TabsTrigger>
              </>
            ) : (
              <TabsTrigger value="info">
                <Clock className="size-3.5 mr-1.5" />
                {t('tabInfo')}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Issue #5 fix: Useful content for PENDING/EXPIRED consents */}
          {!hasDecryptableData && (
            <TabsContent value="info" className="flex-1 overflow-y-auto px-1 py-4">
              <div className="space-y-4">
                {consent.status === 'PENDING' && (
                  <>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/30 px-4 py-3">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{t('pendingTitle')}</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">{t('pendingNotice')}</p>
                    </div>
                    <div className="space-y-2">
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
                    <div className="text-xs text-muted-foreground">
                      {t('expiresOn')}: {new Date(consent.expiresAt).toLocaleDateString('de-DE', { dateStyle: 'long' })}
                    </div>
                  </>
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
              </div>
            </TabsContent>
          )}

          {/* Tab: Form Data */}
          {hasDecryptableData && (
            <TabsContent value="form" className="flex-1 overflow-y-auto px-1 py-3">
              {fetchError && <p className="text-sm text-destructive">{t('fetchError')}</p>}
              {decryptError && <p className="text-sm text-destructive">{decryptError}</p>}

              {isLoading && (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{t('decrypting')}</p>
                </div>
              )}

              {/* Issue #2 fix: no-data shown as info, not error */}
              {noFormData && !isLoading && (
                <p className="text-sm text-muted-foreground py-4">{t('pendingNotice')}</p>
              )}

              {decryptedData && (
                <div className="space-y-3">
                  {fields.map((field) => {
                    const value = decryptedData[field.name];
                    if (value === undefined && !field.required) return null;
                    return (
                      <div key={field.name}>
                        <Label className="text-xs text-muted-foreground">{resolveFieldLabel(field.labelKey)}</Label>
                        <p className="text-sm mt-0.5">{resolveOptionValue(value)}</p>
                      </div>
                    );
                  })}

                  {typeof decryptedData.signatureData === 'string' && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-xs text-muted-foreground">{t('signature')}</Label>
                        <img
                          src={decryptedData.signatureData as string}
                          alt="Signature"
                          className="mt-1 border rounded max-h-32"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </TabsContent>
          )}

          {/* Tab: PDF Document — Issue #1 fix: use object tag instead of iframe to avoid CSP */}
          {hasDecryptableData && (
            <TabsContent value="pdf" className="flex-1 overflow-y-auto px-1 py-3">
              {localHasPdf && pdfBlobUrl ? (
                <div className="space-y-3">
                  <object
                    data={pdfBlobUrl}
                    type="application/pdf"
                    className="w-full h-[55vh] rounded-lg border bg-muted/20"
                  >
                    {/* Fallback if object tag doesn't work either */}
                    <div className="flex flex-col items-center justify-center h-[55vh] gap-3 text-center">
                      <FileText className="size-10 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">{t('pdfFallback')}</p>
                      <Button onClick={handleDownloadPdf} variant="outline" size="sm">
                        <Download className="size-3.5 mr-1.5" />
                        {tTable('downloadPdf')}
                      </Button>
                    </div>
                  </object>
                  <div className="flex items-center justify-between">
                    <Button onClick={handleDownloadPdf} variant="outline" size="sm">
                      <Download className="size-3.5 mr-1.5" />
                      {tTable('downloadPdf')}
                    </Button>
                  </div>
                </div>
              ) : localHasPdf && !pdfBlobUrl ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                  <FileText className="size-10 text-muted-foreground/30" />
                  <div>
                    <p className="text-sm font-medium">{t('noPdf')}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('noPdfDescription')}</p>
                  </div>
                  <Button onClick={handleGeneratePdf} disabled={isGenerating} size="sm">
                    {isGenerating ? (
                      <><Loader2 className="size-3.5 mr-1.5 animate-spin" />{tTable('generatingPdf')}</>
                    ) : (
                      <><FileText className="size-3.5 mr-1.5" />{tTable('generatePdf')}</>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>
          )}

          {/* Tab: Send to Patient */}
          {hasDecryptableData && (
            <TabsContent value="send" className="flex-1 overflow-y-auto px-1 py-3">
              {!localHasPdf ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <Send className="size-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">{t('sendRequiresPdf')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t('sendDescription')}</p>

                  <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
                    {t('sendPreview', { type: typeLabel, date: new Date(consentDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) })}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="send-email" className="text-sm">{t('recipientEmail')}</Label>
                    <Input
                      id="send-email"
                      type="email"
                      value={sendEmail}
                      onChange={(e) => setSendEmail(e.target.value)}
                      placeholder="patient@example.com"
                    />
                  </div>

                  <Button onClick={handleSendCopy} disabled={isSending || !sendEmail} size="sm">
                    {isSending ? (
                      <><Loader2 className="size-3.5 mr-1.5 animate-spin" />{t('sending')}</>
                    ) : (
                      <><Send className="size-3.5 mr-1.5" />{t('sendButton')}</>
                    )}
                  </Button>

                  {consent.pdfSentAt && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{t('lastSent')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(consent.pdfSentAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}
                        {consent.pdfSentTo && <span className="ml-1">→ {consent.pdfSentTo}</span>}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
