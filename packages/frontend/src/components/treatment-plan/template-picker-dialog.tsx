'use client';

import { useTranslations } from 'next-intl';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TreatmentTemplateSummary } from '@/lib/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: TreatmentTemplateSummary[];
  onSelect: (template: TreatmentTemplateSummary) => void;
}

export function TemplatePickerDialog({ open, onOpenChange, templates, onSelect }: Props) {
  const t = useTranslations('treatmentTemplate');
  const tTypes = useTranslations('consentTypes');
  const tRegions = useTranslations('bodyRegions');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('pickTemplate')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('noTemplates')}
            </p>
          ) : (
            templates.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                className="w-full text-left border rounded-md p-3 hover:bg-muted/50 transition-colors"
                onClick={() => {
                  onSelect(tmpl);
                  onOpenChange(false);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{tmpl.name}</span>
                  <Badge variant="outline">{tTypes(tmpl.type as keyof IntlMessages['consentTypes'])}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {tRegions(tmpl.bodyRegion as keyof IntlMessages['bodyRegions'])} &middot; {tmpl.templateData.points?.length ?? 0} {t('points')}
                </p>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
