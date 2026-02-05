import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, XCircle, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type Fatura = Database['public']['Tables']['faturas_cartoes']['Row'];

interface FaturaCardProps {
  fatura: Fatura;
  onMarkAsPaid?: (faturaId: string) => void;
  onMarkAsUnpaid?: (faturaId: string) => void;
}

export function FaturaCard({ fatura, onMarkAsPaid, onMarkAsUnpaid }: FaturaCardProps) {
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isVencido = fatura.data_vencimento
    ? new Date(fatura.data_vencimento) < new Date() && !fatura.pago
    : false;

  const getMesLabel = (mesReferencia: string) => {
    try {
      const [ano, mes] = mesReferencia.split('-');
      const date = new Date(parseInt(ano), parseInt(mes) - 1, 1);
      return format(date, "MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return mesReferencia;
    }
  };

  return (
    <Card className={isVencido ? 'border-destructive' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{getMesLabel(fatura.mes_referencia)}</CardTitle>
          <Badge variant={fatura.pago ? 'default' : isVencido ? 'destructive' : 'secondary'}>
            {fatura.pago ? 'Pago' : isVencido ? 'Vencido' : 'Pendente'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Valor Total:</span>
          <span className={`text-xl font-bold ${isVencido && !fatura.pago ? 'text-destructive' : ''}`}>
            {formatCurrency(fatura.valor_total)}
          </span>
        </div>

        <div className="space-y-2 text-sm">
          {fatura.data_fechamento && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Fechamento:</span>
              <span>
                {format(new Date(fatura.data_fechamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
          )}

          {fatura.data_vencimento && (
            <div className="flex items-center gap-2">
              <Calendar className={`h-4 w-4 ${isVencido && !fatura.pago ? 'text-destructive' : 'text-muted-foreground'}`} />
              <span className="text-muted-foreground">Vencimento:</span>
              <span className={isVencido && !fatura.pago ? 'font-semibold text-destructive' : ''}>
                {format(new Date(fatura.data_vencimento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
          )}

          {fatura.pago && fatura.data_pagamento && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Pagamento:</span>
              <span>
                {format(new Date(fatura.data_pagamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
          )}
        </div>

        {onMarkAsPaid && onMarkAsUnpaid && (
          <div className="pt-2">
            {fatura.pago ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onMarkAsUnpaid(fatura.id)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Marcar como Não Pago
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={() => onMarkAsPaid(fatura.id)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marcar como Pago
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
