import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const formatCurrency = (value) =>
  `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export function MonthSummaryCard({ month }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [entradas, setEntradas] = useState(0);
  const [saidas, setSaidas] = useState(0);
  const [cartao, setCartao] = useState(0);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!user || !month?.id) return;

      setLoading(true);
      try {
        // Buscar transações (entradas e saídas manuais/fixas)
        const { data: transacoesData, error: transError } = await supabase
          .from('transacoes')
          .select('tipo, valor_original, cartao_id')
          .eq('user_id', user.id)
          .eq('mes_financeiro_id', month.id)
          .eq('deletado', false);

        if (transError) throw transError;

        // Buscar faturas de cartão do mês (ex: 2026-02)
        // Opcional: Se quisermos o total *faturado*, usaríamos faturas_cartoes.
        // Mas para "fluxo em tempo real", vamos somar transações com cartao_id.
        // O código abaixo soma transacoesData, então não precisamos da query extra de faturas_cartoes
        // a menos que queiramos exibir algo específico de faturas fechadas.
        // Vou manter a lógica de somar transações por enquanto para consistência com o que estava antes.

        let totalEntradas = 0;
        let totalSaidas = 0; // Saídas sem cartão (dinheiro, débito, pix)
        let totalCartao = 0;

        transacoesData?.forEach((transacao) => {
          const valor = Number(transacao.valor_original || 0);

          if (transacao.tipo === 'entrada') {
            totalEntradas += valor;
          } else if (transacao.cartao_id) {
            // É uma despesa de cartão
            totalCartao += valor;
          } else {
            // Saída conta corrente/dinheiro
            totalSaidas += valor;
          }
        });

        setEntradas(totalEntradas);
        setSaidas(totalSaidas);
        setCartao(totalCartao);
      } catch (err) {
        console.error('Erro ao carregar resumo mensal:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();

    const channel = supabase
      .channel('month-summary-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transacoes', filter: `mes_financeiro_id=eq.${month?.id}` },
        () => fetchSummary()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, month?.id]);

  // Resultado = Entradas - (Saídas + Cartão)
  const saldoMes = entradas - (saidas + cartao);

  return (
    <Card
      className="shadow-card-hover border-l-4 border-l-primary h-full flex flex-col justify-between group cursor-pointer transition-all hover:bg-muted/50"
      onClick={() => navigate('/transactions')}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <TrendingUp className="h-4 w-4 transition-transform group-hover:scale-110" />
          Fluxo do Mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-muted/50 rounded-lg" />
            <div className="h-10 bg-muted/50 rounded-lg" />
            <div className="h-10 bg-muted/50 rounded-lg" />
            <div className="h-10 bg-muted/50 rounded-lg" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Receitas */}
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-background transition-colors">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                </div>
                <span className="text-sm font-medium">Receitas</span>
              </div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(entradas)}</span>
            </div>

            {/* Cartão */}
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-background transition-colors">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <CreditCard className="h-3 w-3" />
                </div>
                <span className="text-sm font-medium">Cartão</span>
              </div>
              <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(cartao)}</span>
            </div>

            {/* Saídas */}
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-background transition-colors">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                  <TrendingUp className="h-3 w-3 rotate-180" />
                </div>
                <span className="text-sm font-medium">Saídas</span>
              </div>
              <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(saidas)}</span>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-end justify-between p-2">
                <span className="text-sm font-medium text-muted-foreground mb-1">Resultado</span>
                <span
                  className={`text-xl font-bold tracking-tight ${saldoMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}
                >
                  {formatCurrency(saldoMes)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
