import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const formatCurrency = (value) =>
  `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export function MonthSummaryCard({ month }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [entradas, setEntradas] = useState(0);
  const [saidas, setSaidas] = useState(0);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!user || !month?.id) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('transacoes')
          .select('tipo, valor_original')
          .eq('user_id', user.id)
          .eq('mes_financeiro_id', month.id)
          .eq('deletado', false);

        if (error) throw error;

        let totalEntradas = 0;
        let totalSaidas = 0;

        data?.forEach((transacao) => {
          const valor = Number(transacao.valor_original || 0);
          if (transacao.tipo === 'entrada') {
            totalEntradas += valor;
          } else {
            totalSaidas += valor;
          }
        });

        setEntradas(totalEntradas);
        setSaidas(totalSaidas);
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

  const saldoMes = entradas - saidas;

  return (
    <Card className="shadow-card-hover border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          Entradas e saídas do mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Carregando resumo mensal...</p>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded bg-emerald-50 px-3 py-2 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
              <span className="font-medium">Entradas</span>
              <span className="font-semibold">{formatCurrency(entradas)}</span>
            </div>
            <div className="flex items-center justify-between rounded bg-red-50 px-3 py-2 text-red-700 dark:bg-red-900/20 dark:text-red-300">
              <span className="font-medium">Saídas</span>
              <span className="font-semibold">{formatCurrency(saidas)}</span>
            </div>
            <div className="flex items-center justify-between rounded bg-muted/60 px-3 py-2">
              <span className="font-medium text-foreground">Saldo do mês</span>
              <span
                className={`font-semibold ${
                  saldoMes >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'
                }`}
              >
                {formatCurrency(saldoMes)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

