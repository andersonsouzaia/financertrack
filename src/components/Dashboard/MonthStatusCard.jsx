import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ensureMonthExists, getMonthName } from '@/lib/monthHelper';

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
      const { month: monthData } = await ensureMonthExists(user.id);

      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const currentDay = today.getDate();
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const daysRemaining = Math.max(0, daysInMonth - currentDay);

      const mesNome = getMonthName(currentMonth, currentYear);

      setMonth({
        ...monthData,
        daysRemaining,
        daysInMonth,
        currentDay,
        mesNome: mesNome.charAt(0).toUpperCase() + mesNome.slice(1)
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

  if (loading) return <div className="h-40 bg-muted rounded-lg animate-pulse" />;
  if (!month) return <div className="text-center text-muted-foreground">Carregando mês...</div>;

  const progressPercentual = ((month.currentDay / month.daysInMonth) * 100).toFixed(1);

  return (
    <Card className="shadow-card-hover">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {month.mesNome}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <span className={`font-semibold ${
              month.status === 'aberto'
                ? 'text-green-600 dark:text-green-400'
                : 'text-muted-foreground'
            }`}>
              {month.status === 'aberto' ? '🔓 Aberto' : '🔒 Fechado'}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Dias Restantes:</span>
            <span className="font-semibold text-foreground">
              {month.daysRemaining} de {month.daysInMonth} dias ({progressPercentual}%)
            </span>
          </div>

          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${Math.min(parseFloat(progressPercentual), 100)}%` }}
            />
          </div>

          {month.status === 'aberto' && month.daysRemaining > 0 && (
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleCloseMonth}>
              Fechar Mês
            </Button>
          )}

          {month.status === 'fechado' && month.data_fechamento && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Fechado em {new Date(month.data_fechamento).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
