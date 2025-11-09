import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, TrendingUp, AlertCircle } from 'lucide-react';
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
    const rendaMensal = config?.renda_mensal || 0;
    const gastoAtualTotal = Object.values(gastosPorCategoria).reduce((a, b) => a + b, 0);

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
    const percentualGasto = (novoGastoTotal / rendaMensal * 100).toFixed(1);

    setResultados({
      gastoAtual: gastoAtualTotal,
      gastoSimulado: gastoSimulado,
      novoGastoTotal: novoGastoTotal,
      saldoProjectado: saldoProjectado,
      percentualGasto: percentualGasto,
      impacto: ((saldoProjectado / rendaMensal) * 100).toFixed(1),
      alerta: parseFloat(percentualGasto) > 80
    });
  };

  if (loading) return <div className="text-center p-8 text-foreground">Carregando...</div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Projeção de Orçamento
            </h1>
            <p className="text-muted-foreground">
              Simule gastos e veja o impacto no seu orçamento
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Painel de Simulação */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Simular Gastos</h2>

            {/* Viagem */}
            <div className="bg-card p-6 rounded-lg shadow border border-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
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
                      setSimulacoes(prev => ({
                        ...prev,
                        viagem: { ...prev.viagem, dias: parseInt(e.target.value) || 0 }
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
                      setSimulacoes(prev => ({
                        ...prev,
                        viagem: { ...prev.viagem, gastoPorDia: parseFloat(e.target.value) || 0 }
                      }))
                    }
                    min={0}
                    step={10}
                  />
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm">
                  <p className="text-muted-foreground">
                    Total da Viagem: R$ {(simulacoes.viagem.dias * simulacoes.viagem.gastoPorDia).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Apartamento */}
            <div className="bg-card p-6 rounded-lg shadow border border-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
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
                      setSimulacoes(prev => ({
                        ...prev,
                        apartamento: { ...prev.apartamento, valor: parseFloat(e.target.value) || 0 }
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
                      setSimulacoes(prev => ({
                        ...prev,
                        apartamento: { ...prev.apartamento, frequencia: value }
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
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm">
                  <p className="text-muted-foreground">
                    Impacto Mensal: R$ {(
                      simulacoes.apartamento.frequencia === 'mensal'
                        ? simulacoes.apartamento.valor
                        : simulacoes.apartamento.valor / 12
                    ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Customizado */}
            <div className="bg-card p-6 rounded-lg shadow border border-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
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
                      setSimulacoes(prev => ({
                        ...prev,
                        customizado: { ...prev.customizado, descricao: e.target.value }
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
                      setSimulacoes(prev => ({
                        ...prev,
                        customizado: { ...prev.customizado, valor: parseFloat(e.target.value) || 0 }
                      }))
                    }
                    min={0}
                    step={50}
                  />
                </div>
              </div>
            </div>

            {/* Botão Calcular */}
            <Button
              onClick={calcularProjecao}
              className="w-full"
              size="lg"
            >
              <TrendingUp className="mr-2" size={20} />
              Calcular Projeção
            </Button>
          </div>

          {/* Painel de Resultados */}
          {resultados && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">Resultado da Projeção</h2>

              {/* Alerta */}
              {resultados.alerta && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex gap-3 border border-red-200 dark:border-red-800">
                  <AlertCircle size={24} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-900 dark:text-red-300">⚠️ Alerta!</p>
                    <p className="text-sm text-red-800 dark:text-red-400">
                      Seus gastos representarão {resultados.percentualGasto}% da sua renda. Isso é acima do recomendado (80%).
                    </p>
                  </div>
                </div>
              )}

              {/* Cards de Resultado */}
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Gastos Atuais</p>
                  <p className="text-2xl font-bold text-foreground">
                    R$ {resultados.gastoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-muted-foreground mb-1">Gastos Simulados</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    +R$ {resultados.gastoSimulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="border-2 border-border p-4 rounded-lg bg-card">
                  <p className="text-sm text-muted-foreground mb-1">Novo Gasto Total</p>
                  <p className="text-3xl font-bold text-foreground">
                    R$ {resultados.novoGastoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {resultados.percentualGasto}% da sua renda
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${
                  resultados.saldoProjectado >= 0
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <p className="text-sm text-muted-foreground mb-1">Saldo Projetado</p>
                  <p className={`text-3xl font-bold ${
                    resultados.saldoProjectado >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    R$ {resultados.saldoProjectado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {resultados.impacto}% de impacto na sua renda
                  </p>
                </div>
              </div>

              {/* Recomendação */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-3">💡 Recomendação</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {resultados.saldoProjectado >= 0
                    ? `Você consegue fazer estes gastos! Sobrará R$ ${resultados.saldoProjectado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} após todos os gastos. Considere guardar uma parte como reserva.`
                    : `Você terá um déficit de R$ ${Math.abs(resultados.saldoProjectado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Considere revisar os gastos simulados.`
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
