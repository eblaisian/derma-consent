'use client';

import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Pencil, Eye } from 'lucide-react';

export interface AftercareEditorHandle {
  getHTML: () => string;
  getText: () => string;
  getMarkdown: () => string;
}

interface AftercareEditorProps {
  content: string;
  onEdit: () => void;
}

export const AftercareEditor = forwardRef<AftercareEditorHandle, AftercareEditorProps>(
  function AftercareEditor({ content, onEdit }, ref) {
    const t = useTranslations('aftercare');
    const [mode, setMode] = useState<'preview' | 'edit'>('preview');
    const [markdown, setMarkdown] = useState(content);
    const previewRef = useRef<HTMLDivElement>(null);

    // Sync when parent content changes (regeneration)
    useEffect(() => {
      setMarkdown(content);
      setMode('preview');
    }, [content]);

    useImperativeHandle(ref, () => ({
      getHTML: () => previewRef.current?.innerHTML ?? '',
      getText: () => previewRef.current?.textContent ?? '',
      getMarkdown: () => markdown,
    }), [markdown]);

    const handleEditChange = (value: string) => {
      setMarkdown(value);
      onEdit();
    };

    return (
      <div className="flex flex-col min-h-0 flex-1 rounded-md border border-input bg-background overflow-hidden">
        {/* Mode toggle bar */}
        <div className="shrink-0 flex items-center border-b border-input bg-muted/50 px-1 py-1">
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-xs font-medium transition-colors',
              mode === 'preview'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Eye className="size-3.5" />
            {t('preview')}
          </button>
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-xs font-medium transition-colors',
              mode === 'edit'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Pencil className="size-3" />
            {t('edit')}
          </button>
        </div>

        {/* Content area — scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {mode === 'preview' ? (
            <div
              ref={previewRef}
              className={cn(
                'px-4 py-3 text-sm leading-relaxed',
                // Typography — these utility classes override Tailwind preflight
                '[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:leading-snug',
                '[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1.5',
                '[&_p]:mb-2 [&_p]:last:mb-0',
                '[&_ul]:list-disc [&_ol]:list-decimal',
                '[&_ul]:pl-5 [&_ol]:pl-5',
                '[&_ul]:mb-3 [&_ol]:mb-3',
                '[&_li]:mb-1 [&_li]:leading-relaxed',
                '[&_strong]:font-semibold',
                '[&_em]:italic',
              )}
            >
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={markdown}
              onChange={(e) => handleEditChange(e.target.value)}
              className="w-full h-full min-h-[280px] resize-none px-4 py-3 text-sm leading-relaxed font-mono bg-transparent focus:outline-none"
            />
          )}
        </div>
      </div>
    );
  },
);
