import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function ExpensesCard() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = async () => {
      if (!user) return;

      try {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;

        // Fetch current month
        const { data: month } = await supabase
          .from('meses_financeiros')
          .select('id')
          .eq('user_id', user.id)
          .eq('mes', currentMonth)
          .eq('ano', currentYear)
          .single();

        if (!month) {
          setLoading(false);
          return;
        }

        // Fetch income
        const { data: config } = await supabase
          .from('configuracao_usuario')
          .select('renda_mensal')
          .eq('user_id', user.id)
          .single();

        // Fetch total expenses
        const { data: transactions } = await supabase
          .from('transacoes')
          .select('valor_original')
          .eq('mes_financeiro_id', month.id)
          .in('tipo', ['saida_fixa', 'diario'])
          .eq('deletado', false);

        const totalExpenses = transactions?.reduce((sum, t) => sum + Number(t.valor_original), 0) || 0;
        const income = config?.renda_mensal || 0;
        const perc = income > 0 ? (totalExpenses / income) * 100 : 0;

        setExpenses(totalExpenses);
        setPercentage(perc);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        setLoading(false);
      }
    };

    fetchExpenses();

    // Real-time subscription
    const channel = supabase
      .channel('expenses-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'transacoes' },
        () => fetchExpenses()
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
    <Card className="shadow-card-hover">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Gastos do Mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-3xl font-heading font-bold">
            R$ {expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">
            {percentage.toFixed(1)}% da renda mensal
          </p>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all" 
              style={{ width: `${Math.min(percentage, 100)}%` }} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
