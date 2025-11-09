import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function MonthStatusCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [month, setMonth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthStatus();
  }, [user]);

  const fetchMonthStatus = async () => {
    if (!user) return;

    try {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const currentDay = today.getDate();
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const daysRemaining = daysInMonth - currentDay;

      const { data: monthData } = await supabase
        .from('meses_financeiros')
        .select('*')
        .eq('user_id', user.id)
        .eq('mes', currentMonth)
        .eq('ano', currentYear)
        .single();

      setMonth({
        ...monthData,
        daysRemaining,
        daysInMonth,
        currentDay
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching month status:', error);
      setLoading(false);
    }
  };

  const handleCloseMonth = async () => {
    if (!window.confirm('Tem certeza? Você não poderá mais editar transações deste mês.')) return;

    try {
      await supabase
        .from('meses_financeiros')
        .update({ status: 'fechado', data_fechamento: new Date().toISOString() })
        .eq('id', month.id);

      toast({
        title: "Mês fechado!",
        description: "O mês foi fechado com sucesso."
      });

      fetchMonthStatus();
    } catch (error) {
      console.error('Error closing month:', error);
      toast({
        variant: "destructive",
        title: "Erro ao fechar mês",
        description: error.message
      });
    }
  };

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

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <Card className="shadow-card-hover">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {month && `${monthNames[month.mes - 1]} ${month.ano}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-lg font-medium">
            Status: <strong>{month?.status === 'aberto' ? 'Aberto' : 'Fechado'}</strong>
          </p>
          {month?.status === 'aberto' && (
            <>
              <p className="text-sm text-muted-foreground">
                {month?.daysRemaining} dias restantes
              </p>
              <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleCloseMonth}>
                Fechar Mês
              </Button>
            </>
          )}
          {month?.status === 'fechado' && (
            <p className="text-sm text-muted-foreground">
              Fechado em {new Date(month.data_fechamento).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
