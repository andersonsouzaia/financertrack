import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type MetaMensal = Database['public']['Tables']['metas_mensais']['Row'];

export function MonthlyGoalsCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metas, setMetas] = useState<MetaMensal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMetas();
    }
  }, [user]);

  const fetchMetas = async () => {
    if (!user) return;

    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data, error } = await supabase
        .from('metas_mensais')
        .select('*')
        .eq('user_id', user.id)
        .eq('mes_ano', currentMonth)
        .eq('concluida', false)
        .order('prioridade', { ascending: false, nullsFirst: false })
        .limit(3);

      if (error) throw error;
      setMetas(data || []);
    } catch (error) {
      console.error('Erro ao buscar metas mensais:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <Card className="animate-pulse h-full">
        <CardHeader className="p-4">
          <CardTitle className="text-lg">Metas Mensais</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded-[var(--radius-sm)] w-3/4 animate-shimmer"></div>
            <div className="h-4 bg-muted rounded-[var(--radius-sm)] w-1/2 animate-shimmer"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (metas.length === 0) {
    return (
      <Card className="group h-full">
        <CardHeader className="p-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
            Metas Mensais
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <p className="text-sm text-muted-foreground">
            Nenhuma meta mensal ativa para este mês.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate('/monthly-goals')}
          >
            Criar Meta Mensal
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group h-full">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
            Metas Mensais
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/monthly-goals')}
            className="group/btn"
          >
            Ver todas
            <ArrowRight className="h-4 w-4 ml-1 transition-transform duration-300 group-hover/btn:translate-x-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {metas.map((meta, index) => {
          const valorAtual = meta.valor_atual || 0;
          const valorMeta = meta.valor_meta || 0;
          const progresso = valorMeta > 0
            ? Math.min(100, Math.max(0, (valorAtual / valorMeta) * 100))
            : 0;

          return (
            <div
              key={meta.id}
              className="space-y-2 p-3 rounded-[var(--radius-md)] hover:bg-muted/50 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{meta.titulo}</span>
                <span className="text-muted-foreground font-semibold">
                  {formatCurrency(valorAtual)} / {formatCurrency(valorMeta)}
                </span>
              </div>
              <Progress value={progresso} className="h-2.5 transition-all duration-500" />
              <div className="text-xs text-muted-foreground flex items-center justify-between">
                <span>{progresso.toFixed(1)}% concluído</span>
                {progresso >= 100 && (
                  <span className="text-success font-semibold">✓ Concluída!</span>
                )}
              </div>
            </div>
          );
        })}
        {metas.length >= 3 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate('/monthly-goals')}
          >
            Ver todas as metas
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
