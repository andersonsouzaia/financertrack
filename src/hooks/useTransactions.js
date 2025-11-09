import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useTransactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ entradas: 0, saidas: 0, diario: 0 });

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;

      // Get current month
      const { data: monthData } = await supabase
        .from('meses_financeiros')
        .select('id')
        .eq('user_id', user.id)
        .eq('mes', month)
        .eq('ano', year)
        .single();

      if (!monthData) {
        setLoading(false);
        return;
      }

      // Fetch transactions
      const { data, error } = await supabase
        .from('transacoes')
        .select(`
          *,
          categoria:categorias_saidas(nome, icone, cor)
        `)
        .eq('mes_financeiro_id', monthData.id)
        .eq('deletado', false)
        .order('dia', { ascending: true });

      if (error) throw error;

      setTransactions(data || []);

      // Calculate totals
      const calculatedTotals = {
        entradas: data?.filter(t => t.tipo === 'entrada').reduce((sum, t) => sum + Number(t.valor_original), 0) || 0,
        saidas: data?.filter(t => t.tipo === 'saida_fixa').reduce((sum, t) => sum + Number(t.valor_original), 0) || 0,
        diario: data?.filter(t => t.tipo === 'diario').reduce((sum, t) => sum + Number(t.valor_original), 0) || 0,
      };
      setTotals(calculatedTotals);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar transações",
        description: error.message
      });
      setLoading(false);
    }
  };

  const addTransaction = async (transactionData) => {
    try {
      const { error } = await supabase
        .from('transacoes')
        .insert(transactionData);

      if (error) throw error;

      toast({
        title: "Transação registrada!",
        description: "A transação foi adicionada com sucesso."
      });

      await fetchTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar transação",
        description: error.message
      });
    }
  };

  const deleteTransaction = async (id) => {
    try {
      const { error } = await supabase
        .from('transacoes')
        .update({ deletado: true })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Transação deletada",
        description: "A transação foi removida com sucesso."
      });

      await fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        variant: "destructive",
        title: "Erro ao deletar transação",
        description: error.message
      });
    }
  };

  useEffect(() => {
    fetchTransactions();

    // Real-time subscription
    const channel = supabase
      .channel('transacoes-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'transacoes' },
        () => fetchTransactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    transactions,
    totals,
    loading,
    addTransaction,
    deleteTransaction,
    refreshTransactions: fetchTransactions
  };
}
