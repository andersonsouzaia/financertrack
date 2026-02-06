import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartCard } from '@/components/charts/ChartCard';
import { ChartTooltipContent } from '@/components/charts/ChartTooltip';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';

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
      const totalReceitas = (currentYearData || []).reduce((sum, m) => sum + (m.receitas || 0), 0);
      const totalDespesas = (currentYearData || []).reduce((sum, m) => sum + (m.despesas || 0), 0);

      // Calcular totais do ano anterior
      const prevTotalReceitas = (previousYearData || []).reduce((sum, m) => sum + (m.receitas || 0), 0);
      const prevTotalDespesas = (previousYearData || []).reduce((sum, m) => sum + (m.despesas || 0), 0);

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
      const monthly = (currentYearData || []).map(month => ({
        mes: `${month.mes}/${month.ano}`,
        receitas: month.receitas || 0,
        despesas: month.despesas || 0,
        saldo: (month.receitas || 0) - (month.despesas || 0),
      }));
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
      <AppLayout>
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
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Resumo Anual</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral das suas finanças no ano
            </p>
          </div>
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
        </div>

        {safeSummary && safeSummary.meses > 0 ? (
          <>
            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Receitas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(safeSummary.receitas)}</p>
                  {previousYear && safeSummary.prevReceitas > 0 && (
                    <p className={`text-xs mt-1 ${receitasDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {receitasDiff >= 0 ? '+' : ''}{receitasDiff.toFixed(1)}% vs {previousYear}
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(safeSummary.despesas)}</p>
                  {previousYear && safeSummary.prevDespesas > 0 && (
                    <p className={`text-xs mt-1 ${despesasDiff <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {despesasDiff >= 0 ? '+' : ''}{despesasDiff.toFixed(1)}% vs {previousYear}
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
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
              <Card>
                <CardHeader>
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

            {/* Gráfico de Evolução Mensal */}
            {monthlyData.length > 0 && (
              <ChartCard title="Evolução Mensal">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
                    <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Gráfico de Saldo Mensal */}
            {monthlyData.length > 0 && (
              <ChartCard title="Saldo Mensal">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="saldo" 
                      stroke="#2563eb" 
                      strokeWidth={2} 
                      name="Saldo Mensal"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Top Categorias */}
            {topCategories.length > 0 && (
              <ChartCard title="Top 5 Categorias do Ano">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topCategories}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="valor" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Estatísticas Adicionais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total de Transações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{transactions.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Média Mensal de Receitas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(safeSummary.meses > 0 ? safeSummary.receitas / safeSummary.meses : 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Média Mensal de Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(safeSummary.meses > 0 ? safeSummary.despesas / safeSummary.meses : 0)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum dado disponível para o ano selecionado.
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
