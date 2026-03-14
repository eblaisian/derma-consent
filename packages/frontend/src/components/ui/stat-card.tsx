import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
  icon?: React.ReactNode;
  accent?: 'primary' | 'warning' | 'success' | 'info';
  className?: string;
}

const accentStyles = {
  primary: 'border-l-primary/60',
  warning: 'border-l-warning/60',
  success: 'border-l-success/60',
  info: 'border-l-info/60',
};

const iconBgStyles = {
  primary: 'bg-primary/10 text-primary',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
};

export function StatCard({ title, value, subtitle, trend, icon, accent, className }: StatCardProps) {
  return (
    <Card className={cn(
      'relative overflow-hidden animate-fade-in-up transition-shadow hover:shadow-sm',
      accent && `border-l-[3px] ${accentStyles[accent]}`,
      className,
    )}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-label text-foreground-secondary">{title}</span>
          {trend && (
            <span className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium rounded-full px-1.5 py-0.5',
              trend.isPositive
                ? 'text-success bg-success-subtle'
                : 'text-destructive bg-destructive-subtle'
            )}>
              {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend.value)}%
            </span>
          )}
          {!trend && icon && accent && (
            <span className={cn('flex size-8 items-center justify-center rounded-lg', iconBgStyles[accent])}>
              {icon}
            </span>
          )}
          {!trend && icon && !accent && (
            <span className="text-muted-foreground">{icon}</span>
          )}
        </div>
        <div className="mt-2 text-3xl sm:text-4xl font-bold leading-tight tracking-tight tabular-nums">
          {value}
        </div>
        {subtitle && <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}
