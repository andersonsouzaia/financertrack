import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function BalanceCard() {
  const { user } = useAuth();
  const [saldo, setSaldo] = useState(0);
  const [renda, setRenda] = useState(0);
  const [status, setStatus] = useState('neutral');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch income
        const { data: config } = await supabase
          .from('configuracao_usuario')
          .select('renda_mensal')
          .eq('user_id', user.id)
          .single();

        // Fetch total balance (SUM of all accounts)
        const { data: accounts } = await supabase
          .from('bancos_contas')
          .select('saldo_atual')
          .eq('user_id', user.id)
          .eq('ativo', true);

        const totalBalance = accounts?.reduce((sum, c) => sum + Number(c.saldo_atual), 0) || 0;
        const monthlyIncome = config?.renda_mensal || 0;

        // Calculate status
        const percentage = monthlyIncome > 0 ? (totalBalance / monthlyIncome) * 100 : 0;
        let statusColor = 'neutral';
        let statusText = 'Neutro';
        
        if (percentage >= 200) {
          statusColor = 'excellent';
          statusText = 'Ótimo (2x+ renda)';
        } else if (percentage >= 100) {
          statusColor = 'good';
          statusText = 'Bom (1-2x renda)';
        } else if (percentage >= 30) {
          statusColor = 'verde';
          statusText = 'Saudável';
        } else if (percentage >= 10) {
          statusColor = 'amarelo';
          statusText = 'Atenção';
        } else if (percentage >= 5) {
          statusColor = 'vermelho';
          statusText = 'Crítico';
        } else {
          statusColor = 'vermelho-escuro';
          statusText = 'Emergência';
        }

        setSaldo(totalBalance);
        setRenda(monthlyIncome);
        setStatus({ color: statusColor, text: statusText });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching balance data:', error);
        setLoading(false);
      }
    };

    fetchData();

    // Real-time subscription
    const channel = supabase
      .channel('balance-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bancos_contas' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted rounded-[var(--radius-sm)]"></div>
            <div className="h-4 w-24 bg-muted rounded-[var(--radius-sm)]"></div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            <div className="h-8 w-32 bg-muted rounded-[var(--radius-sm)]"></div>
            <div className="h-3 w-20 bg-muted rounded-[var(--radius-sm)]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusColors = {
    'excellent': 'border-l-balance-excellent',
    'good': 'border-l-balance-excellent',
    'verde': 'border-l-success',
    'amarelo': 'border-l-warning',
    'vermelho': 'border-l-danger',
    'vermelho-escuro': 'border-l-danger',
    'neutral': 'border-l-muted'
  };

  return (
    <Card className={`group border-l-4 ${statusColors[status.color] || 'border-l-muted'} relative overflow-hidden`}>
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      
      <CardHeader className="relative z-10 p-4">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Wallet className="w-4 h-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
          Saldo Total
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10 p-4 pt-0">
        <div className="space-y-2">
          <p className="text-3xl font-heading font-bold text-balance-excellent transition-all duration-500 group-hover:scale-105 inline-block">
            R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">
            Renda: R$ {renda.toLocaleString('pt-BR')}/mês
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-balance-excellent bg-balance-excellent/10 px-2 py-1 rounded-[var(--radius-sm)]">
              ✓ {status.text}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
