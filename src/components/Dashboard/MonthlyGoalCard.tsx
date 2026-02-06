import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Calendar, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

// Cores emerald (verde) para os gráficos
const COLORS = ['#10b981', '#d1fae5']; // emerald-500 e emerald-200

type MetaMensal = Database['public']['Tables']['metas_mensais']['Row'];

interface MonthlyGoalCardProps {
  meta: MetaMensal;
  onClick?: () => void;
}

export function MonthlyGoalCard({ meta, onClick }: MonthlyGoalCardProps) {
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'gasto_maximo':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'economia_minima':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'gasto_maximo':
        return 'Gasto Máximo';
      case 'economia_minima':
        return 'Economia Mínima';
      default:
        return tipo;
    }
  };

  const getMesLabel = (mesAno: string) => {
    try {
      const [ano, mes] = mesAno.split('-');
      const date = new Date(parseInt(ano), parseInt(mes) - 1, 1);
      return format(date, "MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return mesAno;
    }
  };

  const valorAtual = meta.valor_atual || 0;
  const valorMeta = meta.valor_meta || 0;
  
  // Para gasto máximo: progresso negativo (quanto mais próximo do limite, pior)
  // Para economia mínima: progresso positivo (quanto mais próximo da meta, melhor)
  const progresso = valorMeta > 0 
    ? Math.min(100, Math.max(0, (valorAtual / valorMeta) * 100))
    : 0;

  const isConcluida = meta.concluida || false;
  const isVencida = meta.data_limite 
    ? new Date(meta.data_limite) < new Date() && !isConcluida
    : false;

  // Dados para o gráfico de pizza
  const chartData = [
    { name: 'Alcançado', value: valorAtual },
    { name: 'Restante', value: Math.max(0, valorMeta - valorAtual) },
  ];

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm",
        "transition-all duration-300 h-full flex flex-col",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
        onClick && "cursor-pointer",
        isConcluida && "opacity-75",
        isVencida && "border-red-500/50"
      )}
      onClick={onClick}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <CardHeader className="relative pb-4 border-b border-border/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary shrink-0 transition-transform duration-300 group-hover:scale-110">
              <Target className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <CardTitle className="text-lg font-bold tracking-tight break-words leading-tight">{meta.titulo}</CardTitle>
              <Badge className={cn("inline-flex", getTipoColor(meta.tipo))}>
                {getTipoLabel(meta.tipo)}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative pt-6 space-y-5 flex-1 flex flex-col">
        {/* Gráfico de Progresso - Pizza Verde */}
        <div className="flex items-center gap-5">
          <div className="w-28 h-28 shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={24}
                  outerRadius={48}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                      style={{
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                        transition: "all 0.3s ease",
                      }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Percentual central */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className={cn(
                  "text-lg font-bold tabular-nums",
                  meta.tipo === 'gasto_maximo' && progresso > 80 
                    ? "text-red-600 dark:text-red-400"
                    : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {progresso.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3 min-w-0">
            <div className="space-y-2.5">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progresso</span>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-base font-bold text-foreground tabular-nums">
                      {formatCurrency(valorAtual)}
                    </span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-sm font-semibold text-muted-foreground tabular-nums">
                      {formatCurrency(valorMeta)}
                    </span>
                  </div>
                </div>
              </div>

              <Progress 
                value={progresso} 
                className={cn(
                  "h-2.5 transition-all duration-500",
                  meta.tipo === 'gasto_maximo' && progresso > 80 && "bg-red-500/20",
                  isConcluida && "bg-emerald-500/20"
                )}
              />

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground tabular-nums">{progresso.toFixed(1)}% concluído</span>
                {meta.tipo === 'gasto_maximo' && (
                  <span className="text-xs font-semibold text-muted-foreground tabular-nums whitespace-nowrap">
                    Restante: {formatCurrency(Math.max(0, valorMeta - valorAtual))}
                  </span>
                )}
                {meta.tipo === 'economia_minima' && (
                  <span className="text-xs font-semibold text-primary tabular-nums whitespace-nowrap">
                    Faltam: {formatCurrency(Math.max(0, valorMeta - valorAtual))}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="space-y-3 pt-3 border-t border-border/50">
          <div className="flex items-start gap-2.5 text-sm p-3 rounded-lg bg-muted/30">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="text-muted-foreground">Mês: </span>
              <span className="font-medium break-words">{getMesLabel(meta.mes_ano)}</span>
            </div>
          </div>

          {meta.data_limite && (
            <div className="flex items-start gap-2.5 text-sm p-3 rounded-lg bg-muted/30">
              <Calendar className={cn(
                "h-4 w-4 shrink-0 mt-0.5",
                isVencida ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
              )} />
              <div className="flex-1 min-w-0">
                <span className="text-muted-foreground">Prazo: </span>
                <span className={cn(
                  "font-medium break-words",
                  isVencida && 'text-red-600 dark:text-red-400'
                )}>
                  {format(new Date(meta.data_limite), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          )}

          {meta.descricao && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed break-words line-clamp-3">
                {meta.descricao}
              </p>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          {isConcluida ? (
            <Badge variant="default" className="w-full justify-center py-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1.5" />
              Concluída
            </Badge>
          ) : isVencida ? (
            <Badge variant="destructive" className="w-full justify-center py-2">
              Vencida
            </Badge>
          ) : (
            <Badge variant="secondary" className="w-full justify-center py-2">
              Em Andamento
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
