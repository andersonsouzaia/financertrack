import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, AlertCircle, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Cartao = Database['public']['Tables']['cartoes']['Row'];
type Fatura = Database['public']['Tables']['faturas_cartoes']['Row'];

interface CardExpensesOverviewProps {
  selectedMonth: any; // meses_financeiros
}

export function CardExpensesOverview({ selectedMonth }: CardExpensesOverviewProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [faturas, setFaturas] = useState<Record<string, Fatura>>({});
  const [gastosPorCartao, setGastosPorCartao] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && selectedMonth) {
      fetchCardExpenses();
    }
  }, [user, selectedMonth]);

  const fetchCardExpenses = async () => {
    if (!user || !selectedMonth) return;

    setLoading(true);
    try {
      // Buscar cartões ativos
      const { data: cardsData, error: cardsError } = await supabase
        .from('cartoes')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('nome');

      if (cardsError) throw cardsError;

      setCartoes(cardsData || []);

      // Buscar faturas do mês selecionado
      const mesReferencia = `${selectedMonth.ano}-${String(selectedMonth.mes).padStart(2, '0')}`;
      const cartaoIds = (cardsData || []).map((c) => c.id);

      if (cartaoIds.length > 0) {
        const { data: faturasData, error: faturasError } = await supabase
          .from('faturas_cartoes')
          .select('*')
          .in('cartao_id', cartaoIds)
          .eq('mes_referencia', mesReferencia);

        if (faturasError) {
          console.error('Erro ao buscar faturas:', faturasError);
        } else {
          const faturasMap: Record<string, Fatura> = {};
          (faturasData || []).forEach((fatura) => {
            faturasMap[fatura.cartao_id] = fatura;
          });
          setFaturas(faturasMap);
        }

        // Calcular gastos do mês por cartão
        const { data: transactionsData, error: transError } = await supabase
          .from('transacoes')
          .select('cartao_id, valor_original')
          .eq('mes_financeiro_id', selectedMonth.id)
          .in('cartao_id', cartaoIds)
          .in('tipo', ['saida_fixa', 'diario'])
          .eq('deletado', false);

        if (transError) {
          console.error('Erro ao buscar transações:', transError);
        } else {
          const gastosMap: Record<string, number> = {};
          (transactionsData || []).forEach((trans) => {
            if (trans.cartao_id) {
              gastosMap[trans.cartao_id] = (gastosMap[trans.cartao_id] || 0) + Number(trans.valor_original);
            }
          });
          setGastosPorCartao(gastosMap);
        }
      }
    } catch (error: any) {
      console.error('Erro ao buscar gastos em cartões:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getFaturaStatus = (fatura: Fatura | undefined, cartao: Cartao) => {
    if (!fatura || fatura.valor_total === 0) return null;
    
    if (fatura.pago) {
      return { label: 'Pago', variant: 'default' as const, icon: CheckCircle2 };
    }

    if (fatura.data_vencimento) {
      const vencimento = new Date(fatura.data_vencimento);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      if (vencimento < hoje) {
        return { label: 'Vencido', variant: 'destructive' as const, icon: AlertCircle };
      }
      
      const diasParaVencer = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      if (diasParaVencer <= 3) {
        return { label: 'Vence em breve', variant: 'destructive' as const, icon: Clock };
      }
    }

    return { label: 'Pendente', variant: 'secondary' as const, icon: Clock };
  };

  const cartoesComDados = useMemo(() => {
    return cartoes.map((cartao) => {
      const gasto = gastosPorCartao[cartao.id] || 0;
      const fatura = faturas[cartao.id];
      const limite = cartao.limite ? Number(cartao.limite) : null;
      const limiteDisponivel = limite ? limite - gasto : null;
      const percentualUsado = limite ? (gasto / limite) * 100 : null;

      return {
        cartao,
        gasto,
        fatura,
        limite,
        limiteDisponivel,
        percentualUsado,
      };
    });
  }, [cartoes, gastosPorCartao, faturas]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Gastos em Cartões</h2>
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="border-border/50">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (cartoes.length === 0) {
    return (
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            Nenhum cartão cadastrado ainda.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/cards')}
            className="gap-2"
          >
            Cadastrar Cartão
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Gastos em Cartões</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/cards')}
          className="gap-2"
        >
          Ver todos
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {cartoesComDados.map(({ cartao, gasto, fatura, limite, limiteDisponivel, percentualUsado }) => {
          const status = getFaturaStatus(fatura, cartao);
          const isNearLimit = limite && percentualUsado && percentualUsado > 80;

          return (
            <Card
              key={cartao.id}
              className={cn(
                "group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm",
                "transition-all duration-300",
                "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
                isNearLimit && "border-orange-500/50"
              )}
              onClick={() => navigate(`/cards/${cartao.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-bold tracking-tight truncate">
                      {cartao.nome}
                    </CardTitle>
                    {cartao.bandeira && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {cartao.bandeira}
                      </p>
                    )}
                  </div>
                  <CreditCard className="h-5 w-5 text-muted-foreground shrink-0 ml-2" />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Total Gasto */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Gasto no mês</span>
                    <span className="text-xl font-bold tabular-nums">
                      {formatCurrency(gasto)}
                    </span>
                  </div>

                  {/* Barra de progresso se houver limite */}
                  {limite && (
                    <div className="space-y-1">
                      <Progress
                        value={Math.min(percentualUsado || 0, 100)}
                        className={cn(
                          "h-2",
                          (percentualUsado || 0) > 100 && "bg-red-500",
                          (percentualUsado || 0) > 80 && (percentualUsado || 0) <= 100 && "bg-orange-500",
                          (percentualUsado || 0) <= 80 && "bg-primary"
                        )}
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {formatCurrency(limiteDisponivel || 0)} disponível
                        </span>
                        <span>
                          {Math.round(percentualUsado || 0)}% usado
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fatura Pendente */}
                {fatura && fatura.valor_total > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Fatura</span>
                      <span className="text-lg font-semibold tabular-nums">
                        {formatCurrency(fatura.valor_total)}
                      </span>
                    </div>
                    {status && (
                      <div className="flex items-center gap-2">
                        <Badge variant={status.variant} className="gap-1.5">
                          <status.icon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                        {fatura.data_vencimento && !fatura.pago && (
                          <span className="text-xs text-muted-foreground">
                            Vence em {new Date(fatura.data_vencimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Sem fatura mas tem gasto */}
                {!fatura && gasto > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      Total de gastos no mês
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
