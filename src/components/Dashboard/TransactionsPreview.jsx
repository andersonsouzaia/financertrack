import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    <Card className="shadow-card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">
            Movimentações Recentes
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Veja os últimos lançamentos deste mês.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/transactions')}>
          Ver tabela completa
          <ArrowRightCircle className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-12 w-full animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhuma transação registrada neste mês ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {transaction.categoria?.icone} {transaction.descricao}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Dia {transaction.dia} · {transaction.tipo === 'entrada' ? 'Entrada' : transaction.tipo === 'saida_fixa' ? 'Saída Fixa' : 'Gasto Diário'}
                  </span>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    transaction.tipo === 'entrada' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {transaction.tipo === 'entrada' ? '+' : '-'} R${' '}
                  {Number(transaction.valor_original).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground uppercase">Entradas</p>
            <p className="text-base font-semibold text-green-600 dark:text-green-400">
              R$ {totals.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-md border border-border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground uppercase">Saídas Totais</p>
            <p className="text-base font-semibold text-red-500 dark:text-red-400">
              R$ {(totals.saidas + totals.diario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-md border border-border bg-muted/40 p-3 col-span-2">
            <p className="text-xs text-muted-foreground uppercase">Saldo do mês</p>
            <p
              className={`text-base font-semibold ${
                totals.saldo >= 0 ? 'text-foreground' : 'text-red-500 dark:text-red-400'
              }`}
            >
              R$ {totals.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

