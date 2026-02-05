import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, ArrowRight } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type MetaFinanceira = Database['public']['Tables']['metas_financeiras']['Row'];

export function FinancialGoalsCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metas, setMetas] = useState<MetaFinanceira[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMetas();
    }
  }, [user]);

  const fetchMetas = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('metas_financeiras')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('prioridade', { ascending: false, nullsFirst: false })
        .limit(3);

      if (error) throw error;
      setMetas(data || []);
    } catch (error) {
      console.error('Erro ao buscar metas financeiras:', error);
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Metas Financeiras</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (metas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas Financeiras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Nenhuma meta financeira ativa.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate('/financial-goals')}
          >
            Criar Meta Financeira
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas Financeiras
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/financial-goals')}
          >
            Ver todas
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {metas.map((meta) => {
          const valorAtual = meta.valor_atual || 0;
          const valorMeta = meta.valor_meta;
          const progresso = valorMeta > 0 
            ? Math.min(100, Math.max(0, (valorAtual / valorMeta) * 100))
            : 0;

          return (
            <div key={meta.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{meta.nome}</span>
                <span className="text-muted-foreground">
                  {formatCurrency(valorAtual)} / {formatCurrency(valorMeta)}
                </span>
              </div>
              <Progress value={progresso} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {progresso.toFixed(1)}% concluído • Faltam {formatCurrency(Math.max(0, valorMeta - valorAtual))}
              </div>
            </div>
          );
        })}
        {metas.length >= 3 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate('/financial-goals')}
          >
            Ver todas as metas
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
