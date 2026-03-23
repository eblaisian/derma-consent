'use client';

import { Eye, AlertTriangle } from 'lucide-react';

interface PreviewPanelProps {
  recipientName: string | null;
  recipientEmail: string | null;
  subject: string | null;
  html: string | null;
  hasUnresolved: boolean;
}

export function PreviewPanel({ recipientName, recipientEmail, subject, html, hasUnresolved }: PreviewPanelProps) {
  const hasContent = recipientName && html;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-teal-600" />
          <span className="text-sm font-semibold">Preview</span>
        </div>
        {hasContent && (
          <span className="text-xs text-muted-foreground truncate ml-2">
            {recipientName} &middot; {recipientEmail}
          </span>
        )}
      </div>

      {hasContent ? (
        <div className="flex flex-col flex-1 min-h-0 gap-2">
          <div className="rounded-md bg-zinc-50 px-3 py-2 text-xs dark:bg-zinc-900 shrink-0">
            <span className="text-muted-foreground">Subject: </span>
            <span className="font-medium">{subject}</span>
          </div>

          {hasUnresolved && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300 shrink-0">
              <AlertTriangle className="size-4 shrink-0" />
              Unresolved {'{{variables}}'} — do not send
            </div>
          )}

          <div className="flex-1 min-h-0 rounded-lg border bg-white overflow-hidden">
            <iframe
              srcDoc={html}
              sandbox="allow-same-origin"
              title="Email preview"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground">
          <Eye className="size-10 mb-3 opacity-20" />
          <p className="text-sm font-medium">No recipient selected</p>
          <p className="text-xs mt-1">Click a recipient on the left to preview their email</p>
        </div>
      )}
    </div>
  );
}
