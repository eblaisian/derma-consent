'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  FileCheck,
  Camera,
  ClipboardList,
  Globe,
  BarChart3,
  Lock,
  Check,
  ShieldCheck,
  FileSignature,
  Zap,
  ChevronDown,
  Languages,
  ArrowRight,
  Syringe,
  ScanFace,
  Menu,
  X,
  Brain,
  MessageSquareText,
  Stethoscope,
  TrendingUp,
} from 'lucide-react';
import { locales, localeNames, LOCALE_COOKIE, type Locale } from '@/i18n/config';
import { PRICING } from '@/lib/pricing';
import { BrowserMockup } from '@/components/landing/browser-mockup';
import { ConsentFormMockup, AiInsightsMockup, ConsentExplainerMockup, ConsentLifecycleMockup, PatientListMockup, AnalyticsMockup, PhotoMockup } from '@/components/landing/feature-mockups';
import { useCallback, useEffect, useState, useRef } from 'react';

const TREATMENTS = ['Botox', 'Filler', 'Laser', 'Chemical Peel', 'Microneedling', 'PRP'] as const;

function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const setLocale = useCallback((locale: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000`;
    setOpen(false);
    window.location.reload();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select language"
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Languages className="h-4 w-4" />
        <ChevronDown className={`h-3 w-3 ms-0.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            role="listbox"
            aria-label="Languages"
            className="absolute end-0 top-full mt-2 z-50 min-w-[160px] rounded-xl border bg-popover p-1 shadow-[var(--shadow-lg)] animate-fade-in-up"
          >
            {locales.map((locale) => (
              <button
                key={locale}
                role="option"
                aria-selected={false}
                onClick={() => setLocale(locale)}
                className="w-full text-start px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
              >
                {localeNames[locale]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MobileMenu({ t }: { t: (key: 'navFeatures' | 'navPricing' | 'navSecurity' | 'kontakt') => string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-background/60" aria-hidden="true" onClick={() => setOpen(false)} />
          <nav className="absolute start-0 end-0 top-full z-50 border-b bg-background p-4 shadow-[var(--shadow-lg)] animate-slide-in-down">
            <div className="flex flex-col gap-1">
              <a href="#features" onClick={() => setOpen(false)} className="px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-accent transition-colors">
                {t('navFeatures')}
              </a>
              <a href="#pricing" onClick={() => setOpen(false)} className="px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-accent transition-colors">
                {t('navPricing')}
              </a>
              <a href="#security" onClick={() => setOpen(false)} className="px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-accent transition-colors">
                {t('navSecurity')}
              </a>
              <Link href="/contact" onClick={() => setOpen(false)} className="px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-accent transition-colors">
                {t('kontakt')}
              </Link>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}

export default function Home() {
  const t = useTranslations('landing');

  return (
    <div className="min-h-dvh">
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:start-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      {/* ─── Navigation ─── */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <FileSignature className="h-4 w-4" />
              </div>
              <span className="text-lg font-semibold tracking-tight">DermaConsent</span>
            </Link>
            <div className="hidden sm:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('navFeatures')}
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('navPricing')}
              </a>
              <a href="#security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('navSecurity')}
              </a>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('kontakt')}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MobileMenu t={t} />
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link href="/login">{t('login')}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">{t('startTrial')}</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main id="main-content">
        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-28">
          {/* Atmospheric gradient */}
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-primary/[0.04] blur-3xl" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-3xl" />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="animate-fade-in-up">
              <Badge variant="outline" className="mb-8 px-4 py-1.5 text-xs font-medium border-primary/20 text-primary">
                <ShieldCheck className="h-3 w-3 me-1.5" />
                {t('heroBadge')}
              </Badge>
            </div>

            <h1
              className="font-display font-light tracking-tight text-foreground leading-[1.08] animate-fade-in-up text-display-hero text-balance"
              style={{ animationDelay: '60ms' }}
            >
              {t('heroTitle')}
            </h1>

            <p
              className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty animate-fade-in-up"
              style={{ animationDelay: '120ms' }}
            >
              {t('heroSubtitle')}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '180ms' }}>
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <Link href="/register">
                  {t('startTrial')}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <a href="#features">{t('learnMore')}</a>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              {[
                { icon: ShieldCheck, label: t('trustDsgvo'), id: 'dsgvo' },
                { icon: Lock, label: t('trustEncryption'), id: 'enc' },
                { icon: Globe, label: t('trustLanguages'), id: 'lang' },
                { icon: Syringe, label: t('trustTreatments'), id: 'treat' },
              ].map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="h-4 w-4 text-primary/60" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Product Preview ─── */}
        <section className="pb-20 sm:pb-28">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:[perspective:1200px]">
              <div className="md:[transform:rotateX(2deg)] md:[transform-origin:top_center] animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <BrowserMockup />
              </div>
            </div>
            <div className="relative -mt-16 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" aria-hidden="true" />
          </div>
        </section>

        {/* ─── Stats Bar ─── */}
        <section className="border-y border-border/50 bg-muted/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
              {[
                { value: 'AES-256', label: t('statEncryption'), id: 'enc' },
                { value: '8', label: t('statLanguages'), id: 'lang' },
                { value: '6', label: t('statTreatments'), id: 'treat' },
                { value: '< 2 min', label: t('statSetup'), id: 'setup' },
              ].map((stat) => (
                <div key={stat.id}>
                  <p className="text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight text-foreground">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Problem → Solution ─── */}
        <section className="py-24 sm:py-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-display font-light tracking-tight text-foreground text-display-section text-balance">
                {t('problemTitle')}
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">{t('problemSubtitle')}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 stagger-children">
              {[
                { icon: ClipboardList, title: t('problem1Title'), desc: t('problem1Desc'), solution: t('problem1Solution'), id: 'paper' },
                { icon: Camera, title: t('problem2Title'), desc: t('problem2Desc'), solution: t('problem2Solution'), id: 'photos' },
                { icon: Shield, title: t('problem3Title'), desc: t('problem3Desc'), solution: t('problem3Solution'), id: 'gdpr' },
              ].map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-2xl border border-border/50 bg-card p-8 transition-all hover:shadow-[var(--shadow-lg)] hover:border-border animate-fade-in-up"
                >
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/[0.06]">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  <div className="mt-4 flex items-start gap-2">
                    <Zap className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <p className="text-sm font-medium text-success">{item.solution}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Features ─── */}
        <section id="features" className="py-24 sm:py-32 bg-muted/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <Badge variant="outline" className="mb-4 px-3 py-1 text-xs font-medium">
                {t('featuresLabel')}
              </Badge>
              <h2 className="font-display font-light tracking-tight text-foreground text-display-section text-balance">
                {t('featuresTitle')}
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">{t('featuresSubtitle')}</p>
            </div>

            {/* Primary features — large cards with mockups */}
            <div className="grid gap-8 lg:grid-cols-2 mb-16">
              {/* Digital Consent Forms — with form preview */}
              <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all hover:shadow-[var(--shadow-lg)] hover:border-border">
                <div className="p-8 sm:p-10 pb-0 sm:pb-0">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/[0.06]">
                    <FileCheck className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold tracking-tight">{t('feature1Title')}</h3>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{t('feature1Desc')}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {TREATMENTS.map((treatment) => (
                      <Badge key={treatment} variant="secondary" className="text-xs font-normal">
                        {treatment}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="px-6 sm:px-8 pt-6 pb-0">
                  <div className="relative">
                    <ConsentFormMockup />
                    <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-card to-transparent" />
                  </div>
                </div>
              </div>

              {/* Zero-Knowledge Encryption — with lifecycle */}
              <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all hover:shadow-[var(--shadow-lg)] hover:border-border">
                <div className="p-8 sm:p-10 pb-0 sm:pb-0">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/[0.06]">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold tracking-tight">{t('feature2Title')}</h3>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{t('feature2Desc')}</p>
                </div>
                <div className="px-6 sm:px-8 pt-6 space-y-4 pb-6">
                  <div className="rounded-lg bg-muted/60 p-4 font-mono text-xs text-muted-foreground" aria-hidden="true">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="size-2 rounded-full bg-success" />
                      <span className="text-success font-medium">{t('encryptedLabel')}</span>
                    </div>
                    <div className="space-y-1 opacity-60">
                      <div>patient_name: &quot;••••••••••••••&quot;</div>
                      <div>date_of_birth: &quot;••••••••••&quot;</div>
                      <div>treatment_data: &quot;••••••••••••••••••••&quot;</div>
                    </div>
                  </div>
                  <ConsentLifecycleMockup />
                </div>
              </div>
            </div>

            {/* Secondary features — with mockups */}
            <div className="grid gap-8 lg:grid-cols-2 mb-8">
              {/* Encrypted Photos */}
              <div className="rounded-2xl border border-border/50 bg-card overflow-hidden transition-all hover:shadow-[var(--shadow-lg)] hover:border-border">
                <div className="p-8 pb-0">
                  <Camera className="h-5 w-5 text-primary mb-4" />
                  <h3 className="text-base font-semibold mb-2">{t('feature3Title')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t('feature3Desc')}</p>
                </div>
                <div className="px-6 pt-5 pb-0">
                  <div className="relative">
                    <PhotoMockup />
                    <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-card to-transparent" />
                  </div>
                </div>
              </div>

              {/* Patient Management */}
              <div className="rounded-2xl border border-border/50 bg-card overflow-hidden transition-all hover:shadow-[var(--shadow-lg)] hover:border-border">
                <div className="p-8 pb-0">
                  <ScanFace className="h-5 w-5 text-primary mb-4" />
                  <h3 className="text-base font-semibold mb-2">{t('feature4Title')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t('feature4Desc')}</p>
                </div>
                <div className="px-6 pt-5 pb-0">
                  <div className="relative">
                    <PatientListMockup />
                    <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-card to-transparent" />
                  </div>
                </div>
              </div>
            </div>

            {/* Remaining features — small cards */}
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                { icon: Globe, title: t('feature5Title'), desc: t('feature5Desc'), id: 'i18n' },
                { icon: BarChart3, title: t('feature6Title'), desc: t('feature6Desc'), id: 'analytics' },
              ].map((feature) => (
                <div
                  key={feature.id}
                  className="rounded-xl border border-border/50 bg-card p-6 transition-all hover:shadow-[var(--shadow-md)] hover:border-border"
                >
                  <feature.icon className="h-5 w-5 text-primary mb-4" />
                  <h3 className="text-sm font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── AI-Powered ─── */}
        <section className="py-24 sm:py-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 px-3 py-1 text-xs font-medium border-primary/20 text-primary">
                <Brain className="h-3 w-3 me-1.5" />
                {t('aiLabel')}
              </Badge>
              <h2 className="font-display font-light tracking-tight text-foreground text-display-section text-balance">
                {t('aiTitle')}
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">{t('aiSubtitle')}</p>
            </div>

            {/* AI feature cards with mockups */}
            <div className="grid gap-8 lg:grid-cols-2 mb-12">
              {/* Consent Explainer — with mockup */}
              <div className="rounded-2xl border border-border/50 bg-card overflow-hidden transition-all hover:shadow-[var(--shadow-lg)] hover:border-border">
                <div className="p-8 pb-0">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/[0.06] mb-4">
                    <MessageSquareText className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{t('ai1Title')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t('ai1Desc')}</p>
                </div>
                <div className="px-6 pt-5 pb-0">
                  <div className="relative">
                    <ConsentExplainerMockup />
                    <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-card to-transparent" />
                  </div>
                </div>
              </div>

              {/* Practice Insights — with mockup */}
              <div className="rounded-2xl border border-border/50 bg-card overflow-hidden transition-all hover:shadow-[var(--shadow-lg)] hover:border-border">
                <div className="p-8 pb-0">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/[0.06] mb-4">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{t('ai2Title')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t('ai2Desc')}</p>
                </div>
                <div className="px-6 pt-5 pb-0">
                  <div className="relative">
                    <AiInsightsMockup />
                    <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-card to-transparent" />
                  </div>
                </div>
              </div>
            </div>

            {/* Remaining AI features — small cards */}
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                { icon: Stethoscope, title: t('ai3Title'), desc: t('ai3Desc'), id: 'aftercare' },
                { icon: Brain, title: t('ai4Title'), desc: t('ai4Desc'), id: 'comms' },
              ].map((feature) => (
                <div
                  key={feature.id}
                  className="rounded-xl border border-border/50 bg-card p-6 transition-all hover:shadow-[var(--shadow-md)] hover:border-border animate-fade-in-up"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/[0.06] mb-4">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Security ─── */}
        <section id="security" className="py-24 sm:py-32 relative overflow-hidden">
          {/* Atmospheric gradient */}
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-3xl" />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/[0.06] mb-8">
              <Shield className="h-8 w-8 text-primary" />
            </div>

            <h2 className="font-display font-light tracking-tight text-foreground text-display-section text-balance">
              {t('securityTitle')}
            </h2>
            <p className="mt-6 text-muted-foreground max-w-2xl mx-auto leading-relaxed text-lg text-pretty">
              {t('securityDesc')}
            </p>

            <div className="mt-12 grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
              {[
                { title: t('securityFeature1Title'), desc: t('securityFeature1Desc'), id: 'client' },
                { title: t('securityFeature2Title'), desc: t('securityFeature2Desc'), id: 'zk' },
                { title: t('securityFeature3Title'), desc: t('securityFeature3Desc'), id: 'dsgvo' },
              ].map((item) => (
                <div key={item.id} className="rounded-xl border border-border/50 bg-card p-6 text-start">
                  <h3 className="text-sm font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Pricing ─── */}
        <section id="pricing" className="py-24 sm:py-32 bg-muted/20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-display font-light tracking-tight text-foreground text-display-section text-balance">
                {t('pricingTitle')}
              </h2>
              <p className="mt-4 text-muted-foreground">{t('pricingSubtitle')}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 items-start">
              {/* Starter */}
              <div className="rounded-2xl border border-border/50 bg-card p-8 transition-all hover:shadow-[var(--shadow-lg)] hover:border-border">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold">{t('starterPlan')}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t('starterDesc')}</p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-semibold tabular-nums tracking-tight">€{PRICING.starter.monthly}</span>
                  <span className="text-muted-foreground ms-1">/ {t('month')}</span>
                </div>
                <Button className="w-full mb-8" variant="outline" asChild>
                  <Link href="/register">{t('startTrial')}</Link>
                </Button>
                <ul className="space-y-3 text-sm">
                  {(['starterF1', 'starterF2', 'starterF3', 'starterF4', 'starterF5'] as const).map((key) => (
                    <li key={key} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{t(key)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Professional — highlighted */}
              <div className="relative rounded-2xl border-2 border-primary bg-card p-8 shadow-[var(--shadow-brand)]">
                <div className="absolute -top-3.5 start-1/2 -translate-x-1/2">
                  <Badge className="shadow-[var(--shadow-brand)] px-4 py-1">{t('popular')}</Badge>
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold">{t('professionalPlan')}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t('professionalDesc')}</p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-semibold tabular-nums tracking-tight">€{PRICING.professional.monthly}</span>
                  <span className="text-muted-foreground ms-1">/ {t('month')}</span>
                </div>
                <Button className="w-full mb-8" asChild>
                  <Link href="/register">{t('startTrial')}</Link>
                </Button>
                <ul className="space-y-3 text-sm">
                  {(['proF1', 'proF2', 'proF3', 'proF4', 'proF5', 'proF6'] as const).map((key) => (
                    <li key={key} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{t(key)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Enterprise */}
              <div className="rounded-2xl border border-border/50 bg-card p-8 transition-all hover:shadow-[var(--shadow-lg)] hover:border-border">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold">{t('enterprisePlan')}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t('enterpriseDesc')}</p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-semibold tracking-tight">{t('enterprisePrice')}</span>
                </div>
                <Button className="w-full mb-8" variant="outline" asChild>
                  <Link href="/contact">
                    {t('contactUs')}
                  </Link>
                </Button>
                <ul className="space-y-3 text-sm">
                  {(['entF1', 'entF2', 'entF3', 'entF4', 'entF5'] as const).map((key) => (
                    <li key={key} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{t(key)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              {t('pricingNote')}
            </p>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="py-24 sm:py-32">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-primary px-8 sm:px-16 py-16 sm:py-20 text-center text-primary-foreground">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" aria-hidden="true" />
              <div className="relative">
                <h2 className="font-display font-light tracking-tight leading-tight text-display-cta text-balance">
                  {t('ctaTitle')}
                </h2>
                <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto leading-relaxed text-pretty">
                  {t('ctaDesc')}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button size="lg" variant="secondary" className="h-12 px-8 text-base" asChild>
                    <Link href="/register">
                      {t('startTrial')}
                      <ArrowRight className="ms-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                    <Link href="/contact">
                      {t('kontakt')}
                    </Link>
                  </Button>
                </div>
                <p className="mt-6 text-sm text-primary-foreground/60">{t('ctaNote')}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/50 py-16 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-10">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <FileSignature className="h-3.5 w-3.5" />
                </div>
                <span className="font-semibold">DermaConsent</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                {t('footerDesc')}
              </p>
              <p className="mt-6 text-xs text-muted-foreground">
                {t('copyright')}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('footerProduct')}</span>
              <div className="mt-4 flex flex-col gap-3">
                <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('navFeatures')}</a>
                <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('navPricing')}</a>
                <a href="#security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('navSecurity')}</a>
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('footerLegal')}</span>
              <div className="mt-4 flex flex-col gap-3">
                <Link href="/impressum" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('impressum')}</Link>
                <Link href="/datenschutz" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('datenschutz')}</Link>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('kontakt')}</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
