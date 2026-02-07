import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWeekRange, formatPeriod } from "@/lib/dateHelpers";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WeeklyCalendarViewProps {
  transactions: any[];
  selectedWeek: Date;
  onWeekChange: (date: Date) => void;
  onDayClick?: (day: number, date: Date) => void;
  loading?: boolean;
}

const DAYS_OF_WEEK = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function WeeklyCalendarView({
  transactions,
  selectedWeek,
  onWeekChange,
  onDayClick,
  loading = false,
}: WeeklyCalendarViewProps) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const weekRange = useMemo(() => getWeekRange(selectedWeek), [selectedWeek]);

  // Agrupar transações por dia da semana
  const transactionsByDay = useMemo(() => {
    const grouped: Record<number, any[]> = {};
    const weekStart = weekRange.start;

    transactions.forEach((transaction) => {
      // Criar data da transação usando o dia do mês
      const transactionDate = new Date(
        weekStart.getFullYear(),
        weekStart.getMonth(),
        transaction.dia
      );
      
      // Verificar se a transação está na semana atual
      if (
        transactionDate >= weekRange.start &&
        transactionDate <= weekRange.end
      ) {
        const dayOfWeek = transactionDate.getDay();
        // Converter domingo (0) para 6 para manter segunda-feira como início
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        if (!grouped[adjustedDay]) {
          grouped[adjustedDay] = [];
        }
        grouped[adjustedDay].push(transaction);
      }
    });

    return grouped;
  }, [transactions, weekRange]);

  // Calcular totais e média semanal
  const weeklyStats = useMemo(() => {
    const totals: Record<number, number> = {};
    let totalWeek = 0;

    Object.keys(transactionsByDay).forEach((dayStr) => {
      const day = Number(dayStr);
      const dayTotal = transactionsByDay[day].reduce(
        (sum, t) => sum + Number(t.valor_original || 0),
        0
      );
      totals[day] = dayTotal;
      totalWeek += dayTotal;
    });

    const average = totalWeek / 7;

    return { totals, totalWeek, average };
  }, [transactionsByDay]);

  // Obter cor baseada na intensidade do gasto
  const getIntensityColor = (amount: number): string => {
    const { average } = weeklyStats;
    if (amount === 0) return "bg-muted/30";
    if (amount < average * 0.5) return "bg-emerald-500/20 border-emerald-500/30";
    if (amount < average) return "bg-yellow-500/20 border-yellow-500/30";
    if (amount < average * 2) return "bg-orange-500/20 border-orange-500/30";
    return "bg-red-500/20 border-red-500/30";
  };

  const getIntensityLabel = (amount: number): string => {
    const { average } = weeklyStats;
    if (amount === 0) return "Sem gastos";
    if (amount < average * 0.5) return "Baixo";
    if (amount < average) return "Médio";
    if (amount < average * 2) return "Alto";
    return "Muito alto";
  };

  const goToPreviousWeek = () => {
    const prevWeek = new Date(selectedWeek);
    prevWeek.setDate(prevWeek.getDate() - 7);
    onWeekChange(prevWeek);
  };

  const goToNextWeek = () => {
    const nextWeek = new Date(selectedWeek);
    nextWeek.setDate(nextWeek.getDate() + 7);
    onWeekChange(nextWeek);
  };

  const goToToday = () => {
    onWeekChange(new Date());
  };

  const getDayDate = (dayIndex: number): Date => {
    const date = new Date(weekRange.start);
    date.setDate(date.getDate() + dayIndex);
    return date;
  };

  const isCurrentWeek =
    new Date() >= weekRange.start && new Date() <= weekRange.end;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, idx) => (
            <Card key={idx} className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold tracking-tight">
            {formatPeriod(selectedWeek, "week")}
          </h3>
          {isCurrentWeek && (
            <Badge variant="secondary" className="text-xs">
              Semana atual
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousWeek}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {!isCurrentWeek && (
            <Button variant="ghost" size="sm" onClick={goToToday} className="h-9">
              Hoje
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextWeek}
            className="h-9 w-9"
            disabled={isCurrentWeek}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7 gap-3">
        {DAYS_OF_WEEK.map((dayName, dayIndex) => {
          const dayTransactions = transactionsByDay[dayIndex] || [];
          const dayTotal = weeklyStats.totals[dayIndex] || 0;
          const dayDate = getDayDate(dayIndex);
          const isToday =
            dayDate.toDateString() === new Date().toDateString();

          return (
            <TooltipProvider key={dayIndex}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card
                    className={cn(
                      "group relative overflow-hidden border-2 transition-all duration-300 cursor-pointer",
                      "hover:shadow-lg hover:-translate-y-1",
                      getIntensityColor(dayTotal),
                      isToday && "ring-2 ring-primary ring-offset-2"
                    )}
                    onClick={() => onDayClick?.(dayDate.getDate(), dayDate)}
                    onMouseEnter={() => setHoveredDay(dayIndex)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Dia da semana e número */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                          {dayName}
                        </span>
                        <span
                          className={cn(
                            "text-lg font-bold",
                            isToday && "text-primary"
                          )}
                        >
                          {dayDate.getDate()}
                        </span>
                      </div>

                      {/* Total gasto */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-lg font-bold tabular-nums">
                            R${" "}
                            {dayTotal.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        {dayTransactions.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-xs w-fit"
                          >
                            {dayTransactions.length}{" "}
                            {dayTransactions.length === 1
                              ? "transação"
                              : "transações"}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {dayDate.toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                    <p className="text-sm">
                      Total: R${" "}
                      {dayTotal.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Intensidade: {getIntensityLabel(dayTotal)}
                    </p>
                    {dayTransactions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs font-semibold mb-1">
                          Transações:
                        </p>
                        <div className="space-y-0.5">
                          {dayTransactions.slice(0, 3).map((t) => (
                            <p key={t.id} className="text-xs">
                              • {t.descricao} - R${" "}
                              {Number(t.valor_original).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          ))}
                          {dayTransactions.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{dayTransactions.length - 3} mais
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Resumo semanal */}
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total da semana</p>
              <p className="text-2xl font-bold tabular-nums">
                R${" "}
                {weeklyStats.totalWeek.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Média diária</p>
              <p className="text-xl font-semibold tabular-nums">
                R${" "}
                {weeklyStats.average.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
