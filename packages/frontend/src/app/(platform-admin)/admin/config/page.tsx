'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { useAuthFetch } from '@/lib/auth-fetch';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import {
  Eye,
  EyeOff,
  RotateCw,
  Pencil,
  Trash2,
  Save,
  X,
  Send,
  MessageSquare,
  CreditCard,
  Mail,
  Smartphone,
  HardDrive,
  Tag,
  Brain,
  Bell,
  CheckCircle2,
  AlertCircle,
  Circle,
  ShieldCheck,
  Info,
  Activity,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';

interface ConfigEntry {
  key: string;
  value: string;
  isSecret: boolean;
  description: string | null;
  category: string;
  source: 'database' | 'environment' | 'default';
}

interface ConfigRequirement {
  key: string;
  label: string;
  required: boolean;
  configured: boolean;
  instruction: string;
}

interface ServiceCheck {
  name: string;
  passed: boolean;
  detail: string;
}

interface ServiceValidation {
  category: string;
  status: 'healthy' | 'degraded' | 'error' | 'unconfigured';
  message: string;
  success: boolean;
  setupComplete: boolean;
  setupProgress: { configured: number; required: number };
  requirements: ConfigRequirement[];
  checks: ServiceCheck[];
  durationMs: number;
}

interface SystemHealthReport {
  overall: 'healthy' | 'degraded' | 'error';
  timestamp: string;
  services: ServiceValidation[];
}

const CATEGORIES = ['stripe', 'email', 'sms', 'storage', 'plans', 'ai', 'notifications'] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_META: Record<Category, { labelKey: string; icon: typeof CreditCard; description: string }> = {
  stripe: { labelKey: 'stripeConfig', icon: CreditCard, description: 'Payment processing and billing configuration' },
  email: { labelKey: 'emailConfig', icon: Mail, description: 'Email delivery service (Resend) settings' },
  sms: { labelKey: 'smsConfig', icon: Smartphone, description: 'SMS notifications via seven.io' },
  storage: { labelKey: 'storageConfig', icon: HardDrive, description: 'File storage (Supabase) configuration' },
  plans: { labelKey: 'plansConfig', icon: Tag, description: 'Subscription plan limits and pricing' },
  ai: { labelKey: 'aiConfig', icon: Brain, description: 'AI explainer and language model settings' },
  notifications: { labelKey: 'notificationsConfig', icon: Bell, description: 'Notification channels and behavior' },
};

const TESTABLE_CATEGORIES = new Set<string>(['stripe', 'email', 'sms', 'storage', 'ai']);

/** Group config keys by their first two segments, e.g. "stripe.secretKey" -> "stripe" */
function groupConfigs(configs: ConfigEntry[]): Map<string, ConfigEntry[]> {
  const groups = new Map<string, ConfigEntry[]>();
  for (const config of configs) {
    const parts = config.key.split('.');
    // Use the second segment as group name if it exists, otherwise use category
    const groupKey = parts.length >= 3 ? parts.slice(0, 2).join('.') : parts[0];
    const existing = groups.get(groupKey) ?? [];
    existing.push(config);
    groups.set(groupKey, existing);
  }
  return groups;
}

/** Format a group key into a human-readable label */
function formatGroupLabel(groupKey: string): string {
  const parts = groupKey.split('.');
  const last = parts[parts.length - 1];
  return last
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

/** Determine if a config value is a boolean toggle */
function isBooleanValue(value: string): boolean {
  return value === 'true' || value === 'false';
}

/** Format a config key into a readable label (last segment, prettified) */
function formatKeyLabel(key: string): string {
  const parts = key.split('.');
  const last = parts[parts.length - 1];
  return last
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

/** Determine category health: configured, partial, or unconfigured */
function getCategoryStatus(configs: ConfigEntry[] | undefined): 'configured' | 'partial' | 'unconfigured' {
  if (!configs || configs.length === 0) return 'unconfigured';
  const secretEntries = configs.filter((c) => c.isSecret);
  if (secretEntries.length === 0) return 'configured';
  const configuredSecrets = secretEntries.filter((c) => c.source !== 'default' && c.value !== '');
  if (configuredSecrets.length === secretEntries.length) return 'configured';
  if (configuredSecrets.length > 0) return 'partial';
  return 'unconfigured';
}

function StatusDot({ status }: { status: 'configured' | 'partial' | 'unconfigured' }) {
  if (status === 'configured') {
    return <span className="relative flex size-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex size-2 rounded-full bg-emerald-500" /></span>;
  }
  if (status === 'partial') {
    return <span className="inline-flex size-2 rounded-full bg-amber-500" />;
  }
  return <span className="inline-flex size-2 rounded-full bg-muted-foreground/30" />;
}

export default function AdminConfigPage() {
  const t = useTranslations('admin');
  const authFetch = useAuthFetch();
  const [activeCategory, setActiveCategory] = useState<Category>('stripe');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showEditSecret, setShowEditSecret] = useState(false);
  const [testingCategory, setTestingCategory] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<ServiceValidation | null>(null);
  const [testResultExpanded, setTestResultExpanded] = useState(false);
  const [testingSend, setTestingSend] = useState<string | null>(null);
  const [testDialog, setTestDialog] = useState<{ open: boolean; channel: 'email' | 'sms' | 'whatsapp' }>({ open: false, channel: 'email' });
  const [testRecipient, setTestRecipient] = useState('');
  const [healthCheckOpen, setHealthCheckOpen] = useState(false);
  const [healthCheckLoading, setHealthCheckLoading] = useState(false);
  const [healthReport, setHealthReport] = useState<SystemHealthReport | null>(null);

  // Fetch all categories for status dots
  const categoryFetchers = Object.fromEntries(
    CATEGORIES.map((cat) => [
      cat,
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useSWR<ConfigEntry[]>(
        `/api/admin/config?category=${cat}`,
        (url: string) => authFetch(url),
        { revalidateOnFocus: false, dedupingInterval: 30000 },
      ),
    ]),
  ) as Record<Category, ReturnType<typeof useSWR<ConfigEntry[]>>>;

  const activeData = categoryFetchers[activeCategory];
  const configs = activeData.data;
  const isLoading = activeData.isLoading;
  const error = activeData.error;
  const mutate = activeData.mutate;

  const handleSave = useCallback(async (key: string, value: string) => {
    if (!value.trim()) {
      toast.error(t('valueRequired'));
      return;
    }
    try {
      await authFetch(`/api/admin/config/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      });
      toast.success(t('saved'));
      setEditingKey(null);
      setEditValue('');
      setShowEditSecret(false);
      mutate();
    } catch {
      toast.error(t('saveFailed'));
    }
  }, [authFetch, mutate, t]);

  const handleToggle = useCallback(async (key: string, currentValue: string) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    try {
      await authFetch(`/api/admin/config/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value: newValue }),
      });
      toast.success(t('saved'));
      mutate();
    } catch {
      toast.error(t('saveFailed'));
    }
  }, [authFetch, mutate, t]);

  const handleReset = useCallback(async (key: string) => {
    if (!confirm(t('resetConfirm'))) return;
    try {
      await authFetch(`/api/admin/config/${key}`, { method: 'DELETE' });
      toast.success(t('resetSuccess'));
      mutate();
    } catch {
      toast.error(t('saveFailed'));
    }
  }, [authFetch, mutate, t]);

  const handleTestConnection = useCallback(async (category: string) => {
    setTestingCategory(category);
    setTestResult(null);
    setTestResultExpanded(false);
    try {
      const result: ServiceValidation = await authFetch(`/api/admin/config/test/${category}`, { method: 'POST' });
      setTestResult(result);
      setTestResultExpanded(true);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error(t('testFailed'));
    } finally {
      setTestingCategory(null);
    }
  }, [authFetch, t]);

  const handleHealthCheck = useCallback(async () => {
    setTestResult(null);
    setHealthCheckLoading(true);
    setHealthCheckOpen(true);
    try {
      const report: SystemHealthReport = await authFetch('/api/admin/config/validate-all', { method: 'POST' });
      setHealthReport(report);
    } catch {
      toast.error(t('testFailed'));
    } finally {
      setHealthCheckLoading(false);
    }
  }, [authFetch, t]);

  const handleSendTest = useCallback(async (channel: 'email' | 'sms' | 'whatsapp', recipient?: string) => {
    setTestingSend(channel);
    try {
      const body: Record<string, string> = { channel };
      if (recipient) body.recipient = recipient;
      const result = await authFetch('/api/admin/notifications/test', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error(t('testFailed'));
    } finally {
      setTestingSend(null);
    }
  }, [authFetch, t]);

  const startEdit = (config: ConfigEntry) => {
    setEditingKey(config.key);
    setEditValue(config.isSecret ? '' : config.value);
    setShowEditSecret(false);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
    setShowEditSecret(false);
  };

  const meta = CATEGORY_META[activeCategory];
  const Icon = meta.icon;
  const categoryStatus = getCategoryStatus(configs);
  const grouped = configs ? groupConfigs(configs) : new Map();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-page-title text-balance">{t('configuration')}</h1>
            <p className="text-muted-foreground mt-1 text-pretty">{t('configurationDescription')}</p>
          </div>
          <Button
            onClick={handleHealthCheck}
            disabled={healthCheckLoading}
            className="gap-2 shrink-0"
          >
            <Activity className={`size-4 ${healthCheckLoading ? 'animate-pulse' : ''}`} />
            {t('systemHealthCheck')}
          </Button>
        </div>

        {/* Category tabs */}
        <Tabs
          value={activeCategory}
          onValueChange={(value) => {
            setActiveCategory(value as Category);
            cancelEdit();
            setTestResult(null);
          }}
        >
          <TabsList variant="line" className="w-full justify-start overflow-x-auto">
            {CATEGORIES.map((cat) => {
              const catMeta = CATEGORY_META[cat];
              const CatIcon = catMeta.icon;
              const status = getCategoryStatus(categoryFetchers[cat].data);
              return (
                <TabsTrigger key={cat} value={cat} className="gap-2">
                  <CatIcon className="size-4" />
                  <span className="hidden sm:inline">{t(catMeta.labelKey as Parameters<typeof t>[0])}</span>
                  <StatusDot status={status} />
                </TabsTrigger>
              );
            })}
          </TabsList>

          {CATEGORIES.map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-6 space-y-6">
              {/* Category hero card with actions */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950">
                        <Icon className="size-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <CardTitle>{t(meta.labelKey as Parameters<typeof t>[0])}</CardTitle>
                        <CardDescription className="mt-0.5">{meta.description}</CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status badge */}
                      {categoryStatus === 'configured' && (
                        <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" />
                          Configured
                        </Badge>
                      )}
                      {categoryStatus === 'partial' && (
                        <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                          <AlertCircle className="size-3" />
                          Partial
                        </Badge>
                      )}
                      {categoryStatus === 'unconfigured' && (
                        <Badge variant="outline" className="gap-1 text-muted-foreground">
                          <Circle className="size-3" />
                          Not configured
                        </Badge>
                      )}

                      {/* Action buttons */}
                      {TESTABLE_CATEGORIES.has(activeCategory) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestConnection(activeCategory)}
                          disabled={testingCategory === activeCategory}
                          className="gap-2"
                        >
                          <RotateCw className={`h-3.5 w-3.5 ${testingCategory === activeCategory ? 'animate-spin' : ''}`} />
                          {t('testConnection')}
                        </Button>
                      )}

                      {activeCategory === 'email' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setTestRecipient(''); setTestDialog({ open: true, channel: 'email' }); }}
                          disabled={testingSend === 'email'}
                          className="gap-2"
                        >
                          <Send className={`h-3.5 w-3.5 ${testingSend === 'email' ? 'animate-pulse' : ''}`} />
                          {t('sendTestEmail')}
                        </Button>
                      )}

                      {activeCategory === 'sms' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setTestRecipient(''); setTestDialog({ open: true, channel: 'sms' }); }}
                            disabled={testingSend === 'sms'}
                            className="gap-2"
                          >
                            <MessageSquare className={`h-3.5 w-3.5 ${testingSend === 'sms' ? 'animate-pulse' : ''}`} />
                            {t('sendTestSms')}
                          </Button>
                          {(() => {
                            const smsConfigs = categoryFetchers.sms.data;
                            const isWhatsappOn = smsConfigs?.find((c) => c.key === 'sms.whatsappEnabled')?.value === 'true';
                            return (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setTestRecipient(''); setTestDialog({ open: true, channel: 'whatsapp' }); }}
                                disabled={testingSend === 'whatsapp' || !isWhatsappOn}
                                className="gap-2"
                              >
                                <MessageSquare className={`h-3.5 w-3.5 ${testingSend === 'whatsapp' ? 'animate-pulse' : ''}`} />
                                {isWhatsappOn ? t('sendTestWhatsapp') : t('whatsappComingSoon')}
                              </Button>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Inline test result */}
              {testResult && testResult.category === cat && (
                <ServiceValidationCard
                  result={testResult}
                  expanded={testResultExpanded}
                  onToggleExpand={() => setTestResultExpanded(!testResultExpanded)}
                  t={t}
                />
              )}

              {/* Config entries */}
              {isLoading ? (
                <ConfigSkeleton />
              ) : error ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 space-y-3">
                    <AlertCircle className="size-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">{t('errorLoading')}</p>
                    <Button variant="outline" size="sm" onClick={() => mutate()}>
                      {t('retry')}
                    </Button>
                  </CardContent>
                </Card>
              ) : configs && configs.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 space-y-2">
                    <Info className="size-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">{t('noConfigKeys')}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {Array.from(grouped.entries()).map(([groupKey, groupConfigs]: [string, ConfigEntry[]]) => (
                    <Card key={groupKey}>
                      {grouped.size > 1 && (
                        <CardHeader className="pb-0">
                          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {formatGroupLabel(groupKey)}
                          </CardTitle>
                        </CardHeader>
                      )}
                      <CardContent className={grouped.size > 1 ? 'pt-2' : ''}>
                        <div className="divide-y divide-border">
                          {groupConfigs.map((config) => (
                            <ConfigRow
                              key={config.key}
                              config={config}
                              isEditing={editingKey === config.key}
                              editValue={editValue}
                              showEditSecret={showEditSecret}
                              onStartEdit={() => startEdit(config)}
                              onCancelEdit={cancelEdit}
                              onSave={() => handleSave(config.key, editValue)}
                              onToggle={() => handleToggle(config.key, config.value)}
                              onReset={() => handleReset(config.key)}
                              onEditValueChange={setEditValue}
                              onToggleSecretVisibility={() => setShowEditSecret(!showEditSecret)}
                              t={t}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      {/* System Health Check Dialog */}
      <HealthCheckDialog
        open={healthCheckOpen}
        onOpenChange={setHealthCheckOpen}
        loading={healthCheckLoading}
        report={healthReport}
        onRecheck={handleHealthCheck}
        t={t}
      />

      {/* Send test notification dialog */}
      <Dialog open={testDialog.open} onOpenChange={(open) => setTestDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {testDialog.channel === 'email' ? t('sendTestEmail') : testDialog.channel === 'whatsapp' ? t('sendTestWhatsapp') : t('sendTestSms')}
            </DialogTitle>
            <DialogDescription>
              {testDialog.channel === 'email' ? t('enterTestEmail') : t('enterTestPhone')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="test-recipient">
              {testDialog.channel === 'email' ? t('emailLabel') : t('phoneLabel')}
            </Label>
            <Input
              id="test-recipient"
              type={testDialog.channel === 'email' ? 'email' : 'tel'}
              placeholder={testDialog.channel === 'email' ? 'name@example.com' : '+491234567890'}
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && testRecipient.trim()) {
                  setTestDialog({ open: false, channel: testDialog.channel });
                  handleSendTest(testDialog.channel, testRecipient.trim());
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTestDialog((prev) => ({ ...prev, open: false }))}
            >
              {t('cancel')}
            </Button>
            <Button
              disabled={!testRecipient.trim()}
              onClick={() => {
                setTestDialog({ open: false, channel: testDialog.channel });
                handleSendTest(testDialog.channel, testRecipient.trim());
              }}
            >
              <Send className="h-3.5 w-3.5 mr-2" />
              {t('send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

/** Individual config row */
function ConfigRow({
  config,
  isEditing,
  editValue,
  showEditSecret,
  onStartEdit,
  onCancelEdit,
  onSave,
  onToggle,
  onReset,
  onEditValueChange,
  onToggleSecretVisibility,
  t,
}: {
  config: ConfigEntry;
  isEditing: boolean;
  editValue: string;
  showEditSecret: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onToggle: () => void;
  onReset: () => void;
  onEditValueChange: (value: string) => void;
  onToggleSecretVisibility: () => void;
  t: ReturnType<typeof useTranslations<'admin'>>;
}) {
  const isBoolean = !config.isSecret && isBooleanValue(config.value);
  const isToggleOn = config.value === 'true';

  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
      {/* Row header: key name, source badge, description */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-foreground truncate">
            {formatKeyLabel(config.key)}
          </span>
          <SourceBadge source={config.source} t={t} />
          {config.isSecret && (
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
          )}
        </div>

        {/* Actions for non-boolean, non-editing state */}
        {!isBoolean && !isEditing && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Button size="xs" variant="ghost" onClick={onStartEdit} className="gap-1">
              <Pencil className="size-3" />
              {t('edit')}
            </Button>
            {config.source === 'database' && (
              <Button
                size="xs"
                variant="ghost"
                onClick={onReset}
                className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3" />
                {t('reset')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {config.description && (
        <p className="text-xs text-muted-foreground leading-relaxed -mt-1">
          {config.description}
        </p>
      )}

      {/* Value display / edit */}
      {isBoolean ? (
        /* Boolean toggle */
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={isToggleOn}
            aria-label={formatKeyLabel(config.key)}
            onClick={onToggle}
            className={`
              relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full
              transition-colors duration-200 ease-in-out
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              ${isToggleOn ? 'bg-violet-600' : 'bg-muted-foreground/25'}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm
                transition-transform duration-200 ease-in-out
                ${isToggleOn ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
          <span className="text-sm text-muted-foreground">
            {isToggleOn ? 'Enabled' : 'Disabled'}
          </span>
          {config.source === 'database' && (
            <Button
              size="xs"
              variant="ghost"
              onClick={onReset}
              className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
            >
              <Trash2 className="size-3" />
              {t('reset')}
            </Button>
          )}
        </div>
      ) : isEditing ? (
        /* Edit mode */
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              type={config.isSecret && !showEditSecret ? 'password' : 'text'}
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              placeholder={config.isSecret ? t('enterNewValue') : config.value}
              className="font-mono text-sm pr-10"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSave();
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
            {config.isSecret && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={onToggleSecretVisibility}
                className="absolute right-1.5 top-1/2 -translate-y-1/2"
                aria-label={showEditSecret ? 'Hide value' : 'Show value'}
              >
                {showEditSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>
          <Button size="sm" onClick={onSave} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {t('save')}
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelEdit} aria-label={t('cancel')}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        /* View mode */
        <div>
          {config.isSecret ? (
            <SecretValueDisplay config={config} />
          ) : (
            <code className="inline-block rounded-md bg-muted px-3 py-1.5 text-sm font-mono text-foreground/80 max-w-full truncate">
              {config.value || '\u2014'}
            </code>
          )}
        </div>
      )}
    </div>
  );
}

/** Secret field display showing configured/not-set status */
function SecretValueDisplay({ config }: { config: ConfigEntry }) {
  const hasValue = config.source !== 'default' && config.value !== '';

  return (
    <div className="flex items-center gap-2">
      <div className={`
        inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm
        ${hasValue
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground'
        }
      `}>
        {hasValue ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="font-medium">Configured</span>
            <span className="text-xs opacity-60 font-mono">&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</span>
          </>
        ) : (
          <>
            <Circle className="h-3.5 w-3.5" />
            <span>Not set</span>
          </>
        )}
      </div>
    </div>
  );
}

/** Source badge */
function SourceBadge({ source, t }: { source: string; t: ReturnType<typeof useTranslations<'admin'>> }) {
  const variant = source === 'database' ? 'default' as const : source === 'environment' ? 'secondary' as const : 'outline' as const;
  const label = source === 'database' ? t('sourceDatabase') : source === 'environment' ? t('sourceEnvironment') : t('sourceDefault');

  return (
    <Badge variant={variant} className="text-[10px] px-1.5 py-0 h-4 shrink-0">
      {label}
    </Badge>
  );
}

/** Loading skeleton */
function ConfigSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2].map((group) => (
        <Card key={group}>
          <CardHeader className="pb-0">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="divide-y divide-border">
              {[1, 2, 3].map((item) => (
                <div key={item} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-64" />
                  <Skeleton className="h-8 w-48" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Status icon for validation results */
function ValidationStatusIcon({ status }: { status: ServiceValidation['status'] }) {
  switch (status) {
    case 'healthy':
      return <CheckCircle2 className="size-4 text-emerald-500" />;
    case 'degraded':
      return <AlertCircle className="size-4 text-amber-500" />;
    case 'error':
      return <AlertCircle className="size-4 text-red-500" />;
    case 'unconfigured':
      return <Circle className="size-4 text-muted-foreground" />;
  }
}

/** Status badge for validation results */
function ValidationStatusBadge({ status }: { status: ServiceValidation['status'] }) {
  const styles: Record<ServiceValidation['status'], string> = {
    healthy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    degraded: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
    unconfigured: 'bg-muted text-muted-foreground',
  };
  const labels: Record<ServiceValidation['status'], string> = {
    healthy: 'Healthy',
    degraded: 'Degraded',
    error: 'Error',
    unconfigured: 'Not Configured',
  };

  return (
    <Badge variant="secondary" className={`gap-1 ${styles[status]}`}>
      <ValidationStatusIcon status={status} />
      {labels[status]}
    </Badge>
  );
}

/** Inline service validation result card */
function ServiceValidationCard({
  result,
  expanded,
  onToggleExpand,
  t,
}: {
  result: ServiceValidation;
  expanded: boolean;
  onToggleExpand: () => void;
  t: ReturnType<typeof useTranslations<'admin'>>;
}) {
  return (
    <Card className={`border-l-4 ${
      result.status === 'healthy' ? 'border-l-emerald-500' :
      result.status === 'degraded' ? 'border-l-amber-500' :
      result.status === 'error' ? 'border-l-red-500' :
      'border-l-muted-foreground/30'
    }`}>
      <CardContent className="py-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ValidationStatusBadge status={result.status} />
              <span className="text-sm text-muted-foreground">
                {result.durationMs}ms
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={onToggleExpand} className="gap-1">
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {t('details')}
            </Button>
          </div>

          {/* Setup progress */}
          {result.setupProgress.required > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('setupProgress')}</span>
                <span>{result.setupProgress.configured}/{result.setupProgress.required}</span>
              </div>
              <Progress value={(result.setupProgress.configured / result.setupProgress.required) * 100} className="h-1.5" />
            </div>
          )}

          {/* Message */}
          <p className="text-sm">{result.message}</p>

          {/* Expanded details */}
          {expanded && (
            <div className="space-y-4 pt-2">
              {/* Requirements */}
              {result.requirements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('requirements')}
                  </h4>
                  <div className="space-y-1.5">
                    {result.requirements.filter((r) => r.required).map((req) => (
                      <div key={req.key} className="flex items-start gap-2 text-sm">
                        {req.configured ? (
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <span className="font-medium">{req.label}</span>
                          {!req.configured && (
                            <p className="text-xs text-muted-foreground mt-0.5">{req.instruction}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checks */}
              {result.checks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('checks')}
                  </h4>
                  <div className="space-y-1.5">
                    {result.checks.map((check) => (
                      <div key={check.name} className="flex items-start gap-2 text-sm">
                        {check.passed ? (
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <span className="font-medium">{check.name}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">{check.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Health Check Dialog — full system health report */
function HealthCheckDialog({
  open,
  onOpenChange,
  loading,
  report,
  onRecheck,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  report: SystemHealthReport | null;
  onRecheck: () => void;
  t: ReturnType<typeof useTranslations<'admin'>>;
}) {
  const overallStyles: Record<string, string> = {
    healthy: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    degraded: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800',
  };

  const overallLabels: Record<string, string> = {
    healthy: 'All Systems Operational',
    degraded: 'Some Services Need Attention',
    error: 'Service Issues Detected',
  };

  const categoryLabels: Record<string, string> = {
    stripe: 'Stripe (Payments)',
    email: 'Email (Resend)',
    sms: 'SMS (seven.io)',
    storage: 'Storage',
    ai: 'AI / Explainer',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="size-5" />
            {t('systemHealthCheck')}
          </DialogTitle>
          <DialogDescription>
            {t('healthCheckDescription')}
          </DialogDescription>
        </DialogHeader>

        {loading && !report ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <RotateCw className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('runningHealthCheck')}</p>
          </div>
        ) : report ? (
          <div className="flex-1 overflow-y-auto -mx-6 px-6 min-h-0">
            <div className="space-y-4 pb-4">
              {/* Overall status banner */}
              <div className={`rounded-lg border p-4 ${overallStyles[report.overall]}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ValidationStatusIcon status={report.overall as ServiceValidation['status']} />
                    <div>
                      <p className="font-semibold">{overallLabels[report.overall]}</p>
                      <p className="text-xs opacity-75 flex items-center gap-1 mt-0.5">
                        <Clock className="size-3" />
                        {new Date(report.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Per-service cards */}
              {report.services.map((service) => (
                <HealthCheckServiceCard
                  key={service.category}
                  service={service}
                  label={categoryLabels[service.category] || service.category}
                  icon={CATEGORY_META[service.category as Category]?.icon}
                />
              ))}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('close')}
          </Button>
          <Button
            onClick={onRecheck}
            disabled={loading}
            className="gap-2"
          >
            <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('recheckAll')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Individual service card in the health check dialog */
function HealthCheckServiceCard({
  service,
  label,
  icon: Icon,
}: {
  service: ServiceValidation;
  label: string;
  icon?: typeof CreditCard;
}) {
  const [expanded, setExpanded] = useState(false);
  const IconComponent = Icon || Circle;

  return (
    <Card>
      <CardContent className="py-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <IconComponent className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">{label}</span>
              <ValidationStatusBadge status={service.status} />
              <span className="text-xs text-muted-foreground">{service.durationMs}ms</span>
            </div>
            {(service.checks.length > 0 || service.requirements.length > 0) && (
              <Button variant="ghost" size="xs" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>

          {/* Setup progress bar */}
          {service.setupProgress.required > 0 && (
            <div className="flex items-center gap-3">
              <Progress
                value={(service.setupProgress.configured / service.setupProgress.required) * 100}
                className="h-1 flex-1"
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {service.setupProgress.configured}/{service.setupProgress.required}
              </span>
            </div>
          )}

          <p className="text-xs text-muted-foreground">{service.message}</p>

          {expanded && (
            <div className="space-y-3 pt-2 border-t">
              {/* Requirements */}
              {service.requirements.filter((r) => r.required).length > 0 && (
                <div className="space-y-1">
                  {service.requirements.filter((r) => r.required).map((req) => (
                    <div key={req.key} className="flex items-start gap-2 text-xs">
                      {req.configured ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-medium">{req.label}</span>
                        {!req.configured && (
                          <p className="text-muted-foreground mt-0.5">{req.instruction}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Checks */}
              {service.checks.length > 0 && (
                <div className="space-y-1">
                  {service.checks.map((check) => (
                    <div key={check.name} className="flex items-start gap-2 text-xs">
                      {check.passed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-medium">{check.name}</span>
                        <span className="text-muted-foreground ml-1">— {check.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
