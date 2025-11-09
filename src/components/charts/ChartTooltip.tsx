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
        "rounded-lg border border-border bg-popover px-3 py-2 shadow-lg text-sm",
        "backdrop-blur supports-[backdrop-filter]:bg-popover/80",
        className
      )}
    >
      <div className="mb-1 font-medium text-foreground">
        {labelFormatter ? labelFormatter(label) : label}
      </div>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-semibold text-foreground">
              {valueFormatter ? valueFormatter(entry.value, entry.dataKey) : `${entry.value}${unit ?? ""}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

