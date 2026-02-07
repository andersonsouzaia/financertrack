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
      className="shadow-card-hover border-l-4 border-l-primary h-full flex flex-col justify-between group cursor-pointer transition-all duration-300 hover:bg-muted/30 hover:border-l-primary/80 border border-border/50"
      onClick={() => navigate('/transactions')}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="p-1 rounded-md bg-primary/10 text-primary">
            <TrendingUp className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
          </div>
          Fluxo do Mês
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        {loading ? (
          <div className="space-y-4 animate-pulse flex-grow">
            <div className="h-10 bg-muted/50 rounded-lg" />
            <div className="h-10 bg-muted/50 rounded-lg" />
            <div className="h-10 bg-muted/50 rounded-lg" />
            <div className="h-10 bg-muted/50 rounded-lg" />
          </div>
        ) : (
          <div className="space-y-4 flex-grow flex flex-col justify-between">
            <div className="space-y-2">
              {/* Receitas */}
              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-500/5 transition-colors border border-transparent hover:border-emerald-500/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground/80">Receitas</span>
                </div>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(entradas)}</span>
              </div>

              {/* Cartão */}
              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-500/5 transition-colors border border-transparent hover:border-blue-500/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground/80">Cartão</span>
                </div>
                <span className="text-sm font-black text-blue-600 dark:text-blue-400">{formatCurrency(cartao)}</span>
              </div>

              {/* Saídas */}
              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-rose-500/5 transition-colors border border-transparent hover:border-rose-500/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <TrendingUp className="h-4 w-4 rotate-180" />
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground/80">Saídas</span>
                </div>
                <span className="text-sm font-black text-rose-600 dark:text-rose-400">{formatCurrency(saidas)}</span>
              </div>
            </div>

            <div className="pt-4 mt-auto">
              <div className={`p-4 rounded-2xl border flex flex-col gap-1 transition-all shadow-sm ${saldoMes >= 0
                ? 'bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/5'
                : 'bg-rose-500/5 border-rose-500/20 shadow-rose-500/5'
                }`}>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                  Resultado Líquido
                </span>
                <div className="flex items-baseline justify-between">
                  <span
                    className={`text-2xl font-black tracking-tight ${saldoMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                  >
                    {formatCurrency(saldoMes)}
                  </span>
                  {saldoMes >= 0 ? (
                    <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/50 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
                      Superávit
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-600/70 dark:text-rose-400/50 uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/10">
                      Déficit
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
