import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, ArrowRight, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { Database } from '@/integrations/supabase/types';

type MetaMensal = Database['public']['Tables']['metas_mensais']['Row'];
type MetaFinanceira = Database['public']['Tables']['metas_financeiras']['Row'];

export function GoalsSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metasMensais, setMetasMensais] = useState<MetaMensal[]>([]);
  const [metasFinanceiras, setMetasFinanceiras] = useState<MetaFinanceira[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMetas();
    }
  }, [user]);

  const fetchMetas = async () => {
    if (!user) return;

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const [mensaisRes, financeirasRes] = await Promise.all([
        supabase
          .from('metas_mensais')
          .select('*')
          .eq('user_id', user.id)
          .eq('mes_ano', currentMonth)
          .eq('concluida', false)
          .order('prioridade', { ascending: false, nullsFirst: false })
          .limit(3),
        supabase
          .from('metas_financeiras')
          .select('*')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .order('prioridade', { ascending: false, nullsFirst: false })
          .limit(3),
      ]);

      if (mensaisRes.data) setMetasMensais(mensaisRes.data);
      if (financeirasRes.data) setMetasFinanceiras(financeirasRes.data);
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
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
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, idx) => (
          <Card key={idx} className="border-border/50">
            <CardHeader className="pb-4">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const hasMetas = metasMensais.length > 0 || metasFinanceiras.length > 0;

  if (!hasMetas) {
    return (
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhuma meta ativa
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Crie metas mensais ou financeiras para acompanhar seus objetivos
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/monthly-goals')}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Metas Mensais
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/financial-goals')}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Metas Financeiras
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
      {/* Metas Mensais */}
      <Card className="group h-full border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
              Metas Mensais
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/monthly-goals')}
              className="gap-2 group/btn"
            >
              Ver todas
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {metasMensais.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Nenhuma meta mensal ativa
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/monthly-goals')}
                className="gap-2"
              >
                Criar Meta Mensal
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            metasMensais.map((meta, index) => {
              const valorAtual = meta.valor_atual || 0;
              const valorMeta = meta.valor_meta || 0;
              const progresso = valorMeta > 0 
                ? Math.min(100, Math.max(0, (valorAtual / valorMeta) * 100))
                : 0;
              const isComplete = progresso >= 100;

              return (
                <div
                  key={meta.id}
                  className={cn(
                    "group/item relative overflow-hidden rounded-lg border border-border/50 bg-background/50 p-4",
                    "transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5",
                    "animate-fade-in-tasko"
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  <div className="relative space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground mb-1 truncate">
                          {meta.titulo}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="tabular-nums">
                            {formatCurrency(valorAtual)}
                          </span>
                          <span>/</span>
                          <span className="tabular-nums">
                            {formatCurrency(valorMeta)}
                          </span>
                        </div>
                      </div>
                      {isComplete && (
                        <div className="shrink-0 px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                          ✓ Concluída
                        </div>
                      )}
                    </div>
                    
                    <Progress 
                      value={progresso} 
                      className={cn(
                        "h-2.5 transition-all duration-500",
                        isComplete && "bg-emerald-500/20"
                      )} 
                    />
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground tabular-nums">
                        {progresso.toFixed(1)}% concluído
                      </span>
                      {!isComplete && (
                        <span className="text-primary font-medium tabular-nums">
                          Faltam {formatCurrency(Math.max(0, valorMeta - valorAtual))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Metas Financeiras */}
      <Card className="group h-full border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
              Metas Financeiras
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/financial-goals')}
              className="gap-2 group/btn"
            >
              Ver todas
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {metasFinanceiras.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Nenhuma meta financeira ativa
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/financial-goals')}
                className="gap-2"
              >
                Criar Meta Financeira
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            metasFinanceiras.map((meta, index) => {
              const valorAtual = meta.valor_atual || 0;
              const valorMeta = meta.valor_meta;
              const progresso = valorMeta > 0 
                ? Math.min(100, Math.max(0, (valorAtual / valorMeta) * 100))
                : 0;
              const isComplete = progresso >= 100;

              return (
                <div
                  key={meta.id}
                  className={cn(
                    "group/item relative overflow-hidden rounded-lg border border-border/50 bg-background/50 p-4",
                    "transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5",
                    "animate-fade-in-tasko"
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  <div className="relative space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground mb-1 truncate">
                          {meta.nome}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="tabular-nums">
                            {formatCurrency(valorAtual)}
                          </span>
                          <span>/</span>
                          <span className="tabular-nums">
                            {formatCurrency(valorMeta)}
                          </span>
                        </div>
                      </div>
                      {isComplete && (
                        <div className="shrink-0 px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                          ✓ Concluída
                        </div>
                      )}
                    </div>
                    
                    <Progress 
                      value={progresso} 
                      className={cn(
                        "h-2.5 transition-all duration-500",
                        isComplete && "bg-emerald-500/20"
                      )} 
                    />
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground tabular-nums">
                        {progresso.toFixed(1)}% concluído
                      </span>
                      {!isComplete && (
                        <span className="text-primary font-medium tabular-nums">
                          Faltam {formatCurrency(Math.max(0, valorMeta - valorAtual))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
