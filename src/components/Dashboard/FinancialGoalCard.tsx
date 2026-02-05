import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Calendar, TrendingUp, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { Database } from '@/integrations/supabase/types';

type MetaFinanceira = Database['public']['Tables']['metas_financeiras']['Row'];

interface FinancialGoalCardProps {
  meta: MetaFinanceira;
  onContribute?: () => void;
  onClick?: () => void;
}

const COLORS = ['#2563eb', '#e5e7eb'];

export function FinancialGoalCard({ meta, onContribute, onClick }: FinancialGoalCardProps) {
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'reserva_emergencia':
        return 'Reserva de Emergência';
      case 'viagem':
        return 'Viagem';
      case 'compra':
        return 'Compra';
      case 'investimento':
        return 'Investimento';
      case 'outro':
        return 'Outro';
      default:
        return tipo;
    }
  };

  const valorAtual = meta.valor_atual || 0;
  const valorMeta = meta.valor_meta;
  const progresso = valorMeta > 0 
    ? Math.min(100, Math.max(0, (valorAtual / valorMeta) * 100))
    : 0;

  const isConcluida = progresso >= 100;
  const isVencida = meta.data_limite 
    ? new Date(meta.data_limite) < new Date() && !isConcluida
    : false;

  const chartData = [
    { name: 'Conquistado', value: valorAtual },
    { name: 'Restante', value: Math.max(0, valorMeta - valorAtual) },
  ];

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${onClick ? '' : 'cursor-default'} ${isConcluida ? 'opacity-75' : ''} ${isVencida ? 'border-destructive' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{meta.nome}</CardTitle>
          </div>
          <Badge variant={isConcluida ? 'default' : isVencida ? 'destructive' : 'secondary'}>
            {getTipoLabel(meta.tipo)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gráfico de Progresso */}
        <div className="flex items-center gap-4">
          <div className="w-24 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={40}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso:</span>
              <span className="font-semibold">
                {formatCurrency(valorAtual)} / {formatCurrency(valorMeta)}
              </span>
            </div>

            <Progress value={progresso} className="h-2" />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progresso.toFixed(1)}%</span>
              <span>Faltam: {formatCurrency(Math.max(0, valorMeta - valorAtual))}</span>
            </div>
          </div>
        </div>

        {meta.descricao && (
          <p className="text-sm text-muted-foreground line-clamp-2">{meta.descricao}</p>
        )}

        {meta.data_limite && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className={`h-4 w-4 ${isVencida ? 'text-destructive' : 'text-muted-foreground'}`} />
            <span className="text-muted-foreground">Prazo:</span>
            <span className={isVencida ? 'font-semibold text-destructive' : ''}>
              {format(new Date(meta.data_limite), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
        )}

        {meta.valor_mensal_sugerido && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Sugestão mensal:</span>
            <span className="font-semibold">{formatCurrency(meta.valor_mensal_sugerido)}</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          {isConcluida ? (
            <Badge variant="default" className="w-full justify-center">
              Concluída
            </Badge>
          ) : isVencida ? (
            <Badge variant="destructive" className="w-full justify-center">
              Vencida
            </Badge>
          ) : (
            <>
              <Badge variant="secondary" className="flex-1 justify-center">
                Em Andamento
              </Badge>
              {onContribute && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onContribute();
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Contribuir
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
