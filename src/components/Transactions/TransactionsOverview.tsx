import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartCard } from "@/components/charts/ChartCard";
import { ModernPieChart } from "@/components/charts/ModernPieChart";
import { modernChartConfig } from "@/components/charts/modern-chart-config";
import { getChartColor } from "@/components/charts/chart-colors";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { ChartTooltipContent } from "@/components/charts/ChartTooltip";
import { MetricsCard } from "@/components/ui/metrics-card";
import { TrendingUp, TrendingDown, Wallet, PieChart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TransactionsOverviewProps {
  transactions: any[];
  loading?: boolean;
}

export function TransactionsOverview({
  transactions,
  loading = false,
}: TransactionsOverviewProps) {
  // Calcular totais
  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        const valor = Number(t.valor_original) || 0;
        if (t.tipo === "entrada") {
          acc.entradas += valor;
        } else if (t.tipo === "saida_fixa") {
          acc.saidasFixas += valor;
        } else {
          acc.gastosDiarios += valor;
        }
        acc.total = acc.entradas - acc.saidasFixas - acc.gastosDiarios;
        return acc;
      },
      { entradas: 0, saidasFixas: 0, gastosDiarios: 0, total: 0 }
    );
  }, [transactions]);

  // Dados para gráfico de barras (fluxo diário)
  const dailyFlowData = useMemo(() => {
    const daysMap: Record<number, { entradas: number; saidas: number; dia: number }> = {};

    transactions.forEach((t) => {
      const dia = t.dia;
      if (!daysMap[dia]) {
        daysMap[dia] = { entradas: 0, saidas: 0, dia };
      }
      const valor = Number(t.valor_original) || 0;
      if (t.tipo === "entrada") {
        daysMap[dia].entradas += valor;
      } else {
        daysMap[dia].saidas += valor;
      }
    });

    return Object.values(daysMap)
      .sort((a, b) => a.dia - b.dia)
      .map((item) => ({
        dia: `Dia ${item.dia}`,
        Entradas: item.entradas,
        "Saídas": item.saidas,
      }));
  }, [transactions]);

  // Dados para gráfico de pizza (por categoria)
  const categoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};

    transactions
      .filter((t) => t.tipo !== "entrada")
      .forEach((t) => {
        const categoriaNome = t.categoria?.nome || "Sem categoria";
        const valor = Number(t.valor_original) || 0;
        categoryMap[categoriaNome] = (categoryMap[categoriaNome] || 0) + valor;
      });

    return Object.entries(categoryMap)
      .map(([name, value]) => ({
        name,
        value,
        icon: transactions.find((t) => t.categoria?.nome === name)?.categoria?.icone || "📌",
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (loading) {
    return (
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Skeleton key={idx} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Métricas Principais - Cards uniformes */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-slide-in-up" style={{ animationDelay: "0.1s" }}>
          <MetricsCard
            title="Entradas"
            value={totals.entradas}
            icon={<TrendingUp className="h-5 w-5" />}
            className="h-full"
          />
        </div>
        <div className="animate-slide-in-up" style={{ animationDelay: "0.2s" }}>
          <MetricsCard
            title="Saídas Fixas"
            value={totals.saidasFixas}
            icon={<TrendingDown className="h-5 w-5" />}
            className="h-full"
          />
        </div>
        <div className="animate-slide-in-up" style={{ animationDelay: "0.3s" }}>
          <MetricsCard
            title="Gastos Diários"
            value={totals.gastosDiarios}
            icon={<Wallet className="h-5 w-5" />}
            className="h-full"
          />
        </div>
        <div className="animate-slide-in-up" style={{ animationDelay: "0.4s" }}>
          <MetricsCard
            title="Saldo Total"
            value={totals.total}
            change={{
              value: totals.total,
              percentage: totals.entradas > 0 
                ? ((totals.total / totals.entradas) * 100).toFixed(1)
                : "0",
              isPositive: totals.total >= 0,
            }}
            icon={<Wallet className="h-5 w-5" />}
            valueClassName={totals.total >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}
            className="h-full"
          />
        </div>
      </div>

      {/* Gráficos - Cards uniformes com mesma altura */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Fluxo Diário */}
        <div className="animate-slide-in-up" style={{ animationDelay: "0.5s" }}>
          <ChartCard
            title="Fluxo Diário"
            description="Entradas e saídas por dia do mês"
            className="h-full flex flex-col"
          >
            <div className="flex-1 min-h-[300px]">
              {dailyFlowData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyFlowData}>
                    <CartesianGrid {...modernChartConfig.grid} />
                    <XAxis {...modernChartConfig.xAxis} dataKey="dia" />
                    <YAxis {...modernChartConfig.yAxis} />
                    <Tooltip
                      {...modernChartConfig.tooltip}
                      content={<ChartTooltipContent />}
                    />
                    <Legend />
                    <Bar
                      dataKey="Entradas"
                      fill="#10b981"
                      radius={modernChartConfig.barRadius}
                    />
                    <Bar
                      dataKey="Saídas"
                      fill="#ef4444"
                      radius={modernChartConfig.barRadius}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <p className="text-sm">Nenhum dado disponível</p>
                </div>
              )}
            </div>
          </ChartCard>
        </div>

        {/* Gastos por Categoria */}
        <div className="animate-slide-in-up" style={{ animationDelay: "0.6s" }}>
          <ChartCard
            title="Gastos por Categoria"
            description="Visão geral das despesas do mês atual"
            className="h-full flex flex-col"
          >
            <div className="flex-1 min-h-[300px]">
              {categoryData.length > 0 ? (
                <ModernPieChart
                  data={categoryData.map((item, idx) => ({
                    name: item.name,
                    value: item.value,
                    icon: item.icon,
                    color: getChartColor(idx),
                  }))}
                  height={300}
                  innerRadius={70}
                  outerRadius={120}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <p className="text-sm">Nenhum dado disponível</p>
                </div>
              )}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
