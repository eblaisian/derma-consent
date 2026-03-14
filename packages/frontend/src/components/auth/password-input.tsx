'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends Omit<React.ComponentProps<typeof Input>, 'type'> {
  id: string;
}

export function PasswordInput({ id, ...props }: PasswordInputProps) {
  const t = useTranslations('login');
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        className="pe-10"
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute end-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? t('hidePassword') : t('showPassword')}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
}
