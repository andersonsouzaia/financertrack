import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ color: string; dataKey: string; value: number; name: string }>;
  label?: string;
  className?: string;
  labelFormatter?: (label?: string) => ReactNode;
  valueFormatter?: (value: number, dataKey: string) => ReactNode;
  unit?: string;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  labelFormatter,
  valueFormatter,
  unit,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border/50 bg-background/95 backdrop-blur-md px-4 py-3 shadow-xl text-sm",
        "ring-1 ring-border/50",
        className
      )}
      style={{
        backgroundColor: "hsl(var(--background) / 0.95)",
        borderColor: "hsl(var(--border) / 0.5)",
      }}
    >
      <div className="mb-2 font-semibold text-foreground text-xs uppercase tracking-wider">
        {labelFormatter ? labelFormatter(label) : label}
      </div>
      <div className="space-y-2">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 rounded-full ring-2 ring-background"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground font-medium">{entry.name}</span>
            </div>
            <span className="font-bold text-foreground text-sm tabular-nums">
              {valueFormatter ? valueFormatter(entry.value, entry.dataKey) : `${entry.value}${unit ?? ""}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

