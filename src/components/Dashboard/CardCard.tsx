import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type Cartao = Database['public']['Tables']['cartoes']['Row'];
type Fatura = Database['public']['Tables']['faturas_cartoes']['Row'];

interface CardCardProps {
  cartao: Cartao;
  faturaAtual?: Fatura | null;
  onClick?: () => void;
}

export function CardCard({ cartao, faturaAtual, onClick }: CardCardProps) {
  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'credito':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      case 'debito':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'ambos':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'credito':
        return 'Crédito';
      case 'debito':
        return 'Débito';
      case 'ambos':
        return 'Crédito/Débito';
      default:
        return tipo;
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isVencido = faturaAtual?.data_vencimento
    ? new Date(faturaAtual.data_vencimento) < new Date() && !faturaAtual.pago
    : false;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${onClick ? '' : 'cursor-default'}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{cartao.nome}</CardTitle>
          </div>
          <Badge className={getTipoColor(cartao.tipo)}>
            {getTipoLabel(cartao.tipo)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {cartao.limite && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Limite:</span>
            <span className="font-medium">{formatCurrency(cartao.limite)}</span>
          </div>
        )}

        {faturaAtual && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Fatura atual:</span>
              <span className={`font-semibold ${isVencido ? 'text-destructive' : ''}`}>
                {formatCurrency(faturaAtual.valor_total)}
              </span>
            </div>

            {faturaAtual.data_vencimento && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Vencimento:</span>
                <span className={isVencido ? 'font-semibold text-destructive' : ''}>
                  {format(new Date(faturaAtual.data_vencimento), "dd 'de' MMMM", { locale: ptBR })}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Badge variant={faturaAtual.pago ? 'default' : 'destructive'}>
                {faturaAtual.pago ? 'Pago' : 'Pendente'}
              </Badge>
              {isVencido && (
                <Badge variant="destructive" className="text-xs">
                  Vencido
                </Badge>
              )}
            </div>
          </>
        )}

        {!faturaAtual && cartao.tipo !== 'debito' && (
          <div className="text-sm text-muted-foreground">
            Nenhuma fatura encontrada para este mês
          </div>
        )}

        {!cartao.ativo && (
          <Badge variant="secondary" className="w-full justify-center">
            Inativo
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
