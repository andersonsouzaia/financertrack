import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    percentage?: string | number;
    isPositive?: boolean;
  };
  icon?: ReactNode;
  className?: string;
  valueClassName?: string;
  description?: string;
}

export function MetricsCard({
  title,
  value,
  change,
  icon,
  className,
  valueClassName,
  description,
}: MetricsCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === "number") {
      return val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return val;
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius)] border border-border/50",
        "bg-background/50 backdrop-blur-sm",
        "transition-all duration-300",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        "flex flex-col",
        className
      )}
    >
      {/* Gradient overlay - sempre visível mas mais sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Icon background glow */}
      {icon && (
        <div className="absolute top-4 right-4 h-12 w-12 rounded-full bg-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
      
      <div className="relative p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>
            )}
          </div>
          {icon && (
            <div className="relative z-10 text-muted-foreground group-hover:text-primary transition-colors duration-300 shrink-0 ml-2">
              {icon}
            </div>
          )}
        </div>

        <div className="space-y-3 flex-1">
          <p className={cn("text-3xl font-bold tracking-tight text-foreground tabular-nums", valueClassName)}>
            R$ {formatValue(value)}
          </p>

          {change && (
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
                  "transition-all duration-200",
                  change.isPositive
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20"
                    : "bg-red-500/15 text-red-600 dark:text-red-400 ring-1 ring-red-500/20"
                )}
              >
                {change.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="tabular-nums">
                  {change.isPositive ? "+" : ""}
                  {typeof change.percentage === "number"
                    ? change.percentage.toFixed(1)
                    : change.percentage}
                  %
                </span>
              </div>
              {change.value && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {change.isPositive ? "+" : ""}
                  R$ {formatValue(change.value)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
