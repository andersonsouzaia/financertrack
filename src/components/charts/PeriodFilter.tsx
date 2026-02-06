import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type PeriodOption = "24h" | "7d" | "30d" | "90d" | "1y" | "all";

interface PeriodFilterProps {
  value: PeriodOption;
  onChange: (value: PeriodOption) => void;
  options?: PeriodOption[];
  className?: string;
}

const defaultOptions: PeriodOption[] = ["7d", "30d", "90d", "1y"];

export function PeriodFilter({
  value,
  onChange,
  options = defaultOptions,
  className,
}: PeriodFilterProps) {
  const labels: Record<PeriodOption, string> = {
    "24h": "24h",
    "7d": "7d",
    "30d": "30d",
    "90d": "90d",
    "1y": "1y",
    "all": "Tudo",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-background/50 p-1 backdrop-blur-sm border border-border/50",
        className
      )}
    >
      {options.map((option) => (
        <Button
          key={option}
          variant="ghost"
          size="sm"
          onClick={() => onChange(option)}
          className={cn(
            "h-7 px-3 text-xs font-medium transition-all duration-200",
            value === option
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {labels[option]}
        </Button>
      ))}
    </div>
  );
}
