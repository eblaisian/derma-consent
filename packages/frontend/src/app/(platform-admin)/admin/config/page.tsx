'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { useAuthFetch } from '@/lib/auth-fetch';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, RotateCw, Pencil, Trash2, Save, X, Send, MessageSquare } from 'lucide-react';

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

const CATEGORY_LABELS: Record<Category, string> = {
  stripe: 'stripeConfig',
  email: 'emailConfig',
  sms: 'smsConfig',
  storage: 'storageConfig',
  plans: 'plansConfig',
  ai: 'aiConfig',
  notifications: 'notificationsConfig',
};

// Categories that have a real connection to test
const TESTABLE_CATEGORIES = new Set<string>(['stripe', 'email', 'sms', 'storage', 'ai']);

export default function AdminConfigPage() {
  const t = useTranslations('admin');
  const authFetch = useAuthFetch();
  const [activeCategory, setActiveCategory] = useState<Category>('stripe');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showEditSecret, setShowEditSecret] = useState(false);
  const [testingCategory, setTestingCategory] = useState<string | null>(null);
  const [testingSend, setTestingSend] = useState<string | null>(null);

  const { data: configs, isLoading, error, mutate } = useSWR<ConfigEntry[]>(
    `/api/admin/config?category=${activeCategory}`,
    (url: string) => authFetch(url),
  );

  const handleSave = async (key: string) => {
    if (!editValue.trim()) {
      toast.error(t('valueRequired'));
      return;
    }
    try {
      await authFetch(`/api/admin/config/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value: editValue }),
      });
      toast.success(t('saved'));
      setEditingKey(null);
      setEditValue('');
      setShowEditSecret(false);
      mutate();
    } catch {
      toast.error(t('saveFailed'));
    }
  };

  const handleReset = async (key: string) => {
    if (!confirm(t('resetConfirm'))) return;
    try {
      await authFetch(`/api/admin/config/${key}`, { method: 'DELETE' });
      toast.success(t('resetSuccess'));
      mutate();
    } catch {
      toast.error(t('saveFailed'));
    }
  };

  const handleTestConnection = async (category: string) => {
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
  };

  const handleSendTest = async (channel: 'email' | 'sms', recipient?: string) => {
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
  };

  const sourceVariant = (source: string) => {
    switch (source) {
      case 'database': return 'default' as const;
      case 'environment': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  const sourceLabel = (source: string) => {
    switch (source) {
      case 'database': return t('sourceDatabase');
      case 'environment': return t('sourceEnvironment');
      default: return t('sourceDefault');
    }
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title">{t('configuration')}</h1>
        <p className="text-foreground-secondary mt-1">{t('configurationDescription')}</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 border-b overflow-x-auto pb-px">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); cancelEdit(); }}
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeCategory === cat
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {t(CATEGORY_LABELS[cat] as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>

      {/* Config entries */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <p className="text-sm text-muted-foreground">{t('errorLoading')}</p>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            {t('retry')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {configs?.map((config) => (
            <Card key={config.key}>
              <CardContent className="p-4">
                {/* Key name + source badge + description */}
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-mono font-medium text-foreground">{config.key}</code>
                  <Badge variant={sourceVariant(config.source)} className="text-[10px] px-1.5 py-0">
                    {sourceLabel(config.source)}
                  </Badge>
                </div>
                {config.description && (
                  <p className="text-xs text-muted-foreground mb-3">{config.description}</p>
                )}

                {/* Edit mode */}
                {editingKey === config.key ? (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={config.isSecret && !showEditSecret ? 'password' : 'text'}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder={config.isSecret ? t('enterNewValue') : config.value}
                        className="font-mono text-sm pr-10"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave(config.key);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                      />
                      {config.isSecret && (
                        <button
                          type="button"
                          onClick={() => setShowEditSecret(!showEditSecret)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showEditSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                    <Button size="sm" onClick={() => handleSave(config.key)} className="gap-1.5">
                      <Save className="h-3.5 w-3.5" />
                      {t('save')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  /* View mode */
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono text-muted-foreground truncate">
                      {config.isSecret ? '••••••••••••' : config.value || '—'}
                    </code>
                    <Button size="sm" variant="outline" onClick={() => startEdit(config)} className="gap-1.5">
                      <Pencil className="h-3 w-3" />
                      {t('edit')}
                    </Button>
                    {config.source === 'database' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReset(config.key)}
                        className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                      >
                        <Trash2 className="h-3 w-3" />
                        {t('reset')}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {configs?.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">{t('noConfigKeys')}</p>
          )}
        </div>
      )}

      {/* Action buttons — only for relevant categories */}
      <div className="flex flex-wrap items-center gap-3 border-t pt-4">
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
  );
}
