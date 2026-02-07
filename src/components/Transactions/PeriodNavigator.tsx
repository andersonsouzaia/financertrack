import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { PeriodType } from "@/lib/dateHelpers";
import { usePeriodNavigation } from "@/hooks/usePeriodNavigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PeriodNavigatorProps {
  currentPeriod: Date | { mes: number; ano: number };
  periodType: PeriodType;
  onPeriodChange: (period: Date) => void;
  monthOptions?: Array<{ id: string; mes: number; ano: number; label: string }>;
  className?: string;
}

export function PeriodNavigator({
  currentPeriod,
  periodType,
  onPeriodChange,
  monthOptions,
  className,
}: PeriodNavigatorProps) {
  const {
    currentPeriod: navPeriod,
    formattedPeriod,
    isCurrent,
    goToPrevious,
    goToNext,
    goToToday,
  } = usePeriodNavigation({
    initialPeriod: currentPeriod,
    periodType,
    onPeriodChange,
  });

  const handleMonthSelect = (value: string) => {
    if (value === "today") {
      goToToday();
      return;
    }

    // Formato esperado: "YYYY-MM" ou ID do mês
    if (monthOptions) {
      const selectedMonth = monthOptions.find((m) => m.id === value);
      if (selectedMonth) {
        const date = new Date(selectedMonth.ano, selectedMonth.mes - 1, 1);
        onPeriodChange(date);
        return;
      }
    }

    // Tentar parsear como "YYYY-MM"
    const [anoStr, mesStr] = value.split("-");
    const ano = Number(anoStr);
    const mes = Number(mesStr);
    if (!Number.isNaN(ano) && !Number.isNaN(mes)) {
      const date = new Date(ano, mes - 1, 1);
      onPeriodChange(date);
    }
  };

  const getSelectValue = () => {
    if (periodType === "month" && monthOptions) {
      const currentMonth = monthOptions.find(
        (m) => m.mes === navPeriod.getMonth() + 1 && m.ano === navPeriod.getFullYear()
      );
      return currentMonth?.id || "";
    }
    return "";
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Botão Anterior */}
      <Button
        variant="outline"
        size="icon"
        onClick={goToPrevious}
        className="h-9 w-9 shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Período Atual */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {periodType === "month" && monthOptions ? (
          <Select value={getSelectValue()} onValueChange={handleMonthSelect}>
            <SelectTrigger className="h-9 min-w-[200px] gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Mês Atual</SelectItem>
              {monthOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border/50 bg-background/50 min-w-0">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm truncate">{formattedPeriod}</span>
            {isCurrent && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                Atual
              </span>
            )}
          </div>
        )}
      </div>

      {/* Botão Próximo */}
      <Button
        variant="outline"
        size="icon"
        onClick={goToNext}
        className="h-9 w-9 shrink-0"
        disabled={isCurrent && periodType !== "day"} // Desabilitar se já está no período atual (exceto para dias)
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Botão Hoje (apenas se não estiver no período atual) */}
      {!isCurrent && (
        <Button
          variant="ghost"
          size="sm"
          onClick={goToToday}
          className="h-9 gap-2 shrink-0"
        >
          Hoje
        </Button>
      )}
    </div>
  );
}
