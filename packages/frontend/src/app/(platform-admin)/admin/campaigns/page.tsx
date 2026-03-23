'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { useAuthFetch } from '@/lib/auth-fetch';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Send, Eye, Loader2, ChevronLeft, ChevronRight, Upload, FileText,
  CheckCircle2, Clock, AlertCircle, Mail, AlertTriangle,
  X, Check, TriangleAlert, Settings2, ArrowRight, RotateCcw,
} from 'lucide-react';

import type { Recipient, SendStatus } from './lib/types';
import { BATCH_SIZE } from './lib/types';
import { parseCSV } from './lib/csv-parser';
import { extractVariables, renderTemplate, hasUnresolvedVars } from './lib/template-engine';
import { loadStatus, saveStatus } from './lib/status-storage';
import { StepIndicator } from './step-indicator';
import { PreviewPanel } from './preview-panel';

// ─── Component ───────────────────────────────────────────────
export default function CampaignsPage() {
  const authFetch = useAuthFetch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [step, setStep] = useState<'upload' | 'template' | 'review'>('upload');
  const [campaignName, setCampaignName] = useState('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [fileName, setFileName] = useState('');
  const [subject, setSubject] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [template, setTemplate] = useState('');
  const [currentBatch, setCurrentBatch] = useState(1);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  // ─── Derived values ────────────────────────────────────────
  const uniqueTemplateVars = useMemo(() => {
    const vars = extractVariables(template).concat(extractVariables(subject));
    return [...new Set(vars)];
  }, [template, subject]);

  const missingVarsInCsv = useMemo(
    () => uniqueTemplateVars.filter((v) => v !== 'email' && !csvHeaders.includes(v)),
    [uniqueTemplateVars, csvHeaders],
  );

  const totalBatches = Math.max(1, Math.ceil(recipients.length / BATCH_SIZE));

  const batchRecipients = useMemo(() => {
    const start = (currentBatch - 1) * BATCH_SIZE;
    return recipients.slice(start, start + BATCH_SIZE);
  }, [recipients, currentBatch]);

  const totalSent = recipients.filter((r) => r.status === 'sent').length;
  const totalFailed = recipients.filter((r) => r.status === 'failed').length;
  const batchSent = batchRecipients.filter((r) => r.status === 'sent').length;
  const allBatchSent = batchRecipients.length > 0 && batchSent === batchRecipients.length;

  const previewRecipient = previewIdx !== null ? recipients[previewIdx] : null;
  const previewHtml = previewRecipient ? renderTemplate(template, previewRecipient.fields) : null;
  const previewSubject = previewRecipient ? renderTemplate(subject, previewRecipient.fields) : null;
  const previewHasUnresolved = previewHtml
    ? hasUnresolvedVars(previewHtml) || hasUnresolvedVars(previewSubject || '')
    : false;

  // ─── Helpers ───────────────────────────────────────────────
  const displayName = (r: Recipient) =>
    r.fields.practice_name || r.fields.name || r.fields.doctor_name || r.email;

  const updateRecipientStatus = useCallback((email: string, status: SendStatus) => {
    saveStatus(campaignName, email, status);
    setRecipients((prev) => prev.map((r) => (r.email === email ? { ...r, status } : r)));
  }, [campaignName]);

  const validateRecipients = useCallback((list: Recipient[], vars: string[]) => {
    return list.map((r) => {
      const warnings: string[] = [];
      if (!r.email || !r.email.includes('@')) warnings.push('Invalid email');
      for (const v of vars) {
        if (v === 'email') continue;
        if (!r.fields[v]?.trim()) warnings.push(`Missing {{${v}}}`);
      }
      return { ...r, warnings };
    });
  }, []);

  // ─── Handlers ──────────────────────────────────────────────
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    if (!campaignName) setCampaignName(file.name.replace(/\.(csv|json)$/i, ''));

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;

      // Try JSON first
      try {
        const json = JSON.parse(text);
        if (Array.isArray(json) && json.length > 0) {
          const headers = Object.keys(json[0]);
          const emailKey = headers.find((h) => h.toLowerCase() === 'email');
          if (!emailKey) { toast.error('File must contain an "email" field'); return; }
          setCsvHeaders(headers);
          setRecipients(json.map((row: Record<string, string>) => ({
            email: (row[emailKey] || '').trim(),
            fields: row,
            status: loadStatus(campaignName || file.name, (row[emailKey] || '').trim()),
            warnings: [],
          })));
          toast.success(`${json.length} recipients loaded from JSON`);
          return;
        }
      } catch { /* not JSON — try CSV */ }

      const { headers, rows } = parseCSV(text);
      if (!headers.length || !rows.length) {
        toast.error('Could not parse file. Need at least a header row + one data row.');
        return;
      }
      const emailHeader = headers.find((h) => h.toLowerCase() === 'email');
      if (!emailHeader) { toast.error('File must contain an "email" column'); return; }

      setCsvHeaders(headers);
      setRecipients(
        rows
          .filter((row) => row[emailHeader]?.trim())
          .map((row) => ({
            email: row[emailHeader].trim(),
            fields: row,
            status: loadStatus(campaignName || file.name, row[emailHeader].trim()),
            warnings: [],
          })),
      );
      toast.success(`${rows.filter((row) => row[emailHeader]?.trim()).length} recipients loaded`);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  }

  function goToReview() {
    const validated = validateRecipients(recipients, uniqueTemplateVars);
    setRecipients(validated);
    const withWarnings = validated.filter((r) => r.warnings.length > 0);
    if (withWarnings.length > 0) {
      toast.warning(`${withWarnings.length} recipient(s) have warnings — please review`);
    }
    setStep('review');
    setCurrentBatch(1);
    setPreviewIdx(null);
  }

  async function handleSendBatch() {
    if (!fromAddress?.includes('@')) {
      toast.error('Enter a valid From address in the Template step first.');
      return;
    }
    const unsent = batchRecipients.filter((r) => r.status !== 'sent');
    if (!unsent.length) { toast.info('All emails in this batch already sent'); return; }

    const hasIssues = unsent.some((r) =>
      hasUnresolvedVars(renderTemplate(template, r.fields)) ||
      hasUnresolvedVars(renderTemplate(subject, r.fields)),
    );
    if (hasIssues) {
      toast.error('Some emails have unresolved {{variables}}. Fix your CSV or template first.');
      return;
    }

    setSending(true);
    try {
      const emails = unsent.map((r) => ({
        to: r.email,
        subject: renderTemplate(subject, r.fields),
        html: renderTemplate(template, r.fields),
      }));
      const res = await authFetch('/api/admin/email/send-campaign-batch', {
        method: 'POST',
        body: JSON.stringify({ emails, fromAddress }),
      });
      for (const result of (res.results ?? []) as { email: string; success: boolean }[]) {
        updateRecipientStatus(result.email, result.success ? 'sent' : 'failed');
      }
      toast.success(`Batch ${currentBatch}: ${res.sent} sent, ${res.failed} failed`);
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setSending(false);
    }
  }

  // ─── Status icon ───────────────────────────────────────────
  function StatusIcon({ status, warnings }: { status: SendStatus; warnings: string[] }) {
    if (warnings.length > 0) return <TriangleAlert className="size-4 text-amber-500" />;
    if (status === 'sent') return <CheckCircle2 className="size-4 text-emerald-500" />;
    if (status === 'failed') return <AlertCircle className="size-4 text-red-500" />;
    return <Clock className="size-4 text-zinc-400" />;
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 1: Upload
  // ═══════════════════════════════════════════════════════════
  if (step === 'upload') {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Email Campaigns</h1>
          <StepIndicator current="upload" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="size-5 text-teal-600" />
              Upload Recipients
            </CardTitle>
            <CardDescription>
              CSV or JSON with an <code className="rounded bg-zinc-100 px-1 py-0.5 text-[11px] dark:bg-zinc-800">email</code> column.
              Other columns become <code className="rounded bg-zinc-100 px-1 py-0.5 text-[11px] dark:bg-zinc-800">{'{{variables}}'}</code> for your template.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="campaignName">Campaign Name</Label>
              <Input
                id="campaignName"
                value={campaignName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCampaignName(e.target.value)}
                placeholder="e.g., Outreach Batch 3 — Frankfurt Tier 1"
              />
            </div>

            <div
              className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer ${
                fileName
                  ? 'border-teal-300 bg-teal-50/50 dark:border-teal-700 dark:bg-teal-950/30'
                  : 'border-zinc-300 hover:border-teal-400 dark:border-zinc-700 dark:hover:border-teal-600'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {fileName ? (
                <>
                  <CheckCircle2 className="size-8 text-teal-600 mb-2" />
                  <p className="text-sm font-medium text-teal-800 dark:text-teal-200">{fileName}</p>
                  <p className="text-xs text-teal-600 mt-1 dark:text-teal-400">Click to replace with a different file</p>
                </>
              ) : (
                <>
                  <FileText className="size-10 text-zinc-400 mb-3" />
                  <p className="text-sm font-medium">Drop CSV or JSON file here, or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">Required: email column. All other columns are available as template variables.</p>
                </>
              )}
              <input ref={fileInputRef} type="file" accept=".csv,.json" className="hidden" onChange={handleFileUpload} />
            </div>

            {recipients.length > 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-5 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                        {recipients.length} recipients ready
                      </span>
                    </div>
                    <p className="mt-1 ml-7 text-xs text-emerald-600 dark:text-emerald-400">
                      Available variables: {csvHeaders.map((h) => `{{${h}}}`).join(', ')}
                    </p>
                  </div>
                  <Button onClick={() => setStep('template')} variant="default">
                    Next: Template <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 2: Template
  // ═══════════════════════════════════════════════════════════
  if (step === 'template') {
    const canProceed = !missingVarsInCsv.length && template.trim() && subject.trim() && fromAddress.includes('@');

    return (
      <div className="mx-auto max-w-6xl flex flex-col h-[calc(100dvh-8.5rem)]">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 pb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setStep('upload')} aria-label="Back to upload">
              <ChevronLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Compose Email</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                {recipients.length} recipients &middot; {campaignName}
              </p>
            </div>
          </div>
          <StepIndicator current="template" />
        </div>

        {/* Content — two columns, fills available space */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Left column */}
          <div className="flex flex-col gap-3 min-h-0">
            {/* Settings row — compact */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="space-y-1">
                <Label htmlFor="from" className="text-xs">From</Label>
                <Input id="from" type="email" value={fromAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromAddress(e.target.value)}
                  placeholder="info@derma-consent.de" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="subject" className="text-xs">Subject</Label>
                <Input id="subject" value={subject}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
                  placeholder="{{subject}} or static text" className="h-8 text-sm" />
              </div>
            </div>

            {/* Variables bar — one line, always visible */}
            <div className="flex items-center gap-2 shrink-0 text-xs">
              <span className="text-muted-foreground shrink-0">Variables:</span>
              {uniqueTemplateVars.length === 0 ? (
                <span className="text-muted-foreground">none detected</span>
              ) : (
                <div className="flex gap-1 overflow-x-auto">
                  {uniqueTemplateVars.map((v) => {
                    const found = csvHeaders.includes(v);
                    return (
                      <span key={v} className={`inline-flex items-center gap-0.5 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${
                        found
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                      }`}>
                        {found ? <Check className="size-2.5" /> : <X className="size-2.5" />}
                        {v}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Template editor — fills remaining space */}
            <div className="flex-1 min-h-0 flex flex-col rounded-md border border-input overflow-hidden focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
              <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-50 border-b text-xs text-muted-foreground shrink-0 dark:bg-zinc-900">
                <span>HTML Template</span>
                {uniqueTemplateVars.length > 0 && !missingVarsInCsv.length && (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <Check className="size-3" /> {uniqueTemplateVars.length} variables matched
                  </span>
                )}
                {missingVarsInCsv.length > 0 && (
                  <span className="text-red-600 flex items-center gap-1">
                    <X className="size-3" /> {missingVarsInCsv.map((v) => `{{${v}}}`).join(', ')} not in CSV
                  </span>
                )}
              </div>
              <textarea
                value={template}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTemplate(e.target.value)}
                className="flex-1 w-full bg-transparent px-3 py-2 outline-none md:text-sm dark:bg-input/30 font-mono text-[11px] leading-relaxed resize-none"
                placeholder={'Paste your HTML email template here...\n\n<html>\n  <body>\n    <p>{{salutation}},</p>\n    <p>{{hook}}</p>\n  </body>\n</html>'}
              />
            </div>
          </div>

          {/* Right column — preview */}
          <div className="flex flex-col min-h-0 gap-2">
            {/* Recipient selector */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground shrink-0">Preview:</span>
              <Button variant="outline" size="icon" className="size-7" aria-label="Previous recipient"
                onClick={() => setPreviewIdx((p) => Math.max(0, (p ?? 0) - 1))} disabled={(previewIdx ?? 0) === 0}>
                <ChevronLeft className="size-3.5" />
              </Button>
              <select className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs"
                value={previewIdx ?? 0} onChange={(e) => setPreviewIdx(Number(e.target.value))}>
                {recipients.map((r, i) => (
                  <option key={i} value={i}>{i + 1}. {displayName(r)}</option>
                ))}
              </select>
              <Button variant="outline" size="icon" className="size-7" aria-label="Next recipient"
                onClick={() => setPreviewIdx((p) => Math.min(recipients.length - 1, (p ?? 0) + 1))}
                disabled={(previewIdx ?? 0) >= recipients.length - 1}>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>

            {/* Subject preview */}
            {subject && (
              <div className="rounded-md bg-zinc-50 px-3 py-1.5 text-xs dark:bg-zinc-900 shrink-0">
                <span className="text-muted-foreground">Subject: </span>
                <span className="font-medium">
                  {recipients.length > 0 ? renderTemplate(subject, recipients[previewIdx ?? 0].fields) : subject}
                </span>
              </div>
            )}

            {previewHasUnresolved && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-300 shrink-0">
                <AlertTriangle className="size-3.5 shrink-0" />
                Unresolved variables — email will look broken
              </div>
            )}

            {/* Email preview — fills remaining space */}
            {template.trim() ? (
              <div className="flex-1 min-h-0 rounded-lg border bg-white overflow-hidden">
                <iframe
                  srcDoc={previewHtml || renderTemplate(template, recipients[0]?.fields || {})}
                  sandbox="allow-same-origin" title="Email preview"
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                <Eye className="size-8 mb-2 opacity-20" />
                <p className="text-sm">Paste a template to see the preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer action bar — full width */}
        <div className="flex items-center justify-between shrink-0 pt-3">
          <div className="text-xs text-muted-foreground">
            {!fromAddress && 'Enter a From address'}
            {fromAddress && !subject.trim() && 'Enter a Subject line'}
            {fromAddress && subject.trim() && !template.trim() && 'Paste your HTML template'}
            {fromAddress && subject.trim() && template.trim() && missingVarsInCsv.length > 0 &&
              `Missing in CSV: ${missingVarsInCsv.map((v) => `{{${v}}}`).join(', ')}`}
            {canProceed && (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Ready to review
              </span>
            )}
          </div>
          <Button onClick={goToReview} disabled={!canProceed} variant="default">
            Review & Send <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 3: Review & Send
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="mx-auto max-w-6xl flex flex-col h-[calc(100dvh-8.5rem)]">
      {/* Header — same pattern as step 2 */}
      <div className="flex items-center justify-between shrink-0 pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setStep('template')} aria-label="Back to template">
            <ChevronLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{campaignName || 'Email Campaign'}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {totalSent} / {recipients.length} sent
              {totalFailed > 0 && <span className="text-red-500 ml-1">&middot; {totalFailed} failed</span>}
            </p>
          </div>
        </div>
        <StepIndicator current="review" />
      </div>

      {/* Progress bar */}
      <div className="rounded-full bg-zinc-100 h-1.5 overflow-hidden dark:bg-zinc-800 shrink-0 mb-4">
        <div
          className="h-full bg-teal-600 transition-all duration-500 rounded-full"
          style={{ width: `${recipients.length > 0 ? (totalSent / recipients.length) * 100 : 0}%` }}
        />
      </div>

      {/* Content — 50/50 split, same as step 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Left: Recipients + controls */}
        <div className="flex flex-col min-h-0 gap-3">
          {/* Batch controls + send button */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="size-7"
                onClick={() => { setCurrentBatch((b) => Math.max(1, b - 1)); setPreviewIdx(null); }}
                disabled={currentBatch === 1}>
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="text-xs font-medium tabular-nums">Batch {currentBatch}/{totalBatches}</span>
              <Button variant="outline" size="icon" className="size-7"
                onClick={() => { setCurrentBatch((b) => Math.min(totalBatches, b + 1)); setPreviewIdx(null); }}
                disabled={currentBatch === totalBatches}>
                <ChevronRight className="size-3.5" />
              </Button>
              {/* Batch quick nav — inline */}
              {totalBatches > 1 && (
                <div className="flex gap-1 ml-1">
                  {Array.from({ length: totalBatches }, (_, i) => i + 1).map((b) => {
                    const start = (b - 1) * BATCH_SIZE;
                    const batch = recipients.slice(start, start + BATCH_SIZE);
                    const allSent = batch.length > 0 && batch.every((r) => r.status === 'sent');
                    return (
                      <button key={b}
                        className={`size-6 rounded text-[10px] font-medium transition-colors ${
                          currentBatch === b ? 'bg-teal-600 text-white'
                            : allSent ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                              : 'bg-muted text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                        onClick={() => { setCurrentBatch(b); setPreviewIdx(null); }}>
                        {b}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {batchRecipients.some((r) => r.status === 'failed') && (
                <Button variant="outline" size="sm" disabled={sending}
                  onClick={() => batchRecipients.filter((r) => r.status === 'failed').forEach((r) => updateRecipientStatus(r.email, 'pending'))}>
                  <RotateCcw className="size-3" /> Retry
                </Button>
              )}
              <Button onClick={handleSendBatch} disabled={sending || allBatchSent || !fromAddress} variant="default" size="sm">
                {sending ? (
                  <><Loader2 className="size-3.5 animate-spin" /> Sending...</>
                ) : allBatchSent ? (
                  <><CheckCircle2 className="size-3.5" /> Sent</>
                ) : !fromAddress ? (
                  <><AlertTriangle className="size-3.5" /> No From</>
                ) : (
                  <><Send className="size-3.5" /> Send ({batchRecipients.length - batchSent})</>
                )}
              </Button>
            </div>
          </div>

          {/* Recipient rows */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5">
            {batchRecipients.map((r, batchIdx) => {
              const globalIdx = (currentBatch - 1) * BATCH_SIZE + batchIdx;
              const unresolved = hasUnresolvedVars(renderTemplate(template, r.fields)) ||
                hasUnresolvedVars(renderTemplate(subject, r.fields));
              const isSelected = previewIdx === globalIdx;

              return (
                <div key={globalIdx} onClick={() => setPreviewIdx(globalIdx)}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-2.5 cursor-pointer transition-all ${
                    isSelected ? 'border-teal-500 bg-teal-50/50 ring-1 ring-teal-500/20 dark:bg-teal-950/20'
                      : 'hover:border-zinc-400 dark:hover:border-zinc-600'
                  } ${unresolved ? 'border-amber-300 bg-amber-50/30 dark:bg-amber-950/10' : ''}`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <StatusIcon status={r.status} warnings={r.warnings} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{displayName(r)}</p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="size-3 shrink-0" /> {r.email}
                        {r.fields.city && <span>&middot; {r.fields.city}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {unresolved && <span className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5"><AlertTriangle className="size-3" /> Missing</span>}
                    {r.status === 'sent' && <span className="text-[10px] text-emerald-600 font-medium">Sent</span>}
                    {r.status === 'failed' && <span className="text-[10px] text-red-600 font-medium">Failed</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Preview — same width as left, fills height */}
        <div className="flex flex-col min-h-0">
          <PreviewPanel
            recipientName={previewRecipient ? displayName(previewRecipient) : null}
            recipientEmail={previewRecipient?.email ?? null}
            subject={previewSubject}
            html={previewHtml}
            hasUnresolved={previewHasUnresolved}
          />
        </div>
      </div>
    </div>
  );
}
