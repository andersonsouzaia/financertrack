import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function BalanceCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saldo, setSaldo] = useState(0);
  const [renda, setRenda] = useState(0);
  const [status, setStatus] = useState({ color: 'neutral', text: 'Neutro' });
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
        let color = 'neutral';
        let text = 'Neutro';

        if (percentage >= 200) {
          color = 'excellent';
          text = 'Ótimo (2x+ renda)';
        } else if (percentage >= 100) {
          color = 'good';
          text = 'Bom (1-2x renda)';
        } else if (percentage >= 30) {
          color = 'verde';
          text = 'Saudável';
        } else if (percentage >= 10) {
          color = 'amarelo';
          text = 'Atenção';
        } else if (percentage >= 5) {
          color = 'vermelho';
          text = 'Crítico';
        } else {
          color = 'vermelho-escuro';
          text = 'Emergência';
        }

        setSaldo(totalBalance);
        setRenda(monthlyIncome);
        setStatus({ color, text });
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
    <Card
      className={`group border-l-4 ${statusColors[status.color] || 'border-l-muted'} relative overflow-hidden h-full flex flex-col justify-between cursor-pointer transition-all duration-300 hover:bg-muted/30 border border-border/50`}
      onClick={() => navigate('/assets', { state: { tab: 'bancos' } })}
    >
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-primary/10"></div>

      <CardHeader className="relative z-10 pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Wallet className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
          </div>
          Saldo Total
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 space-y-6 flex-grow flex flex-col justify-between">
        <div className="transition-transform duration-500 group-hover:translate-x-1">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-heading font-black text-foreground tracking-tight">
              R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2 px-2 py-0.5 bg-muted/50 rounded-md inline-block">
            Renda: R$ {renda.toLocaleString('pt-BR')} <span className="text-[8px] font-medium">/mês</span>
          </p>
        </div>

        {status.color !== 'neutral' && (
          <div className={`inline-flex items-center gap-2.5 px-3 py-2 rounded-xl border backdrop-blur-md shadow-sm transition-all duration-300 group-hover:shadow-md ${status.color.includes('vermelho') ? 'bg-rose-500/5 border-rose-500/20' :
            status.color === 'excellent' ? 'bg-indigo-500/5 border-indigo-500/20' :
              'bg-emerald-500/5 border-emerald-500/20'}`}>
            <span className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--status-color),0.5)] ${status.color === 'excellent' ? 'bg-indigo-500' :
              status.color === 'good' ? 'bg-emerald-500' :
                status.color === 'verde' ? 'bg-green-500' :
                  status.color === 'amarelo' ? 'bg-yellow-500' :
                    'bg-red-500'
              }`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${status.color.includes('vermelho') ? 'text-rose-600 dark:text-rose-400' :
              status.color === 'excellent' ? 'text-indigo-600 dark:text-indigo-400' :
                'text-emerald-600 dark:text-emerald-400'}`}>
              {status.text}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
