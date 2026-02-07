import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, TrendingUp, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChartCard } from '@/components/charts/ChartCard';
import { ChartTooltipContent } from '@/components/charts/ChartTooltip';
import { getChartColor } from '@/components/charts/chart-colors';
import { modernChartConfig } from '@/components/charts/modern-chart-config';
import { ModernPieChart } from '@/components/charts/ModernPieChart';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { MetricsCard } from '@/components/ui/metrics-card';
import { Progress } from '@/components/ui/progress';

// New Components
import { AssetTutorial } from '@/components/Assets/AssetTutorial';
import { AssetWizard } from '@/components/Assets/AssetWizard';
import { AssetDetails } from '@/components/Assets/AssetDetails';

export default function Assets() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [showTutorial, setShowTutorial] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const formatCurrency = (value: number | string) =>
    `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const parseNotes = (notes?: string | null) => {
    if (!notes) {
      return { statusFinanciamento: 'quitado', percentualPago: 100 };
    }
    try {
      const parsed = JSON.parse(notes);
      const status = parsed.statusFinanciamento ?? 'quitado';
      const percentual = Number(parsed.percentualPago ?? (status === 'quitado' ? 100 : 0));
      return {
        statusFinanciamento: status,
        percentualPago: Math.min(Math.max(percentual, 0), 100),
      };
    } catch (error) {
      return { statusFinanciamento: 'quitado', percentualPago: 100 };
    }
  };

  useEffect(() => {
    if (user) {
      loadAssets();
      // Check if user has assets, if not show tutorial eventually (optional logic)
    }
  }, [user]);

  const loadAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('investimentos')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('data_criacao', { ascending: false });

      if (error) throw error;

      const enhancedAssets = (data || []).map((asset) => ({
        ...asset,
        meta: parseNotes(asset.notas),
      }));

      setAssets(enhancedAssets);

      // Auto-show tutorial if no assets
      if (enhancedAssets.length === 0) {
        // Could add a check for 'tutorialSeen' in localStorage
        // setShowTutorial(true); 
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar ativos:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os ativos"
      });
      setLoading(false);
    }
  };

  const handleSaveAsset = async (assetData: any) => {
    const { status_financiamento, percentual_pago, ...data } = assetData;

    const { error } = await supabase
      .from('investimentos')
      .insert({
        user_id: user.id,
        ...data,
        notas: JSON.stringify({
          statusFinanciamento: status_financiamento,
          percentualPago: status_financiamento === 'quitado' ? 100 : percentual_pago,
        }),
      });

    if (error) throw error;

    toast({
      title: "Sucesso!",
      description: "Ativo adicionado com sucesso"
    });
    loadAssets();
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      const { error } = await supabase
        .from('investimentos')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Removido",
        description: "Ativo removido com sucesso"
      });

      loadAssets();
      setSelectedAsset(null); // Close details if open
    } catch (error) {
      console.error('Erro ao deletar ativo:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o ativo"
      });
    }
  };

  // Calculations
  const totalInvestido = useMemo(() => assets.reduce((sum, a) => sum + Number(a.valor_inicial || 0), 0), [assets]);
  const totalAtual = useMemo(() => assets.reduce((sum, a) => sum + Number(a.valor_atual || 0), 0), [assets]);
  const lucroTotal = totalAtual - totalInvestido;
  const rentabilidade = totalInvestido > 0 ? ((lucroTotal / totalInvestido) * 100).toFixed(2) : '0.00';

  const compositionChartData = useMemo(() => {
    const map = new Map<string, number>();
    assets.forEach((asset: any) => {
      const total = Number(asset.valor_atual || 0);
      const key = asset.tipo || 'outros';
      map.set(key, (map.get(key) ?? 0) + total);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [assets]);

  const statusChartData = useMemo(() => {
    const counts = new Map<string, number>();
    assets.forEach((asset: any) => {
      const status = asset.meta?.statusFinanciamento ?? 'quitado';
      counts.set(status, (counts.get(status) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .filter(([, total]) => total > 0)
      .map(([status, total]) => ({
        name: status === 'quitado' ? 'Quitados' : 'Financiando',
        value: total,
      }));
  }, [assets]);

  const performanceChartData = useMemo(() => {
    return assets.slice(0, 8).map((asset: any) => ({
      name: asset.nome,
      investido: Number(asset.valor_inicial || 0),
      atual: Number(asset.valor_atual || 0),
    }));
  }, [assets]);

  if (loading) {
    return (
      <AppLayout title="Patrimônios e ativos" description="Carregando...">
        <div className="text-center py-12 text-muted-foreground">Carregando seus ativos...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Patrimônios e ativos"
      description="Gerencie seus investimentos, acompanhe desempenho e situação de financiamento."
      actions={
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setShowTutorial(true)}>
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button onClick={() => setShowWizard(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Ativo
          </Button>
        </div>
      }
      contentClassName="w-full space-y-10"
    >
      {/* 1. Global Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricsCard
          title="Investido"
          value={formatCurrency(totalInvestido)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricsCard
          title="Valor Atual"
          value={formatCurrency(totalAtual)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricsCard
          title="Lucro/Prejuízo"
          value={formatCurrency(lucroTotal)}
          valueClassName={lucroTotal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricsCard
          title="Rentabilidade"
          value={`${rentabilidade}%`}
          valueClassName={Number(rentabilidade) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* 2. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <ChartCard
          title="Distribuição por tipo"
          description="Composição da sua carteira"
        >
          {compositionChartData.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Cadastre ativos para visualizar a distribuição.
            </div>
          ) : (
            <ModernPieChart
              data={compositionChartData.map((item) => ({
                name: item.name,
                value: item.value,
              }))}
              showLabels={true}
              valueFormatter={(value) => formatCurrency(value)}
              maxItems={8}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Situação dos ativos"
          description="Quitados vs. Em Financiamento"
        >
          {statusChartData.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhum dado disponível.
            </div>
          ) : (
            <ModernPieChart
              data={statusChartData.map((item) => ({
                name: item.name,
                value: item.value,
              }))}
              showLabels={true}
              valueFormatter={(value) => `${value} item(s)`}
            />
          )}
        </ChartCard>
      </div>

      {/* 3. Performance Bar Chart (if data exists) */}
      {performanceChartData.length > 0 && (
        <ChartCard
          title="Desempenho por ativo"
          description="Investido vs Atual (Top 8)"
        >
          <ResponsiveContainer height={320}>
            <BarChart data={performanceChartData}>
              <CartesianGrid {...modernChartConfig.grid} />
              <XAxis dataKey="name" {...modernChartConfig.xAxis} />
              <YAxis
                {...modernChartConfig.yAxis}
                tickFormatter={(value) =>
                  `R$ ${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                }
              />
              <Tooltip
                {...modernChartConfig.tooltip}
                content={
                  <ChartTooltipContent
                    valueFormatter={(value, key) =>
                      `${key === 'investido' ? 'Investido' : 'Valor atual'}: ${formatCurrency(value)}`
                    }
                  />
                }
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="rect"
              />
              <Bar
                dataKey="investido"
                name="Investido"
                radius={modernChartConfig.barRadius}
                fill={getChartColor(0)}
              />
              <Bar
                dataKey="atual"
                name="Valor atual"
                radius={modernChartConfig.barRadius}
                fill={getChartColor(2)}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* 4. Asset List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Seus ativos</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {assets.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground">
                <p>Você ainda não tem ativos cadastrados.</p>
                <Button variant="link" onClick={() => setShowWizard(true)}>
                  Clique aqui para começar
                </Button>
              </CardContent>
            </Card>
          ) : (
            assets.map((asset) => {
              const meta = asset.meta;
              const status = meta.statusFinanciamento;
              const percentual = meta.percentualPago;

              return (
                <Card
                  key={asset.id}
                  className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-primary"
                  onClick={() => setSelectedAsset(asset)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{asset.nome}</h3>
                          <span className="text-xs bg-muted px-2 py-1 rounded capitalize">{asset.tipo}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{asset.descricao}</p>
                      </div>

                      <div className="flex flex-col md:items-end gap-1">
                        <div className="font-bold text-xl">{formatCurrency(asset.valor_atual)}</div>
                        <div className="text-xs text-muted-foreground">
                          Investido: {formatCurrency(asset.valor_inicial)}
                        </div>
                      </div>
                    </div>

                    {status === 'financiando' && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progresso do Financiamento</span>
                          <span>{percentual}% Pago</span>
                        </div>
                        <Progress value={percentual} className="h-1.5" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Components / Dialogs */}
      <AssetTutorial
        open={showTutorial}
        onOpenChange={setShowTutorial}
      />

      <AssetWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        onSave={handleSaveAsset}
      />

      <AssetDetails
        open={!!selectedAsset}
        onOpenChange={(open) => !open && setSelectedAsset(null)}
        asset={selectedAsset}
        onDelete={handleDeleteAsset}
      />

    </AppLayout>
  );
}
