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
import { QuickTransactionForm } from "@/components/Dashboard/QuickTransactionForm";
import { CardExpensesOverview } from "@/components/Dashboard/CardExpensesOverview";
import { ensureRecentMonths, ensureSpecificMonthExists, getMonthName } from "@/lib/monthHelper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppLayout } from "@/components/layout/AppLayout";
import { Plus, Upload, TrendingUp, PiggyBank, Table, Calendar, Sparkles, Zap } from "lucide-react";
import { MonthSummaryCard } from "@/components/Dashboard/MonthSummaryCard";
import { Card, CardContent } from "@/components/ui/card";

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
      <Button variant="outline" size="sm" onClick={() => navigate('/import-statement')} className="gap-2 group">
        <Upload className="h-4 w-4 transition-transform group-hover:scale-110" />
        Extratos
      </Button>
      <Button variant="outline" size="sm" onClick={() => navigate('/budget-projection')} className="gap-2 group">
        <TrendingUp className="h-4 w-4 transition-transform group-hover:scale-110" />
        Projeções
      </Button>
      <Button variant="outline" size="sm" onClick={() => navigate('/transactions')} className="gap-2 group">
        <Table className="h-4 w-4 transition-transform group-hover:scale-110" />
        Tabela
      </Button>
      <Button variant="outline" size="sm" onClick={() => navigate('/assets')} className="gap-2 group">
        <PiggyBank className="h-4 w-4 transition-transform group-hover:scale-110" />
        Patrimônios
      </Button>
    </div>
  ), [navigate]);

  return (
    <AppLayout
      title="Dashboard"
      description="Acompanhe rapidamente o status financeiro do período selecionado."
      actions={headerActions}
    >
      <div className="w-full flex flex-col gap-8 md:gap-10">
        {/* Header Section - Month Selector + Quick Actions */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Mês de referência
                </p>
              </div>
              <Select
                value={selectedMonth?.id ?? ""}
                onValueChange={handleMonthChange}
                disabled={loadingMonths || monthOptions.length === 0}
              >
                <SelectTrigger className="min-w-[240px] md:min-w-[280px] h-12 rounded-[var(--radius-md)] text-base font-medium">
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

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <QuickTransactionForm month={selectedMonth} compact onSuccess={() => {}} />
            </div>
          </div>
        </div>

        {/* Main Metrics Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
            <BalanceCard />
          </div>
          <div className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
            <MonthSummaryCard month={selectedMonth} />
          </div>
          <div className="animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
            <EmergencyFundCard />
          </div>
          <div className="animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
            <MonthStatusCard
              month={selectedMonth}
              onMonthUpdated={(month) =>
                setMonths((prev) =>
                  prev.map((item) => (item.id === month.id ? month : item))
                )
              }
            />
          </div>
        </div>

        {/* Card Expenses Overview */}
        {selectedMonth && (
          <div className="animate-slide-in-up" style={{ animationDelay: '0.45s' }}>
            <CardExpensesOverview selectedMonth={selectedMonth} />
          </div>
        )}

        {/* Quick Transaction Form + Recent Transactions */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
            <TransactionsPreview month={selectedMonth} />
          </div>
          <div className="animate-slide-in-up" style={{ animationDelay: '0.6s' }}>
            <Card className="h-full border-border/50 bg-background/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold tracking-tight">Ações Rápidas</h3>
                </div>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => navigate('/import-statement')}
                  >
                    <Upload className="h-4 w-4" />
                    Importar Extrato
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => navigate('/budget-projection')}
                  >
                    <TrendingUp className="h-4 w-4" />
                    Projeção de Orçamento
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => navigate('/transactions')}
                  >
                    <Table className="h-4 w-4" />
                    Ver Todas as Transações
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => navigate('/assets')}
                  >
                    <PiggyBank className="h-4 w-4" />
                    Patrimônios e Ativos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Goals Section */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 animate-slide-in-up" style={{ animationDelay: '0.7s' }}>
            <MonthlyGoalsCard />
          </div>
          <div className="animate-slide-in-up" style={{ animationDelay: '0.8s' }}>
            <FinancialGoalsCard />
          </div>
        </div>

        {/* AI Assistant Section */}
        <div className="space-y-6 animate-slide-in-up" style={{ animationDelay: '0.9s' }}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight text-foreground">Assistente IA</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/chat')} className="gap-2">
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
