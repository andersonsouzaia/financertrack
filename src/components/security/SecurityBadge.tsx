import { Shield, Lock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecurityBadgeProps {
  variant?: 'default' | 'compact' | 'inline';
  showIcon?: boolean;
  className?: string;
}

export function SecurityBadge({
  variant = 'default',
  showIcon = true,
  className,
}: SecurityBadgeProps) {
  const Icon = variant === 'compact' ? Lock : Shield;

  if (variant === 'inline') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
        {showIcon && <Lock className="h-3 w-3" />}
        <span>Criptografado</span>
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium', className)}>
        {showIcon && <Lock className="h-3 w-3" />}
        <span>Seguro</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/20 bg-primary/5', className)}>
      {showIcon && <Icon className="h-4 w-4 text-primary" />}
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-primary">Criptografado</span>
        <span className="text-xs text-muted-foreground">Dados protegidos com AES-256</span>
      </div>
    </div>
  );
}
