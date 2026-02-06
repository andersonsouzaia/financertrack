import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightCircle, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function TransactionsPreview({ month }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!user || !month) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('transacoes')
          .select(`
            id,
            descricao,
            tipo,
            valor_original,
            dia,
            categoria:categorias_saidas(nome, icone)
          `)
          .eq('mes_financeiro_id', month.id)
          .eq('deletado', false)
          .order('dia', { ascending: false })
          .limit(6);

        setTransactions(data || []);
      } catch (error) {
        console.error('Erro ao carregar preview de transações:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, month?.id]);

  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, transacao) => {
        const valor = Number(transacao.valor_original) || 0;
        if (transacao.tipo === 'entrada') {
          acc.entradas += valor;
        } else if (transacao.tipo === 'saida_fixa') {
          acc.saidas += valor;
        } else {
          acc.diario += valor;
        }
        acc.saldo = acc.entradas - acc.saidas - acc.diario;
        return acc;
      },
      { entradas: 0, saidas: 0, diario: 0, saldo: 0 }
    );
  }, [transactions]);

  return (
    <Card className="group border-border/50 bg-background/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
            Movimentações Recentes
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1.5">
            Últimos lançamentos deste mês
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 group/btn transition-all duration-300 hover:bg-primary/10" 
          onClick={() => navigate('/transactions')}
        >
          Ver todas
          <ArrowRightCircle className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-16 w-full animate-pulse rounded-lg bg-muted/50" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-border/50 bg-muted/20 p-8 text-center">
            <Wallet className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              Nenhuma transação registrada ainda
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Adicione sua primeira transação usando o botão acima
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction, idx) => {
              const isEntrada = transaction.tipo === 'entrada';
              return (
                <div
                  key={transaction.id}
                  className={cn(
                    "group/item flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-muted/30 hover:shadow-sm",
                    "animate-fade-in-tasko"
                  )}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-300 group-hover/item:scale-110",
                      isEntrada 
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" 
                        : "bg-red-500/15 text-red-600 dark:text-red-400"
                    )}>
                      {isEntrada ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {transaction.categoria?.icone && (
                          <span className="mr-1.5">{transaction.categoria.icone}</span>
                        )}
                        {transaction.descricao}
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        Dia {transaction.dia} · {transaction.tipo === 'entrada' ? 'Entrada' : transaction.tipo === 'saida_fixa' ? 'Saída Fixa' : 'Gasto Diário'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-base font-bold tabular-nums ml-4 shrink-0",
                      isEntrada 
                        ? "text-emerald-600 dark:text-emerald-400" 
                        : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {isEntrada ? '+' : '-'} R${' '}
                    {Number(transaction.valor_original).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="group/summary rounded-lg border border-border/50 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent p-4 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entradas</p>
            </div>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              R$ {totals.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="group/summary rounded-lg border border-border/50 bg-gradient-to-br from-red-500/10 via-transparent to-transparent p-4 transition-all duration-300 hover:border-red-500/30 hover:shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saídas</p>
            </div>
            <p className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">
              R$ {(totals.saidas + totals.diario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className={cn(
            "group/summary rounded-lg border-2 p-4 transition-all duration-300",
            totals.saldo >= 0
              ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent hover:border-emerald-500/50 hover:shadow-sm"
              : "border-red-500/30 bg-gradient-to-br from-red-500/10 via-transparent to-transparent hover:border-red-500/50 hover:shadow-sm"
          )}>
            <div className="flex items-center gap-2 mb-1.5">
              <Wallet className={cn(
                "h-4 w-4",
                totals.saldo >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )} />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saldo</p>
            </div>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              totals.saldo >= 0 
                ? "text-emerald-600 dark:text-emerald-400" 
                : "text-red-600 dark:text-red-400"
            )}>
              {totals.saldo >= 0 ? '+' : ''} R$ {totals.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

