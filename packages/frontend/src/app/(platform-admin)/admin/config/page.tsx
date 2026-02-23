'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { useAuthFetch } from '@/lib/auth-fetch';
import { toast } from 'sonner';
import { Eye, EyeOff, RotateCw } from 'lucide-react';

interface ConfigEntry {
  key: string;
  value: string;
  isSecret: boolean;
  description: string | null;
  category: string;
  source: 'database' | 'environment' | 'default';
}

const CATEGORIES = ['stripe', 'email', 'sms', 'storage', 'plans'] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_LABELS = {
  stripe: 'stripeConfig',
  email: 'emailConfig',
  sms: 'smsConfig',
  storage: 'storageConfig',
  plans: 'plansConfig',
} as const;

export default function AdminConfigPage() {
  const t = useTranslations('admin');
  const authFetch = useAuthFetch();
  const [activeCategory, setActiveCategory] = useState<Category>('stripe');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showSecrets, setShowSecrets] = useState<Set<string>>(new Set());
  const [testingCategory, setTestingCategory] = useState<string | null>(null);

  const { data: configs, isLoading, error, mutate } = useSWR<ConfigEntry[]>(
    `/api/admin/config?category=${activeCategory}`,
    (url: string) => authFetch(url),
  );

  const handleSave = async (key: string) => {
    try {
      await authFetch(`/api/admin/config/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value: editValue }),
      });
      toast.success(t('saved'));
      setEditingKey(null);
      setEditValue('');
      mutate();
    } catch {
      toast.error(t('saveFailed'));
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await authFetch(`/api/admin/config/${key}`, { method: 'DELETE' });
      toast.success(t('saved'));
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
        toast.success(t('testSuccess') + ': ' + result.message);
      } else {
        toast.error(t('testFailed') + ': ' + result.message);
      }
    } catch (error) {
      toast.error(t('testFailed'));
    } finally {
      setTestingCategory(null);
    }
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const sourceLabel = (source: string) => {
    switch (source) {
      case 'database': return t('sourceDatabase');
      case 'environment': return t('sourceEnvironment');
      default: return t('sourceDefault');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('configuration')}</h1>

      {/* Category tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setEditingKey(null); }}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeCategory === cat
                ? 'border-violet-500 text-violet-700 dark:text-violet-300'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(CATEGORY_LABELS[cat])}
          </button>
        ))}
      </div>

      {/* Config entries */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-3">
          <p className="text-sm text-muted-foreground">{t('errorLoading')}</p>
          <button
            onClick={() => mutate()}
            className="rounded border px-3 py-1.5 text-sm hover:bg-muted"
          >
            {t('retry')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {configs?.map((config) => (
            <div key={config.key} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono font-medium">{config.key}</code>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      config.source === 'database'
                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300'
                        : config.source === 'environment'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {sourceLabel(config.source)}
                    </span>
                  </div>
                  {config.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{config.description}</p>
                  )}
                </div>
              </div>

              <div className="mt-3">
                {editingKey === config.key ? (
                  <div className="flex items-center gap-2">
                    <input
                      type={config.isSecret ? 'password' : 'text'}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 rounded border bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSave(config.key)}
                      className="rounded bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
                    >
                      {t('save')}
                    </button>
                    <button
                      onClick={() => { setEditingKey(null); setEditValue(''); }}
                      className="rounded border px-3 py-1.5 text-sm"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-muted px-3 py-1.5 text-sm font-mono">
                      {config.isSecret
                        ? showSecrets.has(config.key)
                          ? config.value
                          : t('secretMasked')
                        : config.value || '-'
                      }
                    </code>
                    {config.isSecret && (
                      <button
                        onClick={() => toggleSecretVisibility(config.key)}
                        className="text-muted-foreground hover:text-foreground"
                        title={showSecrets.has(config.key) ? t('hide') : t('show')}
                      >
                        {showSecrets.has(config.key) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => { setEditingKey(config.key); setEditValue(config.isSecret ? '' : config.value); }}
                      className="rounded border px-3 py-1.5 text-sm hover:bg-muted"
                    >
                      {t('edit')}
                    </button>
                    {config.source === 'database' && (
                      <button
                        onClick={() => handleDelete(config.key)}
                        className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        {t('reset')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {configs?.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">{t('noConfigKeys')}</p>
          )}
        </div>
      )}

      {/* Test connection */}
      <div className="pt-2">
        <button
          onClick={() => handleTestConnection(activeCategory)}
          disabled={testingCategory === activeCategory}
          className="flex items-center gap-2 rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          <RotateCw className={`h-4 w-4 ${testingCategory === activeCategory ? 'animate-spin' : ''}`} />
          {t('testConnection')}
        </button>
      </div>
    </div>
  );
}
