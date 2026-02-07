import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ensureSpecificMonthExists, getMonthName } from '@/lib/monthHelper';

import { useNavigate } from 'react-router-dom';

export function MonthStatusCard({ month, onMonthUpdated }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(month || {});

  useEffect(() => {
    if (!user) return;

    // Se o mês foi passado via prop, atualiza o estado local
    if (month) {
      // Injeta propriedades calculadas que podem nao vir do banco diretamente se for apenas um objeto simples
      // Mas assumindo que 'month' prop já tem o necesspario ou vamos calcular.
      // O ideal é calcular os dias restantes baseados no mês real.
      updateMonthData(month);
      setLoading(false);
    }
  }, [user, month]);

  const updateMonthData = (monthData) => {
    // Lógica para calcular dias restantes, progresso, etc, se não vier pronto
    // Assumindo que o componente pai já manda dados básicos ou ID.
    // Se monthData tem 'mes' e 'ano', calculamos o resto.

    if (!monthData || !monthData.mes || !monthData.ano) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth() + 1; // 1-12
    const currentDay = now.getDate();

    const daysInMonth = new Date(monthData.ano, monthData.mes, 0).getDate();

    let daysRemaining = 0;
    let progress = 0;
    let dayDisplay = 0;

    if (monthData.ano < currentYear || (monthData.ano === currentYear && monthData.mes < currentMonthIndex)) {
      daysRemaining = 0;
      progress = 100;
      dayDisplay = daysInMonth;
    } else if (monthData.ano > currentYear || (monthData.ano === currentYear && monthData.mes > currentMonthIndex)) {
      daysRemaining = daysInMonth;
      progress = 0;
      dayDisplay = 0;
    } else {
      daysRemaining = daysInMonth - currentDay;
      progress = (currentDay / daysInMonth) * 100;
      dayDisplay = currentDay;
    }

    const updated = {
      ...monthData,
      daysInMonth,
      daysRemaining,
      progressPercentual: progress,
      currentDay: dayDisplay,
      mesNome: getMonthName(monthData.mes)
    };

    setCurrentMonth(updated);
  };

  const handleCloseMonth = async () => {
    if (!user || !currentMonth.id) return;

    try {
      const dataFechamento = new Date().toISOString();
      const { error } = await supabase
        .from('meses_financeiros')
        .update({ status: 'fechado', data_fechamento: dataFechamento })
        .eq('id', currentMonth.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Mês encerrado com sucesso!",
      });

      const updatedMonth = { ...currentMonth, status: 'fechado', data_fechamento: dataFechamento };
      setCurrentMonth(updatedMonth);
      if (onMonthUpdated) {
        onMonthUpdated(updatedMonth);
      }

    } catch (error) {
      console.error('Erro ao fechar mês:', error);
      toast({
        title: "Erro",
        description: "Erro ao encerrar o mês.",
        variant: "destructive"
      });
    }
  };

  // Se não tiver dados do mês carregados ainda e não estiver loading...
  // Mas como iniciamos loading=true, ok.

  if (!currentMonth.mes) {
    return (
      <Card className="h-full flex items-center justify-center p-6">
        <p className="text-muted-foreground">Selecione um mês</p>
      </Card>
    )
  }

  return (
    <Card
      className="shadow-card-hover h-full flex flex-col justify-between group cursor-pointer transition-all duration-300 hover:border-primary/30 hover:bg-muted/30 border border-border/50"
      onClick={() => navigate('/transactions')}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Calendar className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
            </div>
            <span className="capitalize">{currentMonth.mesNome || 'Mês Atual'}</span>
          </div>
          <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full tracking-wider ${currentMonth.status === 'aberto'
            ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20'
            : 'bg-muted text-muted-foreground border border-transparent'
            }`}>
            {currentMonth.status === 'aberto' ? 'Em andamento' : 'Fechado'}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 flex-grow">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-heading font-black text-foreground">
                {currentMonth.daysRemaining}
              </span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-tight">dias restantes</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Progresso
            </span>
            <span className="text-sm font-black text-primary">
              {Math.round(currentMonth.progressPercentual || 0)}%
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-border/10 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(var(--primary),0.3)] ${currentMonth.daysRemaining <= 5 ? 'bg-orange-500 shadow-orange-500/20' : 'bg-primary'
                }`}
              style={{ width: `${Math.min(parseFloat(currentMonth.progressPercentual || 0), 100)}%` }}
            />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground/70 text-right uppercase tracking-widest">
            {currentMonth.currentDay} de {currentMonth.daysInMonth} dias
          </p>
        </div>

        <div className="pt-2">
          {currentMonth.status === 'aberto' && currentMonth.daysRemaining > 0 ? (
            <Button
              variant="outline"
              className="w-full h-11 border-dashed hover:border-solid hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-all font-bold uppercase tracking-widest text-[10px] gap-2 rounded-xl"
              onClick={(e) => {
                e.stopPropagation();
                handleCloseMonth();
              }}
            >
              Encerrar Mês
            </Button>
          ) : (
            <div className="py-3 px-4 rounded-xl bg-muted/50 border border-border/50 text-center">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">
                Status do Período
              </p>
              <p className="text-xs text-foreground font-medium">
                {currentMonth.status === 'fechado'
                  ? `Fechado em ${currentMonth.data_fechamento ? new Date(currentMonth.data_fechamento).toLocaleDateString('pt-BR') : 'Data não registrada'}`
                  : 'Mês finalizado'
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
