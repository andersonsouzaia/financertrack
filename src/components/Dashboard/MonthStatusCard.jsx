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
      className="shadow-card-hover h-full flex flex-col justify-between group cursor-pointer transition-colors hover:border-border/80 hover:bg-muted/50"
      onClick={() => navigate('/transactions')}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 transition-transform group-hover:scale-110" />
            {currentMonth.mesNome}
          </div>
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${currentMonth.status === 'aberto'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-muted text-muted-foreground'
            }`}>
            {currentMonth.status === 'aberto' ? 'Em andamento' : 'Fechado'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-heading font-bold text-foreground">
              {currentMonth.daysRemaining}
            </span>
            <span className="text-sm text-muted-foreground ml-1">dias restantes</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {Math.round(currentMonth.progressPercentual || 0)}% decorrido
          </span>
        </div>

        <div className="space-y-2">
          <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${currentMonth.daysRemaining <= 5 ? 'bg-orange-500' : 'bg-primary'
                }`}
              style={{ width: `${Math.min(parseFloat(currentMonth.progressPercentual || 0), 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {currentMonth.currentDay} de {currentMonth.daysInMonth} dias
          </p>
        </div>

        <div className="pt-2">
          {currentMonth.status === 'aberto' && currentMonth.daysRemaining > 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleCloseMonth();
              }}
            >
              Encerrar Mês
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground text-center italic">
              {currentMonth.status === 'fechado'
                ? `Fechado em ${new Date(currentMonth.data_fechamento).toLocaleDateString('pt-BR')}`
                : 'Mês finalizado'
              }
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
