import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartCard } from '@/components/charts/ChartCard';
import { ChartTooltipContent } from '@/components/charts/ChartTooltip';
import { modernChartConfig } from '@/components/charts/modern-chart-config';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  LineChart,
} from 'recharts';
import { Insights } from '@/components/Summary/Insights';
import { ComparisonChart } from '@/components/Summary/ComparisonChart';

export default function AnnualSummary() {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [previousYear, setPreviousYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadSummary();
    }
  }, [user, selectedYear]);

  const loadSummary = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Carregar dados do ano atual
      const { data: currentYearData, error: currentError } = await supabase
        .from('meses_financeiros')
        .select('*')
        .eq('user_id', user.id)
        .eq('ano', selectedYear)
        .order('mes', { ascending: true });

      if (currentError) throw currentError;

      // Carregar dados do ano anterior para comparação
      const prevYear = selectedYear - 1;
      const { data: previousYearData } = await supabase
        .from('meses_financeiros')
        .select('*')
        .eq('user_id', user.id)
        .eq('ano', prevYear)
        .order('mes', { ascending: true });

      setPreviousYear(prevYear);

      // Calcular totais do ano atual
      const totalReceitas = (currentYearData || []).reduce((sum, m) => sum + (m.total_entradas || 0), 0);
      const totalDespesas = (currentYearData || []).reduce((sum, m) => sum + (m.total_saidas || 0) + (m.total_diario || 0), 0);

      // Calcular totais do ano anterior
      const prevTotalReceitas = (previousYearData || []).reduce((sum, m) => sum + (m.total_entradas || 0), 0);
      const prevTotalDespesas = (previousYearData || []).reduce((sum, m) => sum + (m.total_saidas || 0) + (m.total_diario || 0), 0);

      setSummary({
        receitas: totalReceitas,
        despesas: totalDespesas,
        saldo: totalReceitas - totalDespesas,
        meses: currentYearData?.length || 0,
        prevReceitas: prevTotalReceitas || 0,
        prevDespesas: prevTotalDespesas || 0,
        prevSaldo: prevTotalReceitas - prevTotalDespesas,
      });

      // Preparar dados mensais para gráfico
      const monthly = (currentYearData || []).map(month => {
        const r = month.total_entradas || 0;
        const d = (month.total_saidas || 0) + (month.total_diario || 0);
        return {
          mes: `${month.mes}/${month.ano}`,
          receitas: r,
          despesas: d,
          saldo: r - d,
        };
      });
      setMonthlyData(monthly);

      // Carregar transações para análise de categorias
      if (currentYearData && currentYearData.length > 0) {
        const monthIds = currentYearData.map(m => m.id);
        const { data: transData } = await supabase
          .from('transacoes')
          .select(`
            *,
            categoria:categorias_saidas(nome)
          `)
          .in('mes_financeiro_id', monthIds)
          .eq('deletado', false);

        setTransactions(transData || []);
      }
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
      // Inicializar summary com valores padrão em caso de erro
      setSummary({
        receitas: 0,
        despesas: 0,
        saldo: 0,
        meses: 0,
        prevReceitas: 0,
        prevDespesas: 0,
        prevSaldo: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const topCategories = useMemo(() => {
    const totals = new Map<string, number>();

    transactions
      .filter(t => t.tipo !== 'entrada' && t.categoria)
      .forEach(trans => {
        const categoriaNome = trans.categoria.nome;
        const valor = Number(trans.valor_original) || 0;
        totals.set(categoriaNome, (totals.get(categoriaNome) || 0) + valor);
      });

    return Array.from(totals.entries())
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [transactions]);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Garantir que summary sempre tenha valores padrão
  const safeSummary = summary || {
    receitas: 0,
    despesas: 0,
    saldo: 0,
    meses: 0,
    prevReceitas: 0,
    prevDespesas: 0,
    prevSaldo: 0,
  };

  if (loading) {
    return (
      <AppLayout title="Resumo Anual" description="Carregando resumo anual...">
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      </AppLayout>
    );
  }

  const receitasDiff = safeSummary.prevReceitas && safeSummary.prevReceitas > 0
    ? ((safeSummary.receitas || 0) - safeSummary.prevReceitas) / safeSummary.prevReceitas * 100
    : 0;
  const despesasDiff = safeSummary.prevDespesas && safeSummary.prevDespesas > 0
    ? ((safeSummary.despesas || 0) - safeSummary.prevDespesas) / safeSummary.prevDespesas * 100
    : 0;
  const saldoDiff = safeSummary.prevSaldo && safeSummary.prevSaldo !== 0
    ? ((safeSummary.saldo || 0) - safeSummary.prevSaldo) / Math.abs(safeSummary.prevSaldo) * 100
    : 0;

  return (
    <AppLayout
      title="Resumo Anual"
      description="Visão geral das suas finanças no ano"
      actions={
        <Select
          value={selectedYear.toString()}
          onValueChange={(value) => setSelectedYear(parseInt(value))}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Selecione o ano" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {safeSummary && safeSummary.meses > 0 ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Insights
            type="annual"
            data={{
              receitas: safeSummary.receitas,
              despesas: safeSummary.despesas,
              saldo: safeSummary.saldo,
              previousReceitas: safeSummary.prevReceitas,
              previousDespesas: safeSummary.prevDespesas,
              transactions: transactions
            }}
          />

          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Receitas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(safeSummary.receitas)}</p>
                {previousYear && safeSummary.prevReceitas > 0 && (
                  <p className={`text-xs mt-1 ${receitasDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {receitasDiff >= 0 ? '+' : ''}{receitasDiff.toFixed(1)}% vs {previousYear}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(safeSummary.despesas)}</p>
                {previousYear && safeSummary.prevDespesas > 0 && (
                  <p className={`text-xs mt-1 ${despesasDiff <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {despesasDiff >= 0 ? '+' : ''}{despesasDiff.toFixed(1)}% vs {previousYear}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Anual</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${safeSummary.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(safeSummary.saldo)}
                </p>
                {previousYear && safeSummary.prevSaldo !== 0 && (
                  <p className={`text-xs mt-1 ${saldoDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {saldoDiff >= 0 ? '+' : ''}{saldoDiff.toFixed(1)}% vs {previousYear}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Meses Registrados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{summary?.meses || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Média mensal: {formatCurrency((summary?.meses || 0) > 0 ? (summary?.saldo || 0) / (summary?.meses || 1) : 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos Principais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {monthlyData.length > 0 && (
              <ChartCard title="Evolução Mensal" description="Receitas e despesas por mês">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid {...modernChartConfig.grid} />
                    <XAxis dataKey="mes" {...modernChartConfig.xAxis} />
                    <YAxis
                      {...modernChartConfig.yAxis}
                      tickFormatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { notation: "compact" })}`}
                    />
                    <Tooltip
                      content={<ChartTooltipContent valueFormatter={(value) => formatCurrency(value)} />}
                      {...modernChartConfig.tooltip}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="rect" />
                    <Bar dataKey="receitas" fill="hsl(var(--primary))" name="Receitas" radius={modernChartConfig.barRadius} />
                    <Bar dataKey="despesas" fill="hsl(var(--danger))" name="Despesas" radius={modernChartConfig.barRadius} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {monthlyData.length > 0 && (
              <ChartCard title="Saldo Mensal" description="Evolução do saldo ao longo do ano">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid {...modernChartConfig.grid} />
                    <XAxis dataKey="mes" {...modernChartConfig.xAxis} />
                    <YAxis
                      {...modernChartConfig.yAxis}
                      tickFormatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { notation: "compact" })}`}
                    />
                    <Tooltip
                      content={<ChartTooltipContent valueFormatter={(value) => formatCurrency(value)} />}
                      {...modernChartConfig.tooltip}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="line" />
                    <Line
                      type="monotone"
                      dataKey="saldo"
                      stroke="hsl(var(--primary))"
                      strokeWidth={modernChartConfig.lineStrokeWidth}
                      dot={false}
                      activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                      name="Saldo Mensal"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Comparison Chart */}
            <div className="h-full">
              <ComparisonChart
                title="Comparativo Anual"
                currentLabel={selectedYear.toString()}
                previousLabel={previousYear ? previousYear.toString() : 'Anterior'}
                formatCurrency={formatCurrency}
                data={[
                  { label: 'Receitas', current: safeSummary.receitas, previous: safeSummary.prevReceitas },
                  { label: 'Despesas', current: safeSummary.despesas, previous: safeSummary.prevDespesas },
                ]}
              />
            </div>

            {/* Top Categorias */}
            {topCategories.length > 0 && (
              <ChartCard title="Top 5 Categorias do Ano" description="Principais categorias de gastos">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topCategories} layout="vertical">
                    <CartesianGrid {...modernChartConfig.grid} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="nome"
                      type="category"
                      width={100}
                      tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<ChartTooltipContent valueFormatter={(value) => formatCurrency(value)} />}
                      {...modernChartConfig.tooltip}
                    />
                    <Bar
                      dataKey="valor"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                      barSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>

          {/* Estatísticas Adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Transações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{transactions.length}</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Média Mensal de Receitas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(safeSummary.meses > 0 ? safeSummary.receitas / safeSummary.meses : 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Média Mensal de Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(safeSummary.meses > 0 ? safeSummary.despesas / safeSummary.meses : 0)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="mt-8 border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <p className="text-lg font-medium">Nenhum dado financeiro encontrado</p>
              <p className="text-sm">Não há registros para o ano de {selectedYear}. Tente selecionar outro ano ou comece a registrar suas transações.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}
