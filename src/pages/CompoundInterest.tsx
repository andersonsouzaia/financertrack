import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { calcularJurosCompostos } from '@/lib/compoundInterest';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartCard } from '@/components/charts/ChartCard';
import { ChartTooltipContent } from '@/components/charts/ChartTooltip';
import { Save, Calculator } from 'lucide-react';
import { SaveSimulationDialog } from '@/components/calculator/SaveSimulationDialog';
import { SavedSimulations } from '@/components/calculator/SavedSimulations';


export default function CompoundInterest() {
  const [valorInicial, setValorInicial] = useState(0);
  const [aporteMensal, setAporteMensal] = useState(0);
  const [taxaMensal, setTaxaMensal] = useState(0);
  const [meses, setMeses] = useState(12);
  const [resultado, setResultado] = useState<any>(null);





  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCalcular = () => {
    if (taxaMensal < 0 || meses < 1) {
      return;
    }

    const calc = calcularJurosCompostos(valorInicial, aporteMensal, taxaMensal, meses);
    setResultado(calc);
  };

  const handleLoadSimulation = (data: {
    valorInicial: number;
    aporteMensal: number;
    taxaMensal: number;
    meses: number;
  }) => {
    setValorInicial(data.valorInicial);
    setAporteMensal(data.aporteMensal);
    setTaxaMensal(data.taxaMensal);
    setMeses(data.meses);
    // Automaticamente recalcular ao carregar
    const calc = calcularJurosCompostos(
      data.valorInicial,
      data.aporteMensal,
      data.taxaMensal,
      data.meses
    );
    setResultado(calc);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const chartData = resultado?.evolucao.map((item: any) => ({
    mes: item.mes,
    montante: item.montante,
    investido: item.valorInicial + item.aporte * item.mes,
  })) || [];

  return (
    <AppLayout
      title="Calculadora de Juros Compostos"
      description="Calcule o crescimento do seu investimento com juros compostos"
    >
      <div className="w-full grid grid-cols-1 xl:grid-cols-4 gap-8">

        {/* Sidebar com as simulações salvas */}
        <div className="xl:col-span-1 order-2 xl:order-1">
          <SavedSimulations
            onLoadSimulation={handleLoadSimulation}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Área Principal */}
        <div className="xl:col-span-3 order-1 xl:order-2 space-y-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulário */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Parâmetros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="valorInicial">Valor Inicial (R$)</Label>
                  <Input
                    id="valorInicial"
                    type="number"
                    step="0.01"
                    value={valorInicial}
                    onChange={(e) => setValorInicial(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aporteMensal">Aporte Mensal (R$)</Label>
                  <Input
                    id="aporteMensal"
                    type="number"
                    step="0.01"
                    value={aporteMensal}
                    onChange={(e) => setAporteMensal(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxaMensal">Taxa de Juros Mensal (%)</Label>
                  <Input
                    id="taxaMensal"
                    type="number"
                    step="0.01"
                    value={taxaMensal}
                    onChange={(e) => setTaxaMensal(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meses">Período (meses)</Label>
                  <Input
                    id="meses"
                    type="number"
                    min="1"
                    value={meses}
                    onChange={(e) => setMeses(parseInt(e.target.value) || 12)}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleCalcular} className="flex-1" size="lg">
                    Calcular
                  </Button>
                  {resultado && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setSaveDialogOpen(true)}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Salvar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resultados */}
            {resultado && (
              <Card className="border-border/50 shadow-sm bg-muted/10">
                <CardHeader>
                  <CardTitle className="text-xl">Resultados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="p-4 rounded-lg bg-background border border-border shadow-sm">
                      <p className="text-sm text-muted-foreground mb-1">Montante Final</p>
                      <p className="text-3xl font-bold text-primary">{formatCurrency(resultado.montanteFinal)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-background border border-border/50">
                        <p className="text-xs text-muted-foreground mb-1">Total Investido</p>
                        <p className="text-lg font-semibold">{formatCurrency(resultado.totalInvestido)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background border border-border/50">
                        <p className="text-xs text-muted-foreground mb-1">Total em Juros</p>
                        <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(resultado.totalJuros)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Gráfico */}
          {resultado && chartData.length > 0 && (
            <ChartCard title="Evolução do Investimento">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                  />
                  <Tooltip
                    content={<ChartTooltipContent valueFormatter={(value) => formatCurrency(value)} />}
                    cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '5 5' }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                  <Line
                    type="monotone"
                    dataKey="montante"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                    name="Montante Total"
                  />
                  <Line
                    type="monotone"
                    dataKey="investido"
                    stroke="hsl(var(--accent))"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: 'hsl(var(--accent))' }}
                    name="Total Investido"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      </div>

      <SaveSimulationDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        simulationData={{
          valorInicial,
          aporteMensal,
          taxaMensal,
          meses
        }}
        onSuccess={() => setRefreshTrigger(prev => prev + 1)}
      />
    </AppLayout>
  );
}
