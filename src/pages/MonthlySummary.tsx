import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPreviousMonths, getMonthName } from '@/lib/monthHelper';
import { ChartCard } from '@/components/charts/ChartCard';
import { ChartTooltipContent } from '@/components/charts/ChartTooltip';
import { getChartColor } from '@/components/charts/chart-colors';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';

export default function MonthlySummary() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<any>(null);
  const [previousMonth, setPreviousMonth] = useState<any>(null);
  const [months, setMonths] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMonths();
    }
  }, [user]);

  useEffect(() => {
    if (selectedMonth) {
      loadTransactions();
      loadPreviousMonth();
    }
  }, [selectedMonth]);

  const loadMonths = async () => {
    if (!user) return;
    const allMonths = await getPreviousMonths(user.id, 12);
    setMonths(allMonths);
    if (allMonths.length > 0) {
      setSelectedMonth(allMonths[0]);
    }
    setLoading(false);
  };

  const loadPreviousMonth = async () => {
    if (!user || !selectedMonth) return;
    
    const prevMonth = selectedMonth.mes === 1 ? 12 : selectedMonth.mes - 1;
    const prevYear = selectedMonth.mes === 1 ? selectedMonth.ano - 1 : selectedMonth.ano;

    const { data } = await supabase
      .from('meses_financeiros')
      .select('*')
      .eq('user_id', user.id)
      .eq('mes', prevMonth)
      .eq('ano', prevYear)
      .maybeSingle();

    setPreviousMonth(data || null);
  };

  const loadTransactions = async () => {
    if (!selectedMonth) return;

    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select(`
          *,
          categoria:categorias_saidas(nome, icone, cor)
        `)
        .eq('mes_financeiro_id', selectedMonth.id)
        .eq('deletado', false);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, { nome: string; valor: number; cor: string; icone: string }>();
    
    transactions
      .filter(t => t.tipo !== 'entrada')
      .forEach(trans => {
        const categoriaNome = trans.categoria?.nome || 'Sem categoria';
        const valor = Number(trans.valor_original) || 0;
        const existing = totals.get(categoriaNome) || {
          nome: categoriaNome,
          valor: 0,
          cor: trans.categoria?.cor || '#2563eb',
          icone: trans.categoria?.icone || '📌',
        };
        existing.valor += valor;
        totals.set(categoriaNome, existing);
      });

    return Array.from(totals.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [transactions]);

  const dailyData = useMemo(() => {
    const daily = new Map<number, { dia: number; entradas: number; saidas: number }>();
    
    transactions.forEach(trans => {
      const dia = trans.dia;
      if (!daily.has(dia)) {
        daily.set(dia, { dia, entradas: 0, saidas: 0 });
      }
      const entry = daily.get(dia)!;
      const valor = Number(trans.valor_original) || 0;
      
      if (trans.tipo === 'entrada') {
        entry.entradas += valor;
      } else {
        entry.saidas += valor;
      }
    });

    return Array.from(daily.values()).sort((a, b) => a.dia - b.dia);
  }, [transactions]);

  const receitas = selectedMonth?.receitas || 0;
  const despesas = selectedMonth?.despesas || 0;
  const saldo = receitas - despesas;
  
  const prevReceitas = previousMonth?.receitas || 0;
  const prevDespesas = previousMonth?.despesas || 0;
  const prevSaldo = prevReceitas - prevDespesas;

  const receitasDiff = prevReceitas > 0 ? ((receitas - prevReceitas) / prevReceitas) * 100 : 0;
  const despesasDiff = prevDespesas > 0 ? ((despesas - prevDespesas) / prevDespesas) * 100 : 0;
  const saldoDiff = prevSaldo !== 0 ? ((saldo - prevSaldo) / Math.abs(prevSaldo)) * 100 : 0;

  if (loading) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Resumo Mensal</h1>
            <p className="text-muted-foreground mt-1">
              Análise detalhada das suas finanças mensais
            </p>
          </div>
          <Select
            value={selectedMonth?.id}
            onValueChange={(value) => {
              const month = months.find((m) => m.id === value);
              setSelectedMonth(month);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.id} value={month.id}>
                  {getMonthName(month.mes, month.ano)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedMonth && (
          <>
            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Receitas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(receitas)}</p>
                  {previousMonth && (
                    <p className={`text-xs mt-1 ${receitasDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {receitasDiff >= 0 ? '+' : ''}{receitasDiff.toFixed(1)}% vs mês anterior
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(despesas)}</p>
                  {previousMonth && (
                    <p className={`text-xs mt-1 ${despesasDiff <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {despesasDiff >= 0 ? '+' : ''}{despesasDiff.toFixed(1)}% vs mês anterior
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(saldo)}
                  </p>
                  {previousMonth && (
                    <p className={`text-xs mt-1 ${saldoDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {saldoDiff >= 0 ? '+' : ''}{saldoDiff.toFixed(1)}% vs mês anterior
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Evolução Diária */}
            {dailyData.length > 0 && (
              <ChartCard title="Evolução Diária">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={2} name="Entradas" />
                    <Line type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={2} name="Saídas" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Top Categorias */}
            {categoryTotals.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Top 5 Categorias de Gastos">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryTotals}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="valor" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Distribuição por Categoria">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryTotals}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ nome, percent }) => `${nome}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="valor"
                      >
                        {categoryTotals.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
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
                  <CardTitle className="text-sm font-medium text-muted-foreground">Maior Gasto</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      Math.max(...transactions.filter(t => t.tipo !== 'entrada').map(t => Number(t.valor_original) || 0), 0)
                    )}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Maior Receita</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      Math.max(...transactions.filter(t => t.tipo === 'entrada').map(t => Number(t.valor_original) || 0), 0)
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
