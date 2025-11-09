import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';

export function EmergencyFundCard() {
  const { user } = useAuth();
  const [reserva, setReserva] = useState(0);
  const [meta, setMeta] = useState(0);
  const [percentual, setPercentual] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchReserva = async () => {
      try {
        // Get user configuration
        const { data: config } = await supabase
          .from('configuracao_usuario')
          .select('renda_mensal')
          .eq('user_id', user.id)
          .maybeSingle();

        // Goal: 3x monthly income
        const metaReserva = (config?.renda_mensal || 0) * 3;

        // Find "Emergência" category
        const { data: categoria } = await supabase
          .from('categorias_saidas')
          .select('id')
          .eq('user_id', user.id)
          .eq('nome', 'Emergência')
          .maybeSingle();

        if (categoria) {
          // Get total saved in Emergency category
          const { data: transacoes } = await supabase
            .from('transacoes')
            .select('valor_original')
            .eq('categoria_id', categoria.id)
            .eq('tipo', 'entrada')
            .eq('deletado', false);

          const totalReserva = transacoes?.reduce((sum, t) => sum + (Number(t.valor_original) || 0), 0) || 0;
          const perc = metaReserva > 0 ? (totalReserva / metaReserva) * 100 : 0;

          setReserva(totalReserva);
          setMeta(metaReserva);
          setPercentual(Math.min(perc, 100));
        }

        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar reserva:', error);
        setLoading(false);
      }
    };

    fetchReserva();

    // Real-time subscription
    const channel = supabase
      .channel('emergency-fund-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'transacoes' },
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
    <Card className="shadow-card-hover border-l-4 border-l-warning">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Fundo de Emergência
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-3xl font-heading font-bold text-balance-excellent">
            R$ {reserva.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Meta: R$ {meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="font-semibold">
                {percentual.toFixed(1)}%
              </span>
            </div>
            <Progress value={percentual} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground">
            {percentual < 30 && '🚨 Abaixo do recomendado'}
            {percentual >= 30 && percentual < 70 && '⚠️ Em progresso'}
            {percentual >= 70 && percentual < 100 && '🎯 Quase lá!'}
            {percentual >= 100 && '✅ Meta atingida!'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
