import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Calendar, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

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
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
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

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${onClick ? '' : 'cursor-default'} ${isConcluida ? 'opacity-75' : ''} ${isVencida ? 'border-destructive' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{meta.titulo}</CardTitle>
          </div>
          <Badge className={getTipoColor(meta.tipo)}>
            {getTipoLabel(meta.tipo)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso:</span>
            <span className="font-semibold">
              {formatCurrency(valorAtual)} / {formatCurrency(valorMeta)}
            </span>
          </div>

          <Progress 
            value={progresso} 
            className={`h-2 ${meta.tipo === 'gasto_maximo' && progresso > 80 ? 'bg-red-500' : ''}`}
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progresso.toFixed(1)}%</span>
            {meta.tipo === 'gasto_maximo' && (
              <span>
                Restante: {formatCurrency(Math.max(0, valorMeta - valorAtual))}
              </span>
            )}
            {meta.tipo === 'economia_minima' && (
              <span>
                Faltam: {formatCurrency(Math.max(0, valorMeta - valorAtual))}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Mês:</span>
          <span>{getMesLabel(meta.mes_ano)}</span>
        </div>

        {meta.data_limite && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className={`h-4 w-4 ${isVencida ? 'text-destructive' : 'text-muted-foreground'}`} />
            <span className="text-muted-foreground">Prazo:</span>
            <span className={isVencida ? 'font-semibold text-destructive' : ''}>
              {format(new Date(meta.data_limite), "dd 'de' MMMM", { locale: ptBR })}
            </span>
          </div>
        )}

        {meta.descricao && (
          <p className="text-sm text-muted-foreground line-clamp-2">{meta.descricao}</p>
        )}

        <div className="flex items-center gap-2 pt-2">
          {isConcluida ? (
            <Badge variant="default" className="w-full justify-center">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Concluída
            </Badge>
          ) : isVencida ? (
            <Badge variant="destructive" className="w-full justify-center">
              Vencida
            </Badge>
          ) : (
            <Badge variant="secondary" className="w-full justify-center">
              Em Andamento
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
