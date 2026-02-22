'use client';

import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor } from 'lucide-react';

const themeOrder = ['system', 'light', 'dark'] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    const idx = themeOrder.indexOf(theme);
    setTheme(themeOrder[(idx + 1) % themeOrder.length]);
  };

  return (
    <Button variant="ghost" size="icon-sm" onClick={cycle} title={`Theme: ${theme}`}>
      {theme === 'system' && <Monitor className="h-4 w-4" />}
      {theme === 'light' && <Sun className="h-4 w-4" />}
      {theme === 'dark' && <Moon className="h-4 w-4" />}
    </Button>
  );
}
