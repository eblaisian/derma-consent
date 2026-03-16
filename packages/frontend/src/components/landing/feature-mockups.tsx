import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Clock,
  FileSignature,
  Globe,
  Brain,
  Sparkles,
  MessageSquareText,
  Volume2,
  PenLine,
  AlertCircle,
  Send,
  User,
  Camera,
  BarChart3,
  Lock,
  Search,
} from 'lucide-react';

/** Consent form preview — shows what a patient sees */
export function ConsentFormMockup() {
  return (
    <div className="rounded-lg border border-border/40 bg-background overflow-hidden pointer-events-none select-none" aria-hidden="true">
      {/* Form header */}
      <div className="border-b border-border/30 bg-muted/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSignature className="size-3.5 text-primary" />
            <span className="text-[11px] font-semibold">Einwilligung — Botox</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="size-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Deutsch</span>
          </div>
        </div>
      </div>

      {/* Form fields */}
      <div className="p-4 space-y-3">
        <div>
          <label className="text-[10px] text-muted-foreground font-medium">Vollständiger Name</label>
          <div className="mt-0.5 h-7 rounded-md border border-border/40 bg-muted/20 px-2 flex items-center text-[11px]">
            Maria Schmidt
          </div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-medium">Geburtsdatum</label>
          <div className="mt-0.5 h-7 rounded-md border border-border/40 bg-muted/20 px-2 flex items-center text-[11px]">
            15.03.1985
          </div>
        </div>

        {/* Treatment checkboxes */}
        <div>
          <label className="text-[10px] text-muted-foreground font-medium">Behandlungsbereiche</label>
          <div className="mt-1 space-y-1.5">
            {['Stirn (Zornesfalte)', 'Krähenfüße', 'Stirnfalten'].map((area, i) => (
              <div key={area} className="flex items-center gap-2">
                <div className={`size-3.5 rounded border ${i < 2 ? 'bg-primary border-primary' : 'border-border/60'} flex items-center justify-center`}>
                  {i < 2 && <CheckCircle className="size-2.5 text-primary-foreground" />}
                </div>
                <span className="text-[10px]">{area}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Signature area */}
        <div className="pt-1">
          <label className="text-[10px] text-muted-foreground font-medium">Unterschrift</label>
          <div className="mt-1 h-14 rounded-md border border-dashed border-border/60 bg-muted/10 flex items-center justify-center">
            <PenLine className="size-4 text-muted-foreground/40" />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-1">
          <div className="rounded-md bg-primary px-3 py-1.5 text-[10px] font-medium text-primary-foreground flex items-center gap-1.5">
            <Send className="size-3" />
            Einwilligung abgeben
          </div>
        </div>
      </div>
    </div>
  );
}

/** AI Insights mockup — shows analytics + AI-generated insight */
export function AiInsightsMockup() {
  return (
    <div className="rounded-lg border border-border/40 bg-background overflow-hidden pointer-events-none select-none" aria-hidden="true">
      {/* Header */}
      <div className="border-b border-border/30 bg-muted/30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="size-3.5 text-primary" />
          <span className="text-[11px] font-semibold">KI-Einblicke</span>
        </div>
        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-normal">
          <Sparkles className="size-2.5 me-1" />
          AI
        </Badge>
      </div>

      {/* Mini chart */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-end gap-1 h-16">
          {[35, 42, 38, 55, 48, 62, 58, 71, 65, 78, 72, 85].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm bg-primary/20" style={{ height: `${h}%` }}>
              {i === 11 && <div className="h-full rounded-sm bg-primary" />}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-muted-foreground">Jan</span>
          <span className="text-[9px] text-muted-foreground">Dez</span>
        </div>
      </div>

      {/* AI insight card */}
      <div className="mx-4 mb-4 rounded-lg bg-primary/[0.04] border border-primary/10 p-3">
        <div className="flex items-start gap-2">
          <Sparkles className="size-3 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-medium text-foreground">Konversionsrate steigt um 23%</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Botox-Einwilligungen haben die höchste Abschlussrate. Erwägen Sie, Filler-Formulare zu optimieren.</p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-4 pb-4 grid grid-cols-3 gap-2">
        {[
          { label: 'Konversion', value: '87%', trend: '+12%' },
          { label: 'Ø Ausfüllzeit', value: '3.2m', trend: '-18%' },
          { label: 'NPS', value: '92', trend: '+5' },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-sm font-semibold tabular-nums">{stat.value}</p>
            <p className="text-[9px] text-success font-medium">{stat.trend}</p>
            <p className="text-[9px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Consent Explainer mockup — shows AI explaining a form to a patient */
export function ConsentExplainerMockup() {
  return (
    <div className="rounded-lg border border-border/40 bg-background overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <div className="border-b border-border/30 bg-muted/30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquareText className="size-3.5 text-primary" />
          <span className="text-[11px] font-semibold">Einwilligungs-Erklärer</span>
        </div>
        <button className="flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-[9px] text-muted-foreground">
          <Volume2 className="size-3" />
          Vorlesen
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Language selector */}
        <div className="flex gap-1.5">
          {['DE', 'EN', 'TR', 'AR'].map((lang, i) => (
            <span
              key={lang}
              className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground'
              }`}
            >
              {lang}
            </span>
          ))}
        </div>

        {/* AI explanation */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Sparkles className="size-3 text-primary mt-0.5 shrink-0" />
            <p className="text-[10px] leading-relaxed text-foreground">
              <span className="font-medium">Botox-Behandlung</span> — Bei dieser Behandlung wird Botulinumtoxin in bestimmte Gesichtsmuskeln injiziert, um Falten zu glätten.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="size-3 text-warning mt-0.5 shrink-0" />
            <p className="text-[10px] leading-relaxed text-foreground">
              <span className="font-medium">Mögliche Risiken:</span> Vorübergehende Rötung, leichte Schwellung, selten Kopfschmerzen.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="size-3 text-info mt-0.5 shrink-0" />
            <p className="text-[10px] leading-relaxed text-foreground">
              <span className="font-medium">Erholungszeit:</span> Kein Ausfallzeit. Ergebnisse sichtbar nach 3–7 Tagen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Consent Lifecycle mockup — shows the flow from pending to completed */
export function ConsentLifecycleMockup() {
  const steps = [
    { label: 'Link erstellt', status: 'done' },
    { label: 'Formular ausgefüllt', status: 'done' },
    { label: 'Unterschrieben', status: 'done' },
    { label: 'Abgeschlossen', status: 'current' },
  ];

  return (
    <div className="rounded-lg border border-border/40 bg-background overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <div className="border-b border-border/30 bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileSignature className="size-3.5 text-primary" />
          <span className="text-[11px] font-semibold">Einwilligungs-Lebenszyklus</span>
        </div>
      </div>

      <div className="p-4">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className={`flex size-6 items-center justify-center rounded-full text-[9px] font-bold ${
                step.status === 'done' ? 'bg-success text-white' :
                step.status === 'current' ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              }`}>
                {step.status === 'done' ? <CheckCircle className="size-3.5" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-6 sm:w-10 mx-1 ${
                  step.status === 'done' ? 'bg-success' : 'bg-border'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Labels */}
        <div className="flex justify-between">
          {steps.map((step) => (
            <span key={step.label} className="text-[9px] text-muted-foreground text-center max-w-[60px]">
              {step.label}
            </span>
          ))}
        </div>

        {/* Current consent info */}
        <div className="mt-4 rounded-md bg-muted/30 p-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium">Maria Schmidt — Botox</p>
            <p className="text-[9px] text-muted-foreground">Letzte Aktualisierung: vor 2 Minuten</p>
          </div>
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-success/10 text-success border-0 font-medium">
            Abgeschlossen
          </Badge>
        </div>
      </div>
    </div>
  );
}

/** Patient Management mockup — shows encrypted patient list */
export function PatientListMockup() {
  const patients = [
    { name: 'Maria Schmidt', dob: '15.03.1985', consents: 3, lastVisit: '12.03.2026', locked: true },
    { name: 'Thomas Weber', dob: '22.07.1978', consents: 1, lastVisit: '10.03.2026', locked: true },
    { name: 'Anna Fischer', dob: '08.11.1992', consents: 2, lastVisit: '08.03.2026', locked: false },
    { name: 'Klaus Meyer', dob: '30.01.1965', consents: 5, lastVisit: '05.03.2026', locked: true },
  ];

  return (
    <div className="rounded-lg border border-border/40 bg-background overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <div className="border-b border-border/30 bg-muted/30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="size-3.5 text-primary" />
          <span className="text-[11px] font-semibold">Patienten</span>
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-normal">89</Badge>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border/40 bg-background px-2 py-1 text-[10px] text-muted-foreground">
          <Search className="size-3" />
          Suchen...
        </div>
      </div>

      <div className="divide-y divide-border/30">
        {patients.map((p) => (
          <div key={p.name} className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div className="size-7 rounded-full bg-primary-subtle flex items-center justify-center text-[10px] font-medium text-primary">
                {p.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] font-medium">{p.name}</p>
                  {p.locked && <Lock className="size-2.5 text-success" />}
                </div>
                <p className="text-[9px] text-muted-foreground">{p.dob}</p>
              </div>
            </div>
            <div className="text-end">
              <p className="text-[10px] font-medium tabular-nums">{p.consents} Einwilligungen</p>
              <p className="text-[9px] text-muted-foreground">{p.lastVisit}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Analytics mockup — shows consent performance metrics */
export function AnalyticsMockup() {
  return (
    <div className="rounded-lg border border-border/40 bg-background overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <div className="border-b border-border/30 bg-muted/30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-3.5 text-primary" />
          <span className="text-[11px] font-semibold">Analytik</span>
        </div>
        <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">30 Tage</span>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Einwilligungen', value: '147', change: '+23%' },
            { label: 'Konversion', value: '87%', change: '+12%' },
            { label: 'Ø Ausfüllzeit', value: '3.2 min', change: '-18%' },
          ].map((s) => (
            <div key={s.label} className="rounded-md border border-border/30 p-2.5">
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
              <p className="text-base font-semibold tabular-nums leading-tight">{s.value}</p>
              <p className="text-[9px] text-success font-medium">{s.change}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-medium text-muted-foreground">Nach Behandlungstyp</p>
          {[
            { name: 'Botox', pct: 42, count: 62 },
            { name: 'Filler', pct: 28, count: 41 },
            { name: 'Laser', pct: 15, count: 22 },
            { name: 'Microneedling', pct: 10, count: 15 },
            { name: 'Andere', pct: 5, count: 7 },
          ].map((t) => (
            <div key={t.name} className="flex items-center gap-2">
              <span className="text-[10px] w-20 shrink-0">{t.name}</span>
              <div className="flex-1 h-2 rounded-full bg-muted/60 overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${t.pct}%` }} />
              </div>
              <span className="text-[9px] text-muted-foreground tabular-nums w-6 text-end">{t.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Photo management mockup — shows encrypted before/after */
export function PhotoMockup() {
  return (
    <div className="rounded-lg border border-border/40 bg-background overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <div className="border-b border-border/30 bg-muted/30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="size-3.5 text-primary" />
          <span className="text-[11px] font-semibold">Fotos — Botox</span>
        </div>
        <div className="flex items-center gap-1">
          <Lock className="size-3 text-success" />
          <span className="text-[9px] text-success font-medium">Verschlüsselt</span>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[9px] text-muted-foreground font-medium mb-1.5">Vorher</p>
            <div className="aspect-[4/3] rounded-md bg-muted/40 border border-border/30 flex items-center justify-center">
              <div className="text-center">
                <Camera className="size-5 text-muted-foreground/30 mx-auto mb-1" />
                <div className="space-y-1 px-3">
                  <div className="h-1 w-12 mx-auto rounded-full bg-foreground/5" />
                  <div className="h-1 w-8 mx-auto rounded-full bg-foreground/5" />
                </div>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">12.01.2026 · Stirnregion</p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground font-medium mb-1.5">Nachher</p>
            <div className="aspect-[4/3] rounded-md bg-muted/40 border border-border/30 flex items-center justify-center">
              <div className="text-center">
                <Camera className="size-5 text-muted-foreground/30 mx-auto mb-1" />
                <div className="space-y-1 px-3">
                  <div className="h-1 w-12 mx-auto rounded-full bg-foreground/5" />
                  <div className="h-1 w-8 mx-auto rounded-full bg-foreground/5" />
                </div>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">12.03.2026 · Stirnregion</p>
          </div>
        </div>
      </div>
    </div>
  );
}
