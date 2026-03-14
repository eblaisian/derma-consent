'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { useAuthFetch } from '@/lib/auth-fetch';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
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
} from 'lucide-react';

interface ConfigEntry {
  key: string;
  value: string;
  isSecret: boolean;
  description: string | null;
  category: string;
  source: 'database' | 'environment' | 'default';
}

const CATEGORIES = ['stripe', 'email', 'sms', 'storage', 'plans', 'ai', 'notifications'] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_META: Record<Category, { labelKey: string; icon: typeof CreditCard; description: string }> = {
  stripe: { labelKey: 'stripeConfig', icon: CreditCard, description: 'Payment processing and billing configuration' },
  email: { labelKey: 'emailConfig', icon: Mail, description: 'Email delivery service (Resend) settings' },
  sms: { labelKey: 'smsConfig', icon: Smartphone, description: 'SMS notifications via Twilio' },
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
    return <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>;
  }
  if (status === 'partial') {
    return <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />;
  }
  return <span className="inline-flex h-2 w-2 rounded-full bg-muted-foreground/30" />;
}

export default function AdminConfigPage() {
  const t = useTranslations('admin');
  const authFetch = useAuthFetch();
  const [activeCategory, setActiveCategory] = useState<Category>('stripe');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showEditSecret, setShowEditSecret] = useState(false);
  const [testingCategory, setTestingCategory] = useState<string | null>(null);
  const [testingSend, setTestingSend] = useState<string | null>(null);

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
    try {
      const result = await authFetch(`/api/admin/config/test/${category}`, { method: 'POST' });
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

  const handleSendTest = useCallback(async (channel: 'email' | 'sms', recipient?: string) => {
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
        <div>
          <h1 className="text-page-title">{t('configuration')}</h1>
          <p className="text-muted-foreground mt-1">{t('configurationDescription')}</p>
        </div>

        {/* Category tabs */}
        <Tabs
          value={activeCategory}
          onValueChange={(value) => {
            setActiveCategory(value as Category);
            cancelEdit();
          }}
        >
          <TabsList variant="line" className="w-full justify-start overflow-x-auto">
            {CATEGORIES.map((cat) => {
              const catMeta = CATEGORY_META[cat];
              const CatIcon = catMeta.icon;
              const status = getCategoryStatus(categoryFetchers[cat].data);
              return (
                <TabsTrigger key={cat} value={cat} className="gap-2">
                  <CatIcon className="h-4 w-4" />
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
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950">
                        <Icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
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
                          <CheckCircle2 className="h-3 w-3" />
                          Configured
                        </Badge>
                      )}
                      {categoryStatus === 'partial' && (
                        <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                          <AlertCircle className="h-3 w-3" />
                          Partial
                        </Badge>
                      )}
                      {categoryStatus === 'unconfigured' && (
                        <Badge variant="outline" className="gap-1 text-muted-foreground">
                          <Circle className="h-3 w-3" />
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
                          onClick={() => handleSendTest('email')}
                          disabled={testingSend === 'email'}
                          className="gap-2"
                        >
                          <Send className={`h-3.5 w-3.5 ${testingSend === 'email' ? 'animate-pulse' : ''}`} />
                          {t('sendTestEmail')}
                        </Button>
                      )}

                      {activeCategory === 'sms' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const phone = prompt(t('enterTestPhone'));
                            if (phone) handleSendTest('sms', phone);
                          }}
                          disabled={testingSend === 'sms'}
                          className="gap-2"
                        >
                          <MessageSquare className={`h-3.5 w-3.5 ${testingSend === 'sms' ? 'animate-pulse' : ''}`} />
                          {t('sendTestSms')}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Config entries */}
              {isLoading ? (
                <ConfigSkeleton />
              ) : error ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 space-y-3">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">{t('errorLoading')}</p>
                    <Button variant="outline" size="sm" onClick={() => mutate()}>
                      {t('retry')}
                    </Button>
                  </CardContent>
                </Card>
              ) : configs && configs.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 space-y-2">
                    <Info className="h-8 w-8 text-muted-foreground/40" />
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
              <Pencil className="h-3 w-3" />
              {t('edit')}
            </Button>
            {config.source === 'database' && (
              <Button
                size="xs"
                variant="ghost"
                onClick={onReset}
                className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" />
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
              <Trash2 className="h-3 w-3" />
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
