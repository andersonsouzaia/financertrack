import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChartCard } from '@/components/charts/ChartCard';
import { ChartTooltipContent } from '@/components/charts/ChartTooltip';
import { getChartColor } from '@/components/charts/chart-colors';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';

export default function BudgetProjection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gastosPorCategoria, setGastosPorCategoria] = useState<Record<string, number>>({});

  // Simulações
  const [simulacoes, setSimulacoes] = useState({
    viagem: { dias: 0, gastoPorDia: 0, descricao: 'Viagem' },
    apartamento: { valor: 0, frequencia: 'mensal', descricao: 'Aluguel/Apartamento' },
    customizado: { valor: 0, descricao: 'Gasto Customizado' }
  });

  const [resultados, setResultados] = useState<any>(null);
  const formatCurrency = (value: number | string) =>
    `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const rendaMensal = config?.renda_mensal || 0;
  const gastoAtualTotal = useMemo(
    () => Object.values(gastosPorCategoria).reduce((a, b) => a + b, 0),
    [gastosPorCategoria]
  );
  const projectionChartData = useMemo(() => {
    if (!resultados) {
      return [
        { name: 'Gastos atuais', valor: gastoAtualTotal },
        { name: 'Renda mensal', valor: rendaMensal },
      ];
    }

    return [
      { name: 'Gastos atuais', valor: resultados.gastoAtual },
      { name: 'Simulação', valor: resultados.gastoSimulado },
      { name: 'Total projetado', valor: resultados.novoGastoTotal },
      { name: 'Renda mensal', valor: rendaMensal },
    ];
  }, [resultados, gastoAtualTotal, rendaMensal]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Buscar configuração
      const { data: configData } = await supabase
        .from('configuracao_usuario')
        .select('renda_mensal')
        .eq('user_id', user.id)
        .maybeSingle();

      setConfig(configData);

      // Buscar gastos do mês atual
      const hoje = new Date();
      const mes = hoje.getMonth() + 1;
      const ano = hoje.getFullYear();

      const { data: mesData } = await supabase
        .from('meses_financeiros')
        .select('id')
        .eq('user_id', user.id)
        .eq('mes', mes)
        .eq('ano', ano)
        .maybeSingle();

      if (mesData) {
        const { data: transacoes } = await supabase
          .from('transacoes')
          .select('*, categoria:categorias_saidas(nome)')
          .eq('mes_financeiro_id', mesData.id)
          .eq('deletado', false);

        const gastos: Record<string, number> = {};
        transacoes?.forEach((t: any) => {
          const cat = t.categoria?.nome || 'Outro';
          gastos[cat] = (gastos[cat] || 0) + Number(t.valor_original);
        });

        setGastosPorCategoria(gastos);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro:', error);
      setLoading(false);
    }
  };

  const calcularProjecao = () => {
    // Calcular gastos simulados
    let gastoSimulado = 0;

    // Viagem
    gastoSimulado += simulacoes.viagem.dias * simulacoes.viagem.gastoPorDia;

    // Apartamento
    if (simulacoes.apartamento.frequencia === 'mensal') {
      gastoSimulado += simulacoes.apartamento.valor;
    } else if (simulacoes.apartamento.frequencia === 'anual') {
      gastoSimulado += simulacoes.apartamento.valor / 12;
    }

    // Customizado
    gastoSimulado += simulacoes.customizado.valor;

    const novoGastoTotal = gastoAtualTotal + gastoSimulado;
    const saldoProjectado = rendaMensal - novoGastoTotal;

    const percentualGasto = rendaMensal > 0
      ? ((novoGastoTotal / rendaMensal) * 100).toFixed(1)
      : '0.0';

    const impactoPercentual = rendaMensal > 0
      ? ((saldoProjectado / rendaMensal) * 100).toFixed(1)
      : '0.0';

    const alerta =
      rendaMensal > 0
        ? parseFloat(percentualGasto) > 80
        : novoGastoTotal > 0;

    setResultados({
      gastoAtual: gastoAtualTotal,
      gastoSimulado: gastoSimulado,
      novoGastoTotal: novoGastoTotal,
      saldoProjectado: saldoProjectado,
      percentualGasto: percentualGasto,
      impacto: impactoPercentual,
      alerta,
      rendaValida: rendaMensal > 0,
    });
  };

  const headerActions = (
    <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
      Voltar ao dashboard
    </Button>
  );

  if (loading) {
    return (
      <AppLayout
        title="Projeção de orçamento"
        description="Simule cenários de gastos e veja como eles afetam suas finanças."
        actions={headerActions}
      >
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Carregando dados da projeção...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Projeção de orçamento"
      description="Simule diferentes cenários e entenda o impacto no seu mês financeiro."
      actions={headerActions}
      contentClassName="mx-auto max-w-5xl w-full space-y-8"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Painel de Simulação */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-foreground">Simular Gastos</h2>

          {/* Viagem */}
          <div className="rounded-lg border border-border bg-card p-6 shadow">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              ✈️ Viagem
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="viagem-dias">Dias de Viagem</Label>
                <Input
                  id="viagem-dias"
                  type="number"
                  value={simulacoes.viagem.dias}
                  onChange={(e) =>
                    setSimulacoes((prev) => ({
                      ...prev,
                      viagem: { ...prev.viagem, dias: parseInt(e.target.value, 10) || 0 },
                    }))
                  }
                  min={0}
                />
              </div>
              <div>
                <Label htmlFor="viagem-gasto">Gasto por Dia (R$)</Label>
                <Input
                  id="viagem-gasto"
                  type="number"
                  value={simulacoes.viagem.gastoPorDia}
                  onChange={(e) =>
                    setSimulacoes((prev) => ({
                      ...prev,
                      viagem: {
                        ...prev.viagem,
                        gastoPorDia: parseFloat(e.target.value) || 0,
                      },
                    }))
                  }
                  min={0}
                  step={10}
                />
              </div>
              <div className="rounded bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
                <p className="text-muted-foreground">
                  Total da Viagem:{' '}
                  {formatCurrency(simulacoes.viagem.dias * simulacoes.viagem.gastoPorDia)}
                </p>
              </div>
            </div>
          </div>

          {/* Apartamento */}
          <div className="rounded-lg border border-border bg-card p-6 shadow">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              🏠 Aluguel/Apartamento
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="apto-valor">Valor (R$)</Label>
                <Input
                  id="apto-valor"
                  type="number"
                  value={simulacoes.apartamento.valor}
                  onChange={(e) =>
                    setSimulacoes((prev) => ({
                      ...prev,
                      apartamento: {
                        ...prev.apartamento,
                        valor: parseFloat(e.target.value) || 0,
                      },
                    }))
                  }
                  min={0}
                  step={100}
                />
              </div>
              <div>
                <Label htmlFor="apto-freq">Frequência</Label>
                <Select
                  value={simulacoes.apartamento.frequencia}
                  onValueChange={(value) =>
                    setSimulacoes((prev) => ({
                      ...prev,
                      apartamento: { ...prev.apartamento, frequencia: value },
                    }))
                  }
                >
                  <SelectTrigger id="apto-freq">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
                <p className="text-muted-foreground">
                  Impacto Mensal:{' '}
                  {formatCurrency(
                    simulacoes.apartamento.frequencia === 'mensal'
                      ? simulacoes.apartamento.valor
                      : simulacoes.apartamento.valor / 12
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Customizado */}
          <div className="rounded-lg border border-border bg-card p-6 shadow">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              💡 Gasto Customizado
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="custom-desc">Descrição</Label>
                <Input
                  id="custom-desc"
                  type="text"
                  value={simulacoes.customizado.descricao}
                  onChange={(e) =>
                    setSimulacoes((prev) => ({
                      ...prev,
                      customizado: { ...prev.customizado, descricao: e.target.value },
                    }))
                  }
                  placeholder="Ex: Compra de eletrônicos"
                />
              </div>
              <div>
                <Label htmlFor="custom-valor">Valor (R$)</Label>
                <Input
                  id="custom-valor"
                  type="number"
                  value={simulacoes.customizado.valor}
                  onChange={(e) =>
                    setSimulacoes((prev) => ({
                      ...prev,
                      customizado: { ...prev.customizado, valor: parseFloat(e.target.value) || 0 },
                    }))
                  }
                  min={0}
                  step={50}
                />
              </div>
            </div>
          </div>

          <Button onClick={calcularProjecao} className="w-full" size="lg">
            <TrendingUp className="mr-2" size={20} />
            Calcular Projeção
          </Button>
        </div>

        {/* Painel de Resultados */}
        <div className="space-y-6">
          <ChartCard
            title="Comparativo da projeção"
            description="Visualize a relação entre renda, gastos atuais e cenário projetado"
          >
            {projectionChartData.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Configure suas finanças para gerar a projeção.
              </div>
            ) : (
              <ResponsiveContainer height={260}>
                <BarChart data={projectionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      `R$ ${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                    }
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.15)' }}
                    content={<ChartTooltipContent valueFormatter={(value) => formatCurrency(value)} />}
                  />
                  <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                    {projectionChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={getChartColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {resultados ? (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">Resultado da Projeção</h2>

              {resultados.alerta && (
                <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                  <AlertCircle
                    size={24}
                    className="flex-shrink-0 text-red-600 dark:text-red-400"
                  />
                  <div>
                    <p className="font-semibold text-red-900 dark:text-red-300">⚠️ Alerta!</p>
                    <p className="text-sm text-red-800 dark:text-red-400">
                      Seus gastos representarão {resultados.percentualGasto}% da sua renda. Isso é
                      acima do recomendado (80%).
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-muted p-4">
                  <p className="mb-1 text-sm text-muted-foreground">Gastos Atuais</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(resultados.gastoAtual)}
                  </p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                  <p className="mb-1 text-sm text-muted-foreground">Gastos Simulados</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    +{formatCurrency(resultados.gastoSimulado)}
                  </p>
                </div>

                <div className="rounded-lg border-2 border-border bg-card p-4 sm:col-span-2">
                  <p className="mb-1 text-sm text-muted-foreground">Novo Gasto Total</p>
                  <p className="text-3xl font-bold text-foreground">
                    {formatCurrency(resultados.novoGastoTotal)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {resultados.percentualGasto}% da sua renda
                  </p>
                </div>

                <div
                  className={`rounded-lg border p-4 sm:col-span-2 ${
                    resultados.saldoProjectado >= 0
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                      : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  }`}
                >
                  <p className="mb-1 text-sm text-muted-foreground">Saldo Projetado</p>
                  <p
                    className={`text-3xl font-bold ${
                      resultados.saldoProjectado >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatCurrency(resultados.saldoProjectado)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {resultados.impacto}% de impacto na sua renda
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-gradient-to-br from-blue-50 to-purple-50 p-6 dark:from-blue-900/20 dark:to-purple-900/20">
                <h3 className="mb-3 font-semibold text-foreground">💡 Recomendação</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {resultados.saldoProjectado >= 0
                    ? `Você consegue fazer estes gastos! Sobrará ${formatCurrency(
                        resultados.saldoProjectado
                      )} após todos os gastos. Considere guardar uma parte como reserva.`
                    : `Você terá um déficit de ${formatCurrency(
                        Math.abs(resultados.saldoProjectado)
                      )}. Considere revisar os gastos simulados.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              Execute uma simulação para visualizar o impacto financeiro e receber recomendações
              personalizadas.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
