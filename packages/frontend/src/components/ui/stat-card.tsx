import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, value, subtitle, trend, icon, className }: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden animate-fade-in-up', className)}>
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
          {!trend && icon && (
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
