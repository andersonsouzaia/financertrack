import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BalanceCard } from "@/components/Dashboard/BalanceCard";
import { MonthStatusCard } from "@/components/Dashboard/MonthStatusCard";
import { EmergencyFundCard } from "@/components/Dashboard/EmergencyFundCard";
import { ChatIA } from "@/components/Dashboard/ChatIA";
import { TransactionsPreview } from "@/components/Dashboard/TransactionsPreview";
import { MonthlyGoalsCard } from "@/components/Dashboard/MonthlyGoalsCard";
import { FinancialGoalsCard } from "@/components/Dashboard/FinancialGoalsCard";
import { ensureRecentMonths, ensureSpecificMonthExists, getMonthName } from "@/lib/monthHelper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppLayout } from "@/components/layout/AppLayout";
import { Plus, Upload, TrendingUp, PiggyBank, Table } from "lucide-react";
import { MonthSummaryCard } from "@/components/Dashboard/MonthSummaryCard";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingMonths, setLoadingMonths] = useState(true);
  const [months, setMonths] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<any | null>(null);

  useEffect(() => {
    if (user === null) {
      navigate('/login', { replace: true });
      return;
    }

    // Verificar se é o primeiro acesso e onboarding não foi completado
    const checkOnboarding = async () => {
      try {
        const { data: onboardingData } = await supabase
          .from('configuracao_onboarding')
          .select('onboarding_completo')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!onboardingData?.onboarding_completo) {
          navigate('/onboarding', { replace: true });
        }
      } catch (error) {
        console.error('Erro ao verificar onboarding:', error);
      }
    };

    checkOnboarding();
  }, [user, navigate]);

  // Usar React Query para cachear meses
  const { data: monthsData, isLoading: isLoadingMonths } = useQuery({
    queryKey: ['months', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await ensureRecentMonths(user.id, 12);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  useEffect(() => {
    if (monthsData) {
      setMonths(monthsData);
      setSelectedMonth((current) => current ?? monthsData[0] ?? null);
    }
  }, [monthsData]);

  useEffect(() => {
    setLoadingMonths(isLoadingMonths);
  }, [isLoadingMonths]);

  const monthOptions = useMemo(() => {
    return months.map((mes) => ({
      id: mes.id,
      label: getMonthName(mes.mes, mes.ano),
    }));
  }, [months]);

  const handleMonthChange = useCallback(async (value: string) => {
    if (!user) return;
    const found = months.find((mes) => mes.id === value);
    if (found) {
      setSelectedMonth(found);
      return;
    }

    const [anoStr, mesStr] = value.split("-");
    const ano = Number(anoStr);
    const mes = Number(mesStr);

    if (Number.isNaN(ano) || Number.isNaN(mes)) return;

    try {
      const ensured = await ensureSpecificMonthExists(user.id, mes, ano);
      setMonths((prev) => {
        const already = prev.find((item) => item.id === ensured.id);
        if (already) return prev;
        return [...prev, ensured].sort((a, b) => {
          if (a.ano === b.ano) return b.mes - a.mes;
          return b.ano - a.ano;
        });
      });
      setSelectedMonth(ensured);
    } catch (error) {
      console.error("Erro ao garantir mês:", error);
    }
  }, [user, months]);

  if (!user) {
    return null;
  }

  const headerActions = useMemo(() => (
    <div className="hidden items-center gap-2 sm:flex">
      <Button variant="outline" size="sm" onClick={() => navigate('/import-statement')} className="gap-2">
        <Upload className="h-4 w-4" />
        Extratos
      </Button>
      <Button variant="outline" size="sm" onClick={() => navigate('/budget-projection')} className="gap-2">
        <TrendingUp className="h-4 w-4" />
        Projeções
      </Button>
      <Button variant="outline" size="sm" onClick={() => navigate('/transactions')} className="gap-2">
        <Table className="h-4 w-4" />
        Tabela
      </Button>
      <Button variant="outline" size="sm" onClick={() => navigate('/assets')} className="gap-2">
        <PiggyBank className="h-4 w-4" />
        Patrimônios
      </Button>
      <Button size="sm" onClick={() => navigate('/transactions?nova=1')} className="gap-2">
        <Plus className="h-4 w-4" />
        Adicionar
      </Button>
    </div>
  ), [navigate]);

  return (
    <AppLayout
      title="Dashboard"
      description="Acompanhe rapidamente o status financeiro do período selecionado."
      actions={headerActions}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Mês de referência</p>
            <Select
              value={selectedMonth?.id ?? ""}
              onValueChange={handleMonthChange}
              disabled={loadingMonths || monthOptions.length === 0}
            >
              <SelectTrigger className="min-w-[220px] md:min-w-[260px]">
                <SelectValue placeholder={loadingMonths ? "Carregando..." : "Selecione o mês"} />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
                {selectedMonth && !monthOptions.some((opt) => opt.id === selectedMonth.id) && (
                  <SelectItem value={`${selectedMonth.ano}-${String(selectedMonth.mes).padStart(2, "0")}`}>
                    {getMonthName(selectedMonth.mes, selectedMonth.ano)}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <Button variant="outline" size="sm" onClick={() => navigate('/transactions')}>
              <Table className="mr-2 h-4 w-4" />
              Tabela
            </Button>
            <Button size="sm" onClick={() => navigate('/transactions?nova=1')}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <BalanceCard />
          <MonthSummaryCard month={selectedMonth} />
          <EmergencyFundCard />
          <MonthStatusCard
            month={selectedMonth}
            onMonthUpdated={(month) =>
              setMonths((prev) =>
                prev.map((item) => (item.id === month.id ? month : item))
              )
            }
          />
        </div>

        <TransactionsPreview month={selectedMonth} />

        <div className="grid gap-6 md:grid-cols-2">
          <MonthlyGoalsCard />
          <FinancialGoalsCard />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold text-foreground">Assistente IA</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/chat')}>
              Abrir histórico
            </Button>
          </div>
          <ChatIA
            embedded
            allowSessionReset
            onRequestOpenChatPage={() => navigate('/chat')}
          />
        </div>
      </div>
    </AppLayout>
  );
}
