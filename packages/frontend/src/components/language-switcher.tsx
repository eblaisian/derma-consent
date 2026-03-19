'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { locales, localeNames, LOCALE_COOKIE, type Locale } from '@/i18n/config';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LanguageSwitcherProps {
  /** Compact mode shows Globe + locale code (e.g. "DE"). Used in tight spaces like the consent form header. */
  compact?: boolean;
}

export function LanguageSwitcher({ compact }: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();

  const handleChange = (newLocale: string) => {
    document.cookie = `${LOCALE_COOKIE}=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    router.refresh();
  };

  if (compact) {
    return (
      <div className="relative inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md border border-input bg-transparent text-xs font-medium text-muted-foreground shadow-xs">
        <Globe className="size-3.5" />
        <select
          value={locale}
          onChange={(e) => handleChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label="Select language"
        >
          {locales.map((loc) => (
            <option key={loc} value={loc}>
              {localeNames[loc as Locale]}
            </option>
          ))}
        </select>
        <span>{locale.toUpperCase()}</span>
        <svg className="size-3 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    );
  }

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {localeNames[loc as Locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
