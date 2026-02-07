import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import { useNavigate } from 'react-router-dom';

export function EmergencyFundCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reserva, setReserva] = useState(0);
  const [meta, setMeta] = useState(0);
  const [percentual, setPercentual] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchReserva = async () => {
      try {
        const { data: config } = await supabase
          .from('configuracao_usuario')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        const rendaMensal = Number(config?.renda_mensal || 0);
        const metaReserva = Number(
          config?.reserva_emergencia_meta ?? (rendaMensal > 0 ? rendaMensal * 3 : 0)
        );
        const reservaAtual = Number(config?.reserva_emergencia_atual ?? 0);
        const perc = metaReserva > 0 ? (reservaAtual / metaReserva) * 100 : 0;

        setReserva(reservaAtual);
        setMeta(metaReserva);
        setPercentual(Math.min(perc, 100));
      } catch (error) {
        console.error('Erro ao buscar reserva:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReserva();

    const channel = supabase
      .channel('emergency-fund-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'configuracao_usuario', filter: `user_id=eq.${user.id}` },
        () => fetchReserva()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <Card className="shadow-card-hover">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Carregando...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card
      className="shadow-card-hover border-l-4 border-l-warning h-full flex flex-col justify-between group cursor-pointer transition-all hover:bg-muted/50"
      onClick={() => navigate('/assets')}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 transition-transform group-hover:scale-110" />
            Fundo de Emergência
          </div>
          {percentual >= 100 && <span className="text-xs text-emerald-600 font-bold">Concluído</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-3xl font-heading font-bold text-foreground tracking-tight">
            R$ {reserva.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            de R$ {meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Meta)
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-muted-foreground">Progresso</span>
            <span className="text-primary">{percentual.toFixed(1)}%</span>
          </div>
          <Progress
            value={percentual}
            className="h-2.5 bg-muted/50"
            indicatorClassName={cn(
              "transition-all duration-500",
              percentual >= 100 ? "bg-emerald-500" :
                percentual >= 50 ? "bg-primary" :
                  "bg-orange-500"
            )}
          />
        </div>

        <div className="flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-md bg-muted/30 w-fit">
          {percentual < 30 && <span className="flex items-center gap-1.5 text-orange-600 font-medium">🚨 Abaixo do recomendado</span>}
          {percentual >= 30 && percentual < 70 && <span className="flex items-center gap-1.5 text-blue-600 font-medium">⚠️ Em construção</span>}
          {percentual >= 70 && percentual < 100 && <span className="flex items-center gap-1.5 text-primary font-medium">🎯 Quase lá!</span>}
          {percentual >= 100 && <span className="flex items-center gap-1.5 text-emerald-600 font-medium">✅ Meta protegida</span>}
        </div>
      </CardContent>
    </Card>
  );
}
