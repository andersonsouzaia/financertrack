import { useMemo } from "react";
import { TransactionCard } from "./TransactionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DailyTransactionsViewProps {
  transactions: any[];
  loading?: boolean;
  onEdit?: (transaction: any) => void;
  onDelete?: (transactionId: string) => void;
  selectedMonth?: any;
}

export function DailyTransactionsView({
  transactions,
  loading = false,
  onEdit,
  onDelete,
  selectedMonth,
}: DailyTransactionsViewProps) {
  // Agrupar transações por dia
  const transactionsByDay = useMemo(() => {
    const grouped: Record<number, any[]> = {};
    
    transactions.forEach((transaction) => {
      const day = transaction.dia;
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(transaction);
    });

    // Ordenar por dia (maior para menor)
    return Object.keys(grouped)
      .map(Number)
      .sort((a, b) => b - a)
      .map((day) => ({
        day,
        transactions: grouped[day].sort((a, b) => {
          // Ordenar por tipo: entradas primeiro, depois saídas
          const order = { entrada: 0, saida_fixa: 1, diario: 2 };
          return (order[a.tipo] || 3) - (order[b.tipo] || 3);
        }),
      }));
  }, [transactions]);

  // Calcular totais por dia
  const getDayTotals = (dayTransactions: any[]) => {
    return dayTransactions.reduce(
      (acc, t) => {
        const valor = Number(t.valor_original) || 0;
        if (t.tipo === "entrada") {
          acc.entradas += valor;
        } else {
          acc.saidas += valor;
        }
        acc.saldo = acc.entradas - acc.saidas;
        return acc;
      },
      { entradas: 0, saidas: 0, saldo: 0 }
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Card key={idx} className="border-border/50">
            <CardHeader className="pb-4">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (transactionsByDay.length === 0) {
    return (
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhuma transação encontrada
          </h3>
          <p className="text-sm text-muted-foreground">
            Adicione transações para começar a visualizar seu fluxo financeiro
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {transactionsByDay.map(({ day, transactions: dayTransactions }, idx) => {
        const totals = getDayTotals(dayTransactions);
        const hasPositiveBalance = totals.saldo >= 0;

        return (
          <Card
            key={day}
            className={cn(
              "group border-border/50 bg-background/50 backdrop-blur-sm",
              "transition-all duration-300",
              "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
              "animate-fade-in-tasko"
            )}
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            {/* Day Header */}
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold tracking-tight">
                      Dia {day}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {dayTransactions.length}{" "}
                      {dayTransactions.length === 1
                        ? "transação"
                        : "transações"}
                    </p>
                  </div>
                </div>

                {/* Day Summary */}
                <div className="flex items-center gap-4">
                  {totals.entradas > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
                        Entradas
                      </p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        +R$ {totals.entradas.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  )}
                  {totals.saidas > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
                        Saídas
                      </p>
                      <p className="text-sm font-bold text-red-600 dark:text-red-400 tabular-nums">
                        -R$ {totals.saidas.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  )}
                  <div
                    className={cn(
                      "text-right px-4 py-2 rounded-lg border-2 transition-all duration-300",
                      hasPositiveBalance
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : "border-red-500/30 bg-red-500/10"
                    )}
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
                      Saldo do dia
                    </p>
                    <p
                      className={cn(
                        "text-base font-bold tabular-nums",
                        hasPositiveBalance
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {hasPositiveBalance ? "+" : ""}R$ {totals.saldo.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>

            {/* Transactions List */}
            <CardContent className="pt-4 space-y-3">
              {dayTransactions.map((transaction, transactionIdx) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  compact
                />
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
