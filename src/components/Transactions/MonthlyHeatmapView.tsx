import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Filter, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { ChartCard } from "@/components/charts/ChartCard";
import { ChartTooltipContent } from "@/components/charts/ChartTooltip";
import { modernChartConfig } from "@/components/charts/modern-chart-config";

interface MonthlyHeatmapViewProps {
  transactions: any[];
  selectedMonth: any; // meses_financeiros
  onMonthChange: (month: any) => void;
  filters?: {
    categoria?: string;
    cartao?: string;
    tipo?: string;
  };
  loading?: boolean;
}

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function MonthlyHeatmapView({
  transactions,
  selectedMonth,
  onMonthChange,
  filters = {},
  loading = false,
}: MonthlyHeatmapViewProps) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [filterCategoria, setFilterCategoria] = useState<string>(filters.categoria || "all");
  const [filterCartao, setFilterCartao] = useState<string>(filters.cartao || "all");
  const [filterTipo, setFilterTipo] = useState<string>(filters.tipo || "all");

  // Filtrar transações
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filterCategoria !== "all" && t.categoria_id !== filterCategoria) return false;
      if (filterCartao !== "all") {
        if (filterCartao === "none" && t.cartao_id) return false;
        if (filterCartao !== "none" && t.cartao_id !== filterCartao) return false;
      }
      if (filterTipo !== "all" && t.tipo !== filterTipo) return false;
      return true;
    });
  }, [transactions, filterCategoria, filterCartao, filterTipo]);

  // Agrupar transações por dia
  const transactionsByDay = useMemo(() => {
    const grouped: Record<number, any[]> = {};
    filteredTransactions.forEach((transaction) => {
      const day = transaction.dia;
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(transaction);
    });
    return grouped;
  }, [filteredTransactions]);

  // Calcular totais por dia e estatísticas
  const dailyStats = useMemo(() => {
    const stats: Record<number, { total: number; count: number; topCategory: string }> = {};
    let maxTotal = 0;

    Object.keys(transactionsByDay).forEach((dayStr) => {
      const day = Number(dayStr);
      const dayTransactions = transactionsByDay[day];
      const total = dayTransactions.reduce(
        (sum, t) => sum + Number(t.valor_original || 0),
        0
      );
      const count = dayTransactions.length;

      // Categoria mais gastada
      const categoryTotals: Record<string, number> = {};
      dayTransactions.forEach((t) => {
        const catId = t.categoria_id || "unknown";
        categoryTotals[catId] = (categoryTotals[catId] || 0) + Number(t.valor_original || 0);
      });
      const topCategory = Object.keys(categoryTotals).reduce((a, b) =>
        categoryTotals[a] > categoryTotals[b] ? a : b
      );

      stats[day] = {
        total,
        count,
        topCategory: dayTransactions.find((t) => t.categoria_id === topCategory)?.categoria?.nome || "N/A",
      };

      if (total > maxTotal) maxTotal = total;
    });

    return { stats, maxTotal };
  }, [transactionsByDay]);

  // Obter cor baseada na intensidade
  const getIntensityColor = (amount: number): string => {
    if (amount === 0) return "bg-muted/20";
    const intensity = dailyStats.maxTotal > 0 ? amount / dailyStats.maxTotal : 0;
    if (intensity < 0.25) return "bg-emerald-500/30 border-emerald-500/40";
    if (intensity < 0.5) return "bg-yellow-500/30 border-yellow-500/40";
    if (intensity < 0.75) return "bg-orange-500/30 border-orange-500/40";
    return "bg-red-500/30 border-red-500/40";
  };

  // Gerar dias do mês organizados em semanas
  const monthDays = useMemo(() => {
    if (!selectedMonth) return [];
    const year = selectedMonth.ano;
    const month = selectedMonth.mes;
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();

    const days: Array<{ day: number; date: Date; isCurrentMonth: boolean }> = [];

    // Adicionar dias do mês anterior para completar a primeira semana
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, -i);
      days.push({ day: date.getDate(), date, isCurrentMonth: false });
    }

    // Adicionar dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      days.push({ day, date, isCurrentMonth: true });
    }

    // Adicionar dias do próximo mês para completar a última semana
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(year, month, day);
        days.push({ day, date, isCurrentMonth: false });
      }
    }

    return days;
  }, [selectedMonth]);

  // Preparar dados para o gráfico de linha
  const chartData = useMemo(() => {
    return Array.from({ length: 31 }, (_, i) => {
      const day = i + 1;
      const stats = dailyStats.stats[day];
      return {
        dia: day,
        total: stats?.total || 0,
        count: stats?.count || 0,
      };
    });
  }, [dailyStats]);

  // Obter categorias e cartões únicos para filtros
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((t) => {
      if (t.categoria_id) cats.add(t.categoria_id);
    });
    return Array.from(cats).map((id) => {
      const t = transactions.find((tr) => tr.categoria_id === id);
      return { id, nome: t?.categoria?.nome || "Sem categoria" };
    });
  }, [transactions]);

  const uniqueCards = useMemo(() => {
    const cards = new Set<string>();
    transactions.forEach((t) => {
      if (t.cartao_id) cards.add(t.cartao_id);
    });
    return Array.from(cards).map((id) => {
      const t = transactions.find((tr) => tr.cartao_id === id);
      return { id, nome: t?.cartao?.nome || "Sem nome" };
    });
  }, [transactions]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por Categoria */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {uniqueCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Cartão */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cartão</label>
              <Select value={filterCartao} onValueChange={setFilterCartao}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os cartões" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cartões</SelectItem>
                  <SelectItem value="none">Sem cartão</SelectItem>
                  {uniqueCards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Tipo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Tabs value={filterTipo} onValueChange={setFilterTipo}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
                  <TabsTrigger value="entrada" className="text-xs">Entradas</TabsTrigger>
                  <TabsTrigger value="diario" className="text-xs">Saídas</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heatmap */}
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold tracking-tight">
            Heatmap Mensal - {selectedMonth && new Date(selectedMonth.ano, selectedMonth.mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid de dias */}
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map(({ day, date, isCurrentMonth }, idx) => {
                const stats = dailyStats.stats[day];
                const isToday =
                  isCurrentMonth &&
                  date.toDateString() === new Date().toDateString();

                return (
                  <TooltipProvider key={idx}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "aspect-square rounded-lg border-2 transition-all duration-200 cursor-pointer",
                            "hover:scale-105 hover:shadow-lg",
                            getIntensityColor(stats?.total || 0),
                            !isCurrentMonth && "opacity-30",
                            isToday && "ring-2 ring-primary ring-offset-2"
                          )}
                          onMouseEnter={() => setHoveredDay(day)}
                          onMouseLeave={() => setHoveredDay(null)}
                        >
                          <div className="h-full flex flex-col items-center justify-center p-2">
                            <span
                              className={cn(
                                "text-sm font-bold",
                                !isCurrentMonth && "text-muted-foreground"
                              )}
                            >
                              {day}
                            </span>
                            {stats && stats.total > 0 && (
                              <span className="text-xs font-semibold mt-1">
                                R${" "}
                                {stats.total.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })}
                              </span>
                            )}
                            {stats && stats.count > 0 && (
                              <Badge variant="secondary" className="text-[10px] mt-1 h-4 px-1">
                                {stats.count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold">
                            {date.toLocaleDateString("pt-BR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </p>
                          {stats ? (
                            <>
                              <p className="text-sm">
                                Total: R${" "}
                                {stats.total.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {stats.count}{" "}
                                {stats.count === 1 ? "transação" : "transações"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Categoria mais gastada: {stats.topCategory}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">Sem transações</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted/20 border border-border" />
                <span className="text-xs text-muted-foreground">Sem gastos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500/30 border border-emerald-500/40" />
                <span className="text-xs text-muted-foreground">Baixo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500/30 border border-yellow-500/40" />
                <span className="text-xs text-muted-foreground">Médio</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500/30 border border-orange-500/40" />
                <span className="text-xs text-muted-foreground">Alto</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500/40" />
                <span className="text-xs text-muted-foreground">Muito alto</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Tendência */}
      <ChartCard
        title="Tendência de Gastos ao Longo do Mês"
        description="Evolução diária dos gastos no mês selecionado"
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} {...modernChartConfig}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="dia"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`}
            />
            <RechartsTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              activeDot={{ r: 6 }}
              name="Total Gasto"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
