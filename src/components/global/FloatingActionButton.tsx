import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, X, ArrowDownCircle, ArrowUpCircle, Wallet, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { QuickTransactionForm } from "@/components/Dashboard/QuickTransactionForm";
import { CardForm } from "@/components/Dashboard/CardForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  variant?: "default" | "destructive";
}

export function FloatingActionButton() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [transactionType, setTransactionType] = useState<"entrada" | "diario" | null>(null);
  const [currentMonth, setCurrentMonth] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Buscar mês atual quando necessário
  useEffect(() => {
    if (user && showTransactionForm) {
      fetchCurrentMonth();
    }
  }, [user, showTransactionForm]);

  const fetchCurrentMonth = async () => {
    if (!user) return;
    try {
      const today = new Date();
      const mes = today.getMonth() + 1;
      const ano = today.getFullYear();

      const { data: monthData } = await supabase
        .from("meses_financeiros")
        .select("*")
        .eq("user_id", user.id)
        .eq("mes", mes)
        .eq("ano", ano)
        .maybeSingle();

      if (monthData) {
        setCurrentMonth(monthData);
      }
    } catch (error) {
      console.error("Erro ao buscar mês atual:", error);
    }
  };

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Ações contextuais baseadas na página atual
  const getContextualActions = (): QuickAction[] => {
    const path = location.pathname;

    // Dashboard: Máximo 2 ações - Gasto e Ganho
    if (path === "/dashboard") {
      return [
        {
          id: "expense",
          label: "Adicionar Gasto",
          icon: ArrowDownCircle,
          action: () => {
            setTransactionType("diario");
            setShowTransactionForm(true);
            setIsOpen(false);
          },
          variant: "destructive",
        },
        {
          id: "income",
          label: "Adicionar Ganho",
          icon: ArrowUpCircle,
          action: () => {
            setTransactionType("entrada");
            setShowTransactionForm(true);
            setIsOpen(false);
          },
        },
      ];
    }

    // Transações: Adicionar transação
    if (path === "/transactions") {
      return [
        {
          id: "transaction",
          label: "Nova Transação",
          icon: Plus,
          action: () => {
            navigate("/transactions?nova=1");
            setIsOpen(false);
          },
        },
      ];
    }

    // Cartões: Adicionar cartão
    if (path === "/cards" || path.startsWith("/cards/")) {
      return [
        {
          id: "card",
          label: "Novo Cartão",
          icon: Wallet,
          action: () => {
            setShowCardForm(true);
            setIsOpen(false);
          },
        },
      ];
    }

    // Metas: Criar meta
    if (path === "/monthly-goals" || path === "/financial-goals") {
      return [
        {
          id: "goal",
          label: "Nova Meta",
          icon: Target,
          action: () => {
            navigate("/monthly-goals");
            setIsOpen(false);
          },
        },
      ];
    }

    // Padrão: Apenas adicionar transação
    return [
      {
        id: "transaction",
        label: "Nova Transação",
        icon: Plus,
        action: () => {
          navigate("/transactions");
          setIsOpen(false);
        },
      },
    ];
  };

  const actions = getContextualActions();

  // Se não houver ações, não mostrar o FAB
  if (actions.length === 0) {
    return null;
  }

  return (
    <>
      <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
        {/* Menu de ações - Layout vertical simples para não sair da tela */}
        {isOpen && actions.length > 0 && (
          <div className="absolute bottom-full right-0 mb-3 flex flex-col-reverse gap-2">
            {actions.map((action, index) => (
              <div
                key={action.id}
                className="flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* Label */}
                <div className="px-3 py-1.5 rounded-md bg-popover text-popover-foreground text-sm font-medium shadow-lg border border-border whitespace-nowrap">
                  {action.label}
                </div>
                {/* Botão */}
                <Button
                  onClick={action.action}
                  variant={action.variant || "default"}
                  size="lg"
                  className={cn(
                    "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
                    "hover:scale-110 flex items-center justify-center shrink-0",
                    action.variant === "destructive" && "bg-destructive hover:bg-destructive/90"
                  )}
                  title={action.label}
                >
                  <action.icon className="h-6 w-6 text-white" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Botão principal */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
            "bg-primary hover:bg-primary/90 flex items-center justify-center",
            isOpen && "rotate-45"
          )}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Plus className="h-6 w-6 text-white" />
          )}
        </Button>
      </div>

      {/* Formulário de Transação */}
      {showTransactionForm && currentMonth && (
        <QuickTransactionForm
          month={currentMonth}
          compact
          onSuccess={() => {
            setShowTransactionForm(false);
            setTransactionType(null);
            toast({
              title: "Transação adicionada!",
              description: "Sua transação foi registrada com sucesso.",
            });
          }}
        />
      )}

      {/* Formulário de Cartão */}
      {showCardForm && (
        <CardForm
          open={showCardForm}
          onOpenChange={setShowCardForm}
          onSuccess={() => {
            setShowCardForm(false);
            toast({
              title: "Cartão criado!",
              description: "O cartão foi criado com sucesso.",
            });
          }}
        />
      )}
    </>
  );
}
