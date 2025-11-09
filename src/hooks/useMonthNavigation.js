import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useMonthNavigation(userId) {
  const [months, setMonths] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadMonths();
    }
  }, [userId]);

  const loadMonths = async () => {
    try {
      const { data } = await supabase
        .from('meses_financeiros')
        .select('*')
        .eq('user_id', userId)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false });

      setMonths(data || []);
      if (data && data.length > 0) {
        setCurrentMonth(data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar meses:', error);
      setLoading(false);
    }
  };

  const goToNextMonth = () => {
    const idx = months.indexOf(currentMonth);
    if (idx < months.length - 1) {
      setCurrentMonth(months[idx + 1]);
    }
  };

  const goToPreviousMonth = () => {
    const idx = months.indexOf(currentMonth);
    if (idx > 0) {
      setCurrentMonth(months[idx - 1]);
    }
  };

  return {
    months,
    currentMonth,
    loading,
    goToNextMonth,
    goToPreviousMonth,
    setCurrentMonth,
    refreshMonths: loadMonths
  };
}
