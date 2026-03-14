'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  FileCheck,
  Camera,
  ClipboardList,
  Globe,
  BarChart3,
  Lock,
  FileText,
  AlertTriangle,
  Check,
  Minus,
  ShieldCheck,
  Building2,
  Users,
  FileSignature,
} from 'lucide-react';

export default function Home() {
  const t = useTranslations('landing');

  const features = [
    { icon: FileCheck, titleKey: 'feature1Title' as const, descKey: 'feature1Description' as const },
    { icon: Shield, titleKey: 'feature2Title' as const, descKey: 'feature2Description' as const },
    { icon: Camera, titleKey: 'feature3Title' as const, descKey: 'feature3Description' as const },
    { icon: ClipboardList, titleKey: 'feature4Title' as const, descKey: 'feature4Description' as const },
    { icon: Globe, titleKey: 'feature5Title' as const, descKey: 'feature5Description' as const },
    { icon: BarChart3, titleKey: 'feature6Title' as const, descKey: 'feature6Description' as const },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-primary" />
              <span className="text-xl font-bold tracking-tight">DermaConsent</span>
            </Link>
            <div className="hidden sm:flex items-center gap-4">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('navFeatures')}
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('navPricing')}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">{t('login')}</Link>
            </Button>
            <Button asChild>
              <Link href="/register">{t('startTrial')}</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.05] via-primary/[0.02] to-transparent" aria-hidden="true" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6 animate-fade-in-up">
            {t('heroBadge')}
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] animate-fade-in-up" style={{ animationDelay: '60ms' }}>
            {t('heroTitle')}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            {t('heroSubtitle')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '180ms' }}>
            <Button size="lg" asChild>
              <Link href="/register">{t('startTrial')}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">{t('learnMore')}</a>
            </Button>
          </div>

          {/* Trust badges — human language */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <Badge variant="outline" className="text-xs px-3 py-1 font-normal text-muted-foreground">{t('trustBadge1')}</Badge>
            <Badge variant="outline" className="text-xs px-3 py-1 font-normal text-muted-foreground">{t('trustBadge2')}</Badge>
            <Badge variant="outline" className="text-xs px-3 py-1 font-normal text-muted-foreground">{t('trustBadge3')}</Badge>
            <Badge variant="outline" className="text-xs px-3 py-1 font-normal text-muted-foreground">{t('trustBadge4')}</Badge>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 tracking-tight">
            {t('painTitle')}
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3 stagger-children">
            {([
              { icon: FileText, titleKey: 'pain1Title' as const, descKey: 'pain1Description' as const },
              { icon: Camera, titleKey: 'pain2Title' as const, descKey: 'pain2Description' as const },
              { icon: AlertTriangle, titleKey: 'pain3Title' as const, descKey: 'pain3Description' as const },
            ]).map((pain) => (
              <div key={pain.titleKey} className="text-center animate-fade-in-up">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/5">
                  <pain.icon className="h-7 w-7 text-primary/70" />
                </div>
                <h3 className="font-semibold mb-2">{t(pain.titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(pain.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Trust Indicators */}
      <section className="py-16 border-y bg-muted/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            {([
              { icon: ShieldCheck, value: t('stat1Value'), label: t('stat1Label') },
              { icon: Building2, value: t('stat2Value'), label: t('stat2Label') },
              { icon: Users, value: t('stat3Value'), label: t('stat3Label') },
            ]).map((stat) => (
              <div key={stat.label} className="space-y-1">
                <stat.icon className="mx-auto h-5 w-5 text-primary mb-2" />
                <p className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              {t('featuresTitle')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t('featuresSubtitle')}
            </p>
          </div>

          <div className="space-y-16 sm:space-y-24">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              const isEven = idx % 2 === 0;
              return (
                <div
                  key={feature.titleKey}
                  className={`flex flex-col gap-8 items-center ${isEven ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}
                >
                  <div className="flex-shrink-0">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/5">
                      <Icon className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <div className={`flex-1 ${isEven ? 'sm:text-start' : 'sm:text-end'} text-center`}>
                    <h3 className="text-lg font-semibold mb-2">{t(feature.titleKey)}</h3>
                    <p className="text-muted-foreground leading-relaxed">{t(feature.descKey)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Product Preview */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              {t('previewTitle')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t('previewSubtitle')}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 stagger-children">
            {([
              { label: 'Dashboard', icon: BarChart3, gradient: 'from-blue-500/20 via-blue-400/10 to-cyan-500/20' },
              { label: 'Consent Form', icon: FileCheck, gradient: 'from-emerald-500/20 via-green-400/10 to-teal-500/20' },
              { label: 'Patient Management', icon: ClipboardList, gradient: 'from-violet-500/20 via-purple-400/10 to-indigo-500/20' },
            ] as const).map((mockup) => {
              const Icon = mockup.icon;
              return (
                <div key={mockup.label} className="animate-fade-in-up">
                  <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
                    <div className="flex items-center gap-1.5 px-3 py-2 border-b bg-muted/50">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
                      <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
                      <span className="ml-2 text-[10px] text-muted-foreground font-mono">dermaconsent.de</span>
                    </div>
                    <div className={`relative h-48 bg-gradient-to-br ${mockup.gradient} flex items-center justify-center`}>
                      <div className="text-center">
                        <Icon className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                        <div className="space-y-1.5 px-6">
                          <div className="h-2 w-32 mx-auto rounded-full bg-foreground/10" />
                          <div className="h-2 w-24 mx-auto rounded-full bg-foreground/8" />
                          <div className="h-2 w-28 mx-auto rounded-full bg-foreground/6" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-center text-sm font-medium text-muted-foreground">{mockup.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/[0.06] to-primary/[0.02] p-8 sm:p-12 text-center">
            <div className="absolute -top-10 -end-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
            <Lock className="h-10 w-10 mx-auto mb-5 text-primary/60" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight">
              {t('securityTitle')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              {t('securityDescription')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge className="text-sm px-4 py-1.5">{t('trustBadge1')}</Badge>
              <Badge className="text-sm px-4 py-1.5">{t('trustBadge2')}</Badge>
              <Badge className="text-sm px-4 py-1.5">{t('trustBadge3')}</Badge>
              <Badge className="text-sm px-4 py-1.5">{t('trustBadge4')}</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              {t('pricingTitle')}
            </h2>
            <p className="text-muted-foreground">
              {t('pricingSubtitle')}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 items-start stagger-children">
            {/* Starter */}
            <Card className="animate-fade-in-up">
              <CardHeader>
                <CardTitle>{t('starterPlan')}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('starterDescription')}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-bold tabular-nums">{t('starterPrice')}</p>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success shrink-0" />{t('starterFeature1')}</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success shrink-0" />{t('starterFeature2')}</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success shrink-0" />{t('starterFeature3')}</li>
                </ul>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/register">{t('startTrial')}</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Professional */}
            <Card className="relative scale-[1.02] shadow-[var(--shadow-xl)] z-10 animate-fade-in-up">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="shadow-[var(--shadow-brand)]">{t('popular')}</Badge>
              </div>
              <CardHeader>
                <CardTitle>{t('professionalPlan')}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('professionalDescription')}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-bold tabular-nums">{t('professionalPrice')}</p>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success shrink-0" />{t('professionalFeature1')}</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success shrink-0" />{t('professionalFeature2')}</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success shrink-0" />{t('professionalFeature3')}</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success shrink-0" />{t('professionalFeature4')}</li>
                </ul>
                <Button className="w-full" asChild>
                  <Link href="/register">{t('startTrial')}</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="animate-fade-in-up">
              <CardHeader>
                <CardTitle>{t('enterprisePlan')}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('enterpriseDescription')}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-bold tabular-nums">{t('enterprisePrice')}</p>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success shrink-0" />{t('enterpriseFeature1')}</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success shrink-0" />{t('enterpriseFeature2')}</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success shrink-0" />{t('enterpriseFeature3')}</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success shrink-0" />{t('enterpriseFeature4')}</li>
                </ul>
                <Button className="w-full" variant="outline" asChild>
                  <a href="mailto:enterprise@dermaconsent.de?subject=Enterprise%20Plan%20Inquiry">
                    {t('contactUs')}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Feature Comparison Table */}
          <div className="mt-16">
            <h3 className="text-lg font-semibold text-center mb-8">{t('comparisonTitle')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-start py-3 px-4 font-medium text-muted-foreground">{t('comparisonFeature')}</th>
                    <th className="text-center py-3 px-4 font-medium">{t('starterPlan')}</th>
                    <th className="text-center py-3 px-4 font-medium text-primary">{t('professionalPlan')}</th>
                    <th className="text-center py-3 px-4 font-medium">{t('enterprisePlan')}</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    { key: 'compUsers', starter: t('starterFeature1'), pro: t('professionalFeature1'), enterprise: t('professionalFeature1') },
                    { key: 'compConsents', starter: t('starterFeature2'), pro: t('professionalFeature2'), enterprise: t('professionalFeature2') },
                    { key: 'compEncryption', starter: true, pro: true, enterprise: true },
                    { key: 'compAnalytics', starter: false, pro: true, enterprise: true },
                    { key: 'compSupport', starter: false, pro: true, enterprise: true },
                    { key: 'compSLA', starter: false, pro: false, enterprise: true },
                    { key: 'compDedicated', starter: false, pro: false, enterprise: true },
                  ] as const).map((row) => (
                    <tr key={row.key} className="border-b last:border-0">
                      <td className="py-3 px-4 text-muted-foreground">{t(row.key)}</td>
                      <td className="text-center py-3 px-4">
                        {typeof row.starter === 'boolean' ? (
                          row.starter ? <Check className="h-4 w-4 text-success mx-auto" /> : <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">{row.starter}</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-4 bg-primary/[0.02]">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? <Check className="h-4 w-4 text-success mx-auto" /> : <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        ) : (
                          <span className="font-medium">{row.pro}</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        {typeof row.enterprise === 'boolean' ? (
                          row.enterprise ? <Check className="h-4 w-4 text-success mx-auto" /> : <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">{row.enterprise}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight">
              {t('ctaTitle')}
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto leading-relaxed">
              {t('ctaDescription')}
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">{t('startTrial')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <span className="font-semibold text-sm">DermaConsent</span>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {t('copyright')}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('footerLegal')}</span>
              <div className="mt-3 flex flex-col gap-2">
                <a href="/impressum" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('impressum')}</a>
                <a href="/datenschutz" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('datenschutz')}</a>
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('footerContact')}</span>
              <div className="mt-3 flex flex-col gap-2">
                <a href="mailto:kontakt@dermaconsent.de" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('kontakt')}</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
