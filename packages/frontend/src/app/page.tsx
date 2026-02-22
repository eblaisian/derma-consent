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
} from 'lucide-react';

export default function Home() {
  const t = useTranslations('landing');

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <span className="text-xl font-bold">DermaConsent</span>
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
      <section className="py-20 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6">
            {t('heroBadge')}
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            {t('heroTitle')}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">{t('startTrial')}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">{t('learnMore')}</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            {t('painTitle')}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">{t('pain1Title')}</h3>
                <p className="text-sm text-muted-foreground">{t('pain1Description')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Camera className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">{t('pain2Title')}</h3>
                <p className="text-sm text-muted-foreground">{t('pain2Description')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">{t('pain3Title')}</h3>
                <p className="text-sm text-muted-foreground">{t('pain3Description')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            {t('featuresTitle')}
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            {t('featuresSubtitle')}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <FileCheck className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">{t('feature1Title')}</h3>
                <p className="text-sm text-muted-foreground">{t('feature1Description')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Shield className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">{t('feature2Title')}</h3>
                <p className="text-sm text-muted-foreground">{t('feature2Description')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Camera className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">{t('feature3Title')}</h3>
                <p className="text-sm text-muted-foreground">{t('feature3Description')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <ClipboardList className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">{t('feature4Title')}</h3>
                <p className="text-sm text-muted-foreground">{t('feature4Description')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Globe className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">{t('feature5Title')}</h3>
                <p className="text-sm text-muted-foreground">{t('feature5Description')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <BarChart3 className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">{t('feature6Title')}</h3>
                <p className="text-sm text-muted-foreground">{t('feature6Description')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Highlight */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Lock className="h-12 w-12 mx-auto mb-6 opacity-80" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            {t('securityTitle')}
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            {t('securityDescription')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Badge variant="secondary" className="text-sm px-4 py-1">DSGVO</Badge>
            <Badge variant="secondary" className="text-sm px-4 py-1">AES-256-GCM</Badge>
            <Badge variant="secondary" className="text-sm px-4 py-1">RSA-4096</Badge>
            <Badge variant="secondary" className="text-sm px-4 py-1">{t('zeroKnowledge')}</Badge>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            {t('pricingTitle')}
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            {t('pricingSubtitle')}
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Starter */}
            <Card>
              <CardHeader>
                <CardTitle>{t('starterPlan')}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('starterDescription')}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-bold">{t('starterPrice')}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>{t('starterFeature1')}</li>
                  <li>{t('starterFeature2')}</li>
                  <li>{t('starterFeature3')}</li>
                </ul>
                <Button className="w-full" asChild>
                  <Link href="/register">{t('startTrial')}</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Professional */}
            <Card className="border-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge>{t('popular')}</Badge>
              </div>
              <CardHeader>
                <CardTitle>{t('professionalPlan')}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('professionalDescription')}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-bold">{t('professionalPrice')}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>{t('professionalFeature1')}</li>
                  <li>{t('professionalFeature2')}</li>
                  <li>{t('professionalFeature3')}</li>
                  <li>{t('professionalFeature4')}</li>
                </ul>
                <Button className="w-full" asChild>
                  <Link href="/register">{t('startTrial')}</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card>
              <CardHeader>
                <CardTitle>{t('enterprisePlan')}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('enterpriseDescription')}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-bold">{t('enterprisePrice')}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>{t('enterpriseFeature1')}</li>
                  <li>{t('enterpriseFeature2')}</li>
                  <li>{t('enterpriseFeature3')}</li>
                  <li>{t('enterpriseFeature4')}</li>
                </ul>
                <Button className="w-full" variant="outline" asChild>
                  <a href="mailto:enterprise@dermaconsent.de?subject=Enterprise%20Plan%20Inquiry">
                    {t('contactUs')}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            {t('ctaTitle')}
          </h2>
          <p className="text-muted-foreground mb-8">
            {t('ctaDescription')}
          </p>
          <Button size="lg" asChild>
            <Link href="/register">{t('startTrial')}</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">
              {t('copyright')}
            </span>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="/impressum" className="hover:underline">{t('impressum')}</a>
              <a href="/datenschutz" className="hover:underline">{t('datenschutz')}</a>
              <a href="mailto:kontakt@dermaconsent.de" className="hover:underline">{t('kontakt')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
