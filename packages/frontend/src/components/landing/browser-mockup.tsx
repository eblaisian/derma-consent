import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  User,
  BarChart3,
  Settings,
  FileSignature,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield,
} from 'lucide-react';

export function BrowserMockup() {
  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-[var(--shadow-xl)] overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-3 border-b border-border/40 bg-muted/50 px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-[#FF5F57]" />
          <div className="size-2.5 rounded-full bg-[#FEBC2E]" />
          <div className="size-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 rounded-md bg-background/70 border border-border/30 px-3 py-1 text-[10px] text-muted-foreground font-mono truncate">
          derma-consent.de/dashboard
        </div>
      </div>

      {/* Dashboard content */}
      <div className="pointer-events-none select-none overflow-hidden" aria-hidden="true">
        <div className="flex">
          {/* Mini sidebar */}
          <div className="hidden sm:flex w-48 shrink-0 flex-col border-e border-border/30 bg-muted/20 p-3">
            <div className="flex items-center gap-2 px-2 mb-4">
              <FileSignature className="size-4 text-primary" />
              <span className="text-xs font-semibold">DermaConsent</span>
            </div>
            <div className="space-y-0.5">
              {[
                { icon: LayoutDashboard, label: 'Dashboard', active: true },
                { icon: User, label: 'Patienten', active: false },
                { icon: BarChart3, label: 'Analytik', active: false },
                { icon: Settings, label: 'Einstellungen', active: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] ${
                    item.active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground'
                  }`}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </div>
              ))}
            </div>
            {/* Vault status */}
            <div className="mt-auto pt-3 border-t border-border/30">
              <div className="flex items-center gap-2 px-2">
                <Shield className="size-3 text-success" />
                <span className="text-[10px] text-muted-foreground">Tresor aktiv</span>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 p-4 sm:p-5 min-h-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold">Dashboard</h3>
                <p className="text-[10px] text-muted-foreground">Dermatologie Praxis Dr. Mueller</p>
              </div>
              <div className="rounded-md bg-primary px-2.5 py-1 text-[10px] font-medium text-primary-foreground">
                + Neue Einwilligung
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
              {[
                { label: 'Gesamt', value: '147', sub: 'Einwilligungen' },
                { label: 'Ausstehend', value: '12', sub: 'Offene Links' },
                { label: 'Diesen Monat', value: '34', sub: 'Abgeschlossen' },
                { label: 'Patienten', value: '89', sub: 'Registriert' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-border/40 bg-background p-2.5">
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-semibold tabular-nums leading-tight">{stat.value}</p>
                  <p className="text-[9px] text-muted-foreground">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Consent table */}
            <div className="rounded-lg border border-border/40 overflow-hidden">
              <div className="bg-muted/30 px-3 py-1.5 text-[10px] font-medium text-muted-foreground border-b border-border/30">
                Letzte Einwilligungen
              </div>
              <div className="divide-y divide-border/30">
                {[
                  { name: 'Maria Schmidt', type: 'Botox', status: 'completed', time: 'Vor 2 Std.' },
                  { name: 'Thomas Weber', type: 'Filler', status: 'signed', time: 'Vor 4 Std.' },
                  { name: 'Anna Fischer', type: 'Laser', status: 'pending', time: 'Vor 1 Tag' },
                  { name: 'Klaus Meyer', type: 'Chemical Peel', status: 'pending', time: 'Vor 2 Tagen' },
                ].map((row) => (
                  <div key={row.name} className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <div className="size-6 rounded-full bg-primary-subtle flex items-center justify-center text-[9px] font-medium text-primary">
                        {row.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-[11px] font-medium">{row.name}</p>
                        <p className="text-[9px] text-muted-foreground">{row.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={row.status} />
                      <span className="text-[9px] text-muted-foreground hidden sm:inline">{row.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: typeof CheckCircle; label: string; className: string }> = {
    completed: { icon: CheckCircle, label: 'Abgeschlossen', className: 'bg-success/10 text-success' },
    signed: { icon: Clock, label: 'Unterschrieben', className: 'bg-info/10 text-info' },
    pending: { icon: AlertCircle, label: 'Ausstehend', className: 'bg-warning/10 text-warning' },
  };
  const { icon: Icon, label, className } = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${className}`}>
      <Icon className="size-2.5" />
      {label}
    </span>
  );
}
