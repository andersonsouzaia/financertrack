import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, TrendingUp, Trash2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ChartCard } from '@/components/charts/ChartCard';
import { ChartTooltipContent } from '@/components/charts/ChartTooltip';
import { getChartColor } from '@/components/charts/chart-colors';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft } from 'lucide-react';

export default function Assets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatCurrency = (value: number | string) =>
    `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const defaultAssetForm = {
    nome: '',
    tipo: 'investimento',
    valor_inicial: 0,
    valor_atual: 0,
    taxa_rendimento: 0,
    descricao: '',
    status_financiamento: 'quitado',
    percentual_pago: 100,
  };

  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const [newAsset, setNewAsset] = useState(defaultAssetForm);
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

  const resetNewAssetForm = () => setNewAsset({ ...defaultAssetForm });
  const compositionChartData = useMemo(() => {
    const map = new Map<string, number>();
    assets.forEach((asset: any) => {
      const total = Number(asset.valor_atual || 0);
      const key = asset.tipo || 'outros';
      map.set(key, (map.get(key) ?? 0) + total);
    });
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
    }));
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

  const handleAddAsset = async () => {
    if (!newAsset.nome.trim()) {
      toast({
        variant: "destructive",
        title: "Informe um nome",
        description: "Dê um nome para o ativo."
      });
      return;
    }

    if (newAsset.status_financiamento === 'financiando' && (newAsset.percentual_pago < 0 || newAsset.percentual_pago > 100)) {
      toast({
        variant: "destructive",
        title: "Percentual inválido",
        description: "Informe um percentual pago entre 0% e 100%."
      });
      return;
    }

    try {
      const { status_financiamento, percentual_pago, ...assetData } = newAsset;

      const { error } = await supabase
        .from('investimentos')
        .insert({
          user_id: user.id,
          ...assetData,
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

      setShowAddDialog(false);
      resetNewAssetForm();
      loadAssets();
    } catch (error) {
      console.error('Erro ao adicionar ativo:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar o ativo"
      });
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este ativo?')) return;

    try {
      const { error } = await supabase
        .from('investimentos')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Ativo removido com sucesso"
      });

      loadAssets();
    } catch (error) {
      console.error('Erro ao deletar ativo:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o ativo"
      });
    }
  };

  const totalInvestido = useMemo(
    () => assets.reduce((sum, a) => sum + Number(a.valor_inicial || 0), 0),
    [assets]
  );
  const totalAtual = useMemo(
    () => assets.reduce((sum, a) => sum + Number(a.valor_atual || 0), 0),
    [assets]
  );
  const lucroTotal = totalAtual - totalInvestido;
  const rentabilidade = totalInvestido > 0 ? ((lucroTotal / totalInvestido) * 100).toFixed(2) : '0.00';

  const headerActions = (
    <Dialog
      open={showAddDialog}
      onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) {
          resetNewAssetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2" size={18} />
          Adicionar Ativo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Ativo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="nome">Nome do Ativo</Label>
            <Input
              id="nome"
              value={newAsset.nome}
              onChange={(e) => setNewAsset({ ...newAsset, nome: e.target.value })}
              placeholder="Ex: Tesouro Direto, Ações, Imóvel"
            />
          </div>

          <div>
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              value={newAsset.tipo}
              onValueChange={(value) => setNewAsset({ ...newAsset, tipo: value })}
            >
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="investimento">Investimento</SelectItem>
                <SelectItem value="imovel">Imóvel</SelectItem>
                <SelectItem value="veiculo">Veículo</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="valor_inicial">Valor Investido (R$)</Label>
            <Input
              id="valor_inicial"
              type="number"
              value={newAsset.valor_inicial}
              onChange={(e) => setNewAsset({ ...newAsset, valor_inicial: parseFloat(e.target.value) || 0 })}
              step="0.01"
            />
          </div>

          <div>
            <Label htmlFor="valor_atual">Valor Atual (R$)</Label>
            <Input
              id="valor_atual"
              type="number"
              value={newAsset.valor_atual}
              onChange={(e) => setNewAsset({ ...newAsset, valor_atual: parseFloat(e.target.value) || 0 })}
              step="0.01"
            />
          </div>

          <div>
            <Label htmlFor="taxa">Taxa de Rendimento (%)</Label>
            <Input
              id="taxa"
              type="number"
              value={newAsset.taxa_rendimento}
              onChange={(e) => setNewAsset({ ...newAsset, taxa_rendimento: parseFloat(e.target.value) || 0 })}
              step="0.01"
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição (Opcional)</Label>
            <Input
              id="descricao"
              value={newAsset.descricao || ''}
              onChange={(e) => setNewAsset({ ...newAsset, descricao: e.target.value })}
              placeholder="Detalhes sobre o ativo"
            />
          </div>

          <div>
            <Label>Situação do ativo</Label>
            <Select
              value={newAsset.status_financiamento}
              onValueChange={(value) =>
                setNewAsset((prev) => ({
                  ...prev,
                  status_financiamento: value,
                  percentual_pago: value === 'quitado' ? 100 : Math.min(prev.percentual_pago, 100),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quitado">Quitado</SelectItem>
                <SelectItem value="financiando">Em financiamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newAsset.status_financiamento === 'financiando' && (
            <div>
              <Label htmlFor="percentual_pago">Percentual pago (%)</Label>
              <Input
                id="percentual_pago"
                type="number"
                min={0}
                max={100}
                value={newAsset.percentual_pago}
                onChange={(e) =>
                  setNewAsset({
                    ...newAsset,
                    percentual_pago: Number(e.target.value),
                  })
                }
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleAddAsset} disabled={false} className="w-full">
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <AppLayout
        title="Patrimônios e ativos"
        description="Acompanhe seus bens e investimentos em um só lugar."
        actions={headerActions}
      >
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Carregando informações dos ativos...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Patrimônios e ativos"
      description="Gerencie seus investimentos, acompanhe desempenho e situação de financiamento."
      actions={headerActions}
      contentClassName="mx-auto max-w-6xl w-full space-y-8"
    >
      {/* Resumo geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Investido</CardTitle>
          </CardHeader>
          <div className="p-6">
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(totalInvestido)}
            </p>
          </div>
        </Card>

        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Valor Atual</CardTitle>
          </CardHeader>
          <div className="p-6">
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(totalAtual)}
            </p>
          </div>
        </Card>

        <Card className={`border ${
          lucroTotal >= 0
            ? 'border-green-200 dark:border-green-800'
            : 'border-red-200 dark:border-red-800'
        }`}>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Lucro/Prejuízo</CardTitle>
          </CardHeader>
          <div className="p-6">
            <p className={`text-2xl font-bold ${
              lucroTotal >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(lucroTotal)}
            </p>
          </div>
        </Card>

        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp size={16} />
              Rentabilidade
            </CardTitle>
          </CardHeader>
          <div className="p-6">
            <p className={`text-2xl font-bold ${
              Number(rentabilidade) >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {rentabilidade}%
            </p>
          </div>
        </Card>
      </div>

      {/* Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Distribuição por tipo"
          description="Visualize como seus ativos estão distribuídos"
        >
          {compositionChartData.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Cadastre ativos para visualizar a distribuição do portfólio.
            </div>
          ) : (
            <>
              <ResponsiveContainer height={260}>
                <PieChart>
                  <Pie
                    data={compositionChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                  >
                    {compositionChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={getChartColor(index)} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.15)' }}
                    content={
                      <ChartTooltipContent valueFormatter={(value) => formatCurrency(value)} />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {compositionChartData.slice(0, 5).map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: getChartColor(index) }}
                      />
                      <span className="font-medium text-foreground capitalize">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-semibold text-muted-foreground">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>

        <ChartCard
          title="Situação dos ativos"
          description="Quantidade de patrimônios quitados e em financiamento"
        >
          {statusChartData.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhum ativo cadastrado até o momento.
            </div>
          ) : (
            <ResponsiveContainer height={260}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  label
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={entry.name} fill={getChartColor(index)} />
                  ))}
                </Pie>
                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.15)' }}
                  content={
                    <ChartTooltipContent
                      valueFormatter={(value) => `${value} ${value === 1 ? 'ativo' : 'ativos'}`}
                    />
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Desempenho por ativo */}
      <ChartCard
        title="Desempenho por ativo"
        description="Comparativo entre o valor investido e o valor atual"
        className="mb-8"
      >
        {performanceChartData.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Cadastre ativos para acompanhar sua evolução.
          </div>
        ) : (
          <ResponsiveContainer height={280}>
            <BarChart data={performanceChartData}>
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
                content={
                  <ChartTooltipContent
                    valueFormatter={(value, key) =>
                      `${key === 'investido' ? 'Investido' : 'Valor atual'}: ${formatCurrency(value)}`
                    }
                  />
                }
              />
              <Bar dataKey="investido" name="Investido" radius={[6, 6, 0, 0]} fill={getChartColor(0)} />
              <Bar dataKey="atual" name="Valor atual" radius={[6, 6, 0, 0]} fill={getChartColor(2)} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Lista de ativos */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Seus ativos</h2>
          <Button variant="outline" size="sm" onClick={loadAssets} className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {assets.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>Nenhum ativo cadastrado ainda.</p>
            <p className="text-sm mt-2">Clique em "Adicionar Ativo" para começar.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {assets.map(asset => {
              const lucro = Number(asset.valor_atual || 0) - Number(asset.valor_inicial || 0);
              const rentabilidadeItem = Number(asset.valor_inicial || 0) > 0
                ? ((lucro / Number(asset.valor_inicial || 0)) * 100).toFixed(2)
                : '0.00';
              const meta = asset.meta ?? { statusFinanciamento: 'quitado', percentualPago: 100 };
              const status = meta.statusFinanciamento ?? 'quitado';
              const percentualPago = Math.min(
                Math.max(Number(meta.percentualPago ?? (status === 'quitado' ? 100 : 0)), 0),
                100
              );
              const statusLabel = status === 'quitado'
                ? 'Quitado'
                : `Financiando • ${percentualPago}% pago`;
              const statusClasses = status === 'quitado'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300';

              return (
                <div key={asset.id} className="p-6 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {asset.nome}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded capitalize">
                          {asset.tipo}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${statusClasses}`}>
                          {statusLabel}
                        </span>
                      </div>

                      {asset.descricao && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {asset.descricao}
                        </p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Investido</p>
                          <p className="text-sm font-medium text-foreground">
                            {formatCurrency(asset.valor_inicial)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Valor Atual</p>
                          <p className="text-sm font-medium text-foreground">
                            {formatCurrency(asset.valor_atual)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Lucro/Prejuízo</p>
                          <p className={`text-sm font-medium ${
                            lucro >= 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {formatCurrency(lucro)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Rentabilidade</p>
                          <p className={`text-sm font-medium ${
                            Number(rentabilidadeItem) >= 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {rentabilidadeItem}%
                          </p>
                        </div>
                      </div>

                      {status === 'financiando' && (
                        <div className="mt-4">
                          <p className="text-xs text-muted-foreground mb-1">Progresso do financiamento</p>
                          <Progress value={percentualPago} className="h-2" />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAsset(asset.id)}
                      >
                        <Trash2 size={18} className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
