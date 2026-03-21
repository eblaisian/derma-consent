'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { company } from '@/lib/company';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Shield,
  FileCheck,
  Stethoscope,
  Send,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

function ContactForm() {
  const t = useTranslations('contact');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      practice: (form.elements.namedItem('practice') as HTMLInputElement).value || undefined,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      form.reset();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mb-6">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <p className="text-lg font-semibold text-foreground mb-2">{t('formSuccess')}</p>
        <p className="text-sm text-muted-foreground">{t('orReply')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">{t('formName')}</Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={100}
          placeholder={t('formNamePlaceholder')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t('formEmail')}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder={t('formEmailPlaceholder')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="practice">{t('formPractice')}</Label>
        <Input
          id="practice"
          name="practice"
          type="text"
          maxLength={200}
          placeholder={t('formPracticePlaceholder')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">{t('formMessage')}</Label>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          placeholder={t('formMessagePlaceholder')}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-destructive">{t('formError')}</p>
      )}

      <Button type="submit" className="w-full" disabled={status === 'submitting'}>
        {status === 'submitting' ? (
          <><Loader2 className="h-4 w-4 me-2 animate-spin" />{t('formSubmitting')}</>
        ) : (
          <><Send className="h-4 w-4 me-2" />{t('formSubmit')}</>
        )}
      </Button>
    </form>
  );
}

export default function ContactPage() {
  const t = useTranslations('contact');

  return (
    <div className="min-h-dvh bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Button variant="ghost" size="sm" className="mb-8" asChild>
          <Link href="/"><ArrowLeft className="h-4 w-4 me-2" />{t('back')}</Link>
        </Button>

        <div className="mb-12">
          <h1 className="font-display text-page-title font-light tracking-tight mb-3">
            {t('title')}
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-xl">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Left — Personal card */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-4">
              <img
                src="https://docs.derma-consent.de/email/headshot.jpg"
                alt={company.responsiblePerson}
                width={64}
                height={64}
                className="rounded-full size-16 object-cover border-2 border-border"
              />
              <div>
                <p className="font-semibold text-foreground">{company.responsiblePerson}</p>
                <p className="text-sm text-muted-foreground">{t('founder')}, {company.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <a
                href={`mailto:${company.email}`}
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4 text-primary shrink-0" />
                {company.email}
              </a>
              <a
                href={`tel:${company.phone}`}
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-4 w-4 text-primary shrink-0" />
                {company.phoneFormatted}
              </a>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                {company.city}
              </div>
              <a
                href={company.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Linkedin className="h-4 w-4 text-primary shrink-0" />
                {t('linkedIn')}
              </a>
            </div>
          </div>

          {/* Right — Contact form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-sm)]">
              <ContactForm />
            </div>
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-16 pt-12 border-t border-border/50">
          <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              {t('trustZeroKnowledge')}
            </div>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <FileCheck className="h-4 w-4 text-primary" />
              {t('trustDsgvo')}
            </div>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Stethoscope className="h-4 w-4 text-primary" />
              {t('trustDerma')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
