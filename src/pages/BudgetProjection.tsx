import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MetricsCard } from '@/components/ui/metrics-card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SavedProjections } from '@/components/BudgetProjection/SavedProjections';
import {
  ProjectionData,
  defaultProjectionData,
  ProjectionType
} from '@/components/BudgetProjection/ProjectionTypes';
import { BusinessProjection } from '@/components/BudgetProjection/BusinessProjection';
import { RetirementProjection } from '@/components/BudgetProjection/RetirementProjection';
import { PropertyProjection } from '@/components/BudgetProjection/PropertyProjection';
import { EducationProjection } from '@/components/BudgetProjection/EducationProjection';

export default function BudgetProjection() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gastosPorCategoria, setGastosPorCategoria] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<ProjectionType>('viagem');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Simulações State
  const [simulacoes, setSimulacoes] = useState<ProjectionData>(defaultProjectionData);

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

  const handleLoadProjection = (data: ProjectionData) => {
    // Merge loaded data with default data to ensure all fields exist
    // This handles cases where older saves might miss new fields
    setSimulacoes({ ...defaultProjectionData, ...data });

    // Auto-calculate after loading
    // We need a short timeout or useEffect to ensure state is updated, 
    // but calling directly works if we use the 'data' passed in
    // setTimeout(() => calcularProjecao(), 100);
  };

  const calcularProjecao = () => {
    let gastoSimulado = 0;

    // Calcular baseado na aba ativa ou somar tudo? 
    // Por enquanto, vamos calcular APENAS a aba ativa para focar na simulação específica,
    // ou podemos somar tudo se a ideia for um planejamento global.
    // O requisito diz "cada categoria, completa de dados".
    // Vamos somar TUDO para ver o impacto global se o usuário preencher várias abas.

    // Viagem
    gastoSimulado += simulacoes.viagem.dias * simulacoes.viagem.gastoPorDia;

    // Apartamento
    if (simulacoes.apartamento.frequencia === 'mensal') {
      gastoSimulado += simulacoes.apartamento.valor;
    } else if (simulacoes.apartamento.frequencia === 'anual') {
      gastoSimulado += simulacoes.apartamento.valor / 12;
    }

    // Negócio (Projeção de custo mensal recorrente + investimento diluído em 12 meses para impacto anual?)
    // Vamos considerar o custo mensal + 1/12 do investimento inicial como impacto mensal no primeiro ano
    gastoSimulado += simulacoes.negocio.custoMensal;
    // (Opcional: adicionar investimento inicial diluído?)

    // Aposentadoria (Contribuição mensal)
    gastoSimulado += simulacoes.aposentadoria.contribuicaoMensal;

    // Imóvel (Parcela estimada seria melhor calcular aqui, mas vamos simplificar usando um campo de valor mensal se houvesse,
    // ou calculando on-the-fly. Para simplificar, vamos assumir que o usuário deve ver o impacto da parcela.)
    // Como PropertyProjection calcula a parcela internamente, idealmente deveríamos ter esse valor no estado.
    // Vamos recalcular aqui a parcela Price para somar:
    const valorFinanciadoImovel = simulacoes.imovel.valorImovel - simulacoes.imovel.entrada;
    if (valorFinanciadoImovel > 0 && simulacoes.imovel.prazoAnos > 0) {
      const taxaMensal = (simulacoes.imovel.taxaJurosAnual / 100) / 12;
      const meses = simulacoes.imovel.prazoAnos * 12;
      if (taxaMensal > 0) {
        const parcela = valorFinanciadoImovel * (taxaMensal * Math.pow(1 + taxaMensal, meses)) / (Math.pow(1 + taxaMensal, meses) - 1);
        gastoSimulado += parcela;
      } else {
        gastoSimulado += valorFinanciadoImovel / meses;
      }
    }

    // Educaçao (Mensalidade)
    gastoSimulado += simulacoes.educacao.mensalidade;
    // Adicionar 1/12 do material anual
    gastoSimulado += simulacoes.educacao.materialAnual / 12;

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
        description="Carregando..."
        actions={headerActions}
      >
        <div className="flex justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Projeção de Orçamento"
      description="Simule cenários futuros (viagens, negócios, aposentadoria) e veja o impacto financeiro."
      actions={headerActions}
      contentClassName="w-full space-y-8"
    >
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

        {/* Sidebar Saved Projections */}
        <div className="xl:col-span-1 order-2 xl:order-1">
          <SavedProjections
            onLoadProjection={handleLoadProjection}
            currentProjectionData={simulacoes}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Main Content */}
        <div className="xl:col-span-3 order-1 xl:order-2 space-y-8">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProjectionType)} className="w-full">
            <TabsList className="w-full flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
              <TabsTrigger value="viagem" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border/50">✈️ Viagem</TabsTrigger>
              <TabsTrigger value="apartamento" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border/50">🏠 Aluguel</TabsTrigger>
              <TabsTrigger value="negocio" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border/50">💼 Negócio</TabsTrigger>
              <TabsTrigger value="aposentadoria" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border/50">🏖️ Aposentadoria</TabsTrigger>
              <TabsTrigger value="imovel" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border/50">🏢 Imóvel</TabsTrigger>
              <TabsTrigger value="educacao" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border/50">🎓 Educação</TabsTrigger>
              <TabsTrigger value="customizado" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border/50">💡 Custom</TabsTrigger>
            </TabsList>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Area */}
              <div className="space-y-6">
                <TabsContent value="viagem" className="mt-0">
                  <Card className="border-border/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">✈️ Planejar Viagem</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Dias de Viagem</Label>
                        <Input
                          type="number"
                          value={simulacoes.viagem.dias}
                          onChange={(e) => setSimulacoes(prev => ({ ...prev, viagem: { ...prev.viagem, dias: parseInt(e.target.value) || 0 } }))}
                        />
                      </div>
                      <div>
                        <Label>Gasto por Dia (R$)</Label>
                        <Input
                          type="number"
                          value={simulacoes.viagem.gastoPorDia}
                          onChange={(e) => setSimulacoes(prev => ({ ...prev, viagem: { ...prev.viagem, gastoPorDia: parseFloat(e.target.value) || 0 } }))}
                        />
                      </div>
                      <div className="p-3 bg-muted rounded text-sm">
                        Total: {formatCurrency(simulacoes.viagem.dias * simulacoes.viagem.gastoPorDia)}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="apartamento" className="mt-0">
                  <Card className="border-border/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">🏠 Aluguel/Moradia</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Valor do Aluguel (R$)</Label>
                        <Input
                          type="number"
                          value={simulacoes.apartamento.valor}
                          onChange={(e) => setSimulacoes(prev => ({ ...prev, apartamento: { ...prev.apartamento, valor: parseFloat(e.target.value) || 0 } }))}
                        />
                      </div>
                      <div>
                        <Label>Frequência</Label>
                        <Select
                          value={simulacoes.apartamento.frequencia}
                          onValueChange={(v: 'mensal' | 'anual') => setSimulacoes(prev => ({ ...prev, apartamento: { ...prev.apartamento, frequencia: v } }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mensal">Mensal</SelectItem>
                            <SelectItem value="anual">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="negocio" className="mt-0">
                  <BusinessProjection
                    data={simulacoes.negocio}
                    onChange={(data) => setSimulacoes(prev => ({ ...prev, negocio: data }))}
                  />
                </TabsContent>

                <TabsContent value="aposentadoria" className="mt-0">
                  <RetirementProjection
                    data={simulacoes.aposentadoria}
                    onChange={(data) => setSimulacoes(prev => ({ ...prev, aposentadoria: data }))}
                  />
                </TabsContent>

                <TabsContent value="imovel" className="mt-0">
                  <PropertyProjection
                    data={simulacoes.imovel}
                    onChange={(data) => setSimulacoes(prev => ({ ...prev, imovel: data }))}
                  />
                </TabsContent>

                <TabsContent value="educacao" className="mt-0">
                  <EducationProjection
                    data={simulacoes.educacao}
                    onChange={(data) => setSimulacoes(prev => ({ ...prev, educacao: data }))}
                  />
                </TabsContent>

                <TabsContent value="customizado" className="mt-0">
                  <Card className="border-border/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">💡 Gasto Customizado</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Descrição</Label>
                        <Input
                          value={simulacoes.customizado.descricao}
                          onChange={(e) => setSimulacoes(prev => ({ ...prev, customizado: { ...prev.customizado, descricao: e.target.value } }))}
                        />
                      </div>
                      <div>
                        <Label>Valor Mensal (R$)</Label>
                        <Input
                          type="number"
                          value={simulacoes.customizado.valor}
                          onChange={(e) => setSimulacoes(prev => ({ ...prev, customizado: { ...prev.customizado, valor: parseFloat(e.target.value) || 0 } }))}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <Button onClick={calcularProjecao} className="w-full" size="lg">
                  <TrendingUp className="mr-2" size={20} />
                  Calcular Impacto Total
                </Button>
              </div>

              {/* Results Area */}
              <div className="space-y-8">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">Resultados</h2>
                  <p className="text-sm text-muted-foreground">Impacto financeiro acumulado de todas as simulações</p>
                </div>

                <ChartCard title="Comparativo">
                  {projectionChartData.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      Configure a simulação e clique em Calcular.
                    </div>
                  ) : (
                    <ResponsiveContainer height={300}>
                      <BarChart data={projectionChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`} />
                        <Tooltip content={<ChartTooltipContent valueFormatter={(value) => formatCurrency(value)} />} />
                        <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                          {projectionChartData.map((entry, index) => (
                            <Cell key={entry.name} fill={getChartColor(index)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                {resultados && (
                  <div className="space-y-6">
                    {resultados.alerta && (
                      <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                        <AlertCircle size={24} className="flex-shrink-0 text-red-600 dark:text-red-400" />
                        <div>
                          <p className="font-semibold text-red-900 dark:text-red-300">Atenção!</p>
                          <p className="text-sm text-red-800 dark:text-red-400">
                            Seus gastos projetados comprometem {resultados.percentualGasto}% da sua renda.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4 grid-cols-2">
                      <MetricsCard title="Gasto Adicional" value={formatCurrency(resultados.gastoSimulado)} valueClassName="text-emerald-600" />
                      <MetricsCard title="Novo Total" value={formatCurrency(resultados.novoGastoTotal)} />
                      <div className="col-span-2">
                        <MetricsCard
                          title="Saldo Restante"
                          value={formatCurrency(resultados.saldoProjectado)}
                          description="Após todos os gastos"
                          valueClassName={resultados.saldoProjectado >= 0 ? "text-green-600" : "text-red-600"}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
