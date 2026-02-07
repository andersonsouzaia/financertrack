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
      className="shadow-card-hover border-l-4 border-l-orange-500 h-full flex flex-col justify-between group cursor-pointer transition-all duration-300 hover:bg-muted/30 border border-border/50"
      onClick={() => navigate('/assets')}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center justify-between uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Shield className="w-3.5 h-3.5 transition-transform group-hover:scale-110 group-hover:rotate-6" />
            </div>
            Fundo de Emergência
          </div>
          {percentual >= 100 && (
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
              Concluído
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 flex-grow flex flex-col justify-between">
        <div className="transition-transform duration-500 group-hover:translate-x-1">
          <p className="text-4xl font-heading font-black text-foreground tracking-tight">
            R$ {reserva.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2 px-2 py-0.5 bg-muted/50 rounded-md inline-block">
            Meta: R$ {meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Progresso</span>
            <span className="text-sm font-black text-primary">{percentual.toFixed(1)}%</span>
          </div>
          <Progress
            value={percentual}
            className="h-2.5 bg-muted rounded-full overflow-hidden border border-border/10 shadow-inner"
            indicatorClassName={cn(
              "transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(var(--indicator-color),0.3)]",
              percentual >= 100 ? "bg-emerald-500 shadow-emerald-500/20" :
                percentual >= 50 ? "bg-primary shadow-primary/20" :
                  "bg-orange-500 shadow-orange-500/20"
            )}
          />
        </div>

        <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-xl border backdrop-blur-md shadow-sm transition-all duration-300 group-hover:shadow-md bg-muted/20 border-border/50 w-fit">
          {percentual < 30 && (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">🚨 Abaixo do recomendado</span>
            </>
          )}
          {percentual >= 30 && percentual < 70 && (
            <>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">⚠️ Em construção</span>
            </>
          )}
          {percentual >= 70 && percentual < 100 && (
            <>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-primary/40 shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">🎯 Quase lá!</span>
            </>
          )}
          {percentual >= 100 && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">✅ Meta protegida</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
