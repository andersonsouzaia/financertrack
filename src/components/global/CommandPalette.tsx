import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Table,
  CreditCard,
  Target,
  TrendingUp,
  Calculator,
  FileText,
  PiggyBank,
  MessageSquarePlus,
  Settings,
  Upload,
  Receipt,
  Layers,
  Wallet,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: "navigation" | "actions" | "quick";
  keywords?: string[];
}

export function CommandPalette() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = useMemo(
    () => [
      // Navegação
      {
        id: "dashboard",
        label: "Dashboard",
        description: "Ir para o dashboard principal",
        icon: LayoutDashboard,
        category: "navigation",
        action: () => navigate("/dashboard"),
        keywords: ["dashboard", "inicio", "principal"],
      },
      {
        id: "transactions",
        label: "Transações",
        description: "Ver e gerenciar transações",
        icon: Table,
        category: "navigation",
        action: () => navigate("/transactions"),
        keywords: ["transacoes", "transações", "gastos", "receitas"],
      },
      {
        id: "cards",
        label: "Cartões",
        description: "Gerenciar cartões de crédito/débito",
        icon: CreditCard,
        category: "navigation",
        action: () => navigate("/cards"),
        keywords: ["cartoes", "cartões", "faturas"],
      },
      {
        id: "monthly-goals",
        label: "Metas Mensais",
        description: "Ver e criar metas mensais",
        icon: Target,
        category: "navigation",
        action: () => navigate("/monthly-goals"),
        keywords: ["metas", "mensais", "objetivos"],
      },
      {
        id: "financial-goals",
        label: "Metas Financeiras",
        description: "Ver e criar metas financeiras",
        icon: Target,
        category: "navigation",
        action: () => navigate("/financial-goals"),
        keywords: ["metas", "financeiras", "objetivos"],
      },
      {
        id: "budget-projection",
        label: "Projeções",
        description: "Ver projeções de orçamento",
        icon: TrendingUp,
        category: "navigation",
        action: () => navigate("/budget-projection"),
        keywords: ["projeções", "orçamento", "projecoes"],
      },
      {
        id: "compound-interest",
        label: "Calculadora de Juros",
        description: "Calcular juros compostos",
        icon: Calculator,
        category: "navigation",
        action: () => navigate("/compound-interest"),
        keywords: ["calculadora", "juros", "compostos"],
      },
      {
        id: "monthly-summary",
        label: "Resumo Mensal",
        description: "Ver resumo do mês",
        icon: FileText,
        category: "navigation",
        action: () => navigate("/monthly-summary"),
        keywords: ["resumo", "mensal"],
      },
      {
        id: "annual-summary",
        label: "Resumo Anual",
        description: "Ver resumo do ano",
        icon: FileText,
        category: "navigation",
        action: () => navigate("/annual-summary"),
        keywords: ["resumo", "anual"],
      },
      {
        id: "assets",
        label: "Patrimônios",
        description: "Gerenciar patrimônios e ativos",
        icon: PiggyBank,
        category: "navigation",
        action: () => navigate("/assets"),
        keywords: ["patrimônios", "patrimonios", "ativos"],
      },
      {
        id: "chat",
        label: "Chat IA",
        description: "Conversar com o assistente IA",
        icon: MessageSquarePlus,
        category: "navigation",
        action: () => navigate("/chat"),
        keywords: ["chat", "ia", "assistente"],
      },
      {
        id: "import-statement",
        label: "Importar Extrato",
        description: "Importar extrato bancário",
        icon: Upload,
        category: "navigation",
        action: () => navigate("/import-statement"),
        keywords: ["importar", "extrato"],
      },
      {
        id: "settings",
        label: "Configurações",
        description: "Abrir configurações",
        icon: Settings,
        category: "navigation",
        action: () => navigate("/settings"),
        keywords: ["configurações", "configuracoes", "settings"],
      },
      // Ações rápidas
      {
        id: "quick-transaction",
        label: "Nova Transação",
        description: "Adicionar uma nova transação rapidamente",
        icon: Receipt,
        category: "actions",
        action: () => {
          navigate("/transactions");
          setOpen(false);
        },
        keywords: ["nova", "transação", "adicionar", "gasto"],
      },
      {
        id: "quick-category",
        label: "Criar Categoria",
        description: "Criar uma nova categoria",
        icon: Layers,
        category: "actions",
        action: () => {
          navigate("/transactions");
          setOpen(false);
        },
        keywords: ["criar", "categoria"],
      },
      {
        id: "quick-card",
        label: "Criar Cartão",
        description: "Cadastrar um novo cartão",
        icon: Wallet,
        category: "actions",
        action: () => {
          navigate("/cards");
          setOpen(false);
        },
        keywords: ["criar", "cartão", "cartao"],
      },
    ],
    [navigate]
  );

  const filteredCommands = useMemo(() => {
    if (!search.trim()) {
      return commands;
    }

    const searchLower = search.toLowerCase();
    return commands.filter((cmd) => {
      const matchesLabel = cmd.label.toLowerCase().includes(searchLower);
      const matchesDescription = cmd.description?.toLowerCase().includes(searchLower);
      const matchesKeywords = cmd.keywords?.some((kw) =>
        kw.toLowerCase().includes(searchLower)
      );
      return matchesLabel || matchesDescription || matchesKeywords;
    });
  }, [commands, search]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      navigation: [],
      actions: [],
      quick: [],
    };

    filteredCommands.forEach((cmd) => {
      groups[cmd.category].push(cmd);
    });

    return groups;
  }, [filteredCommands]);

  // Atalho de teclado Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }

      if (open) {
        if (e.key === "Escape") {
          setOpen(false);
          setSearch("");
          setSelectedIndex(0);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
        } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
          e.preventDefault();
          filteredCommands[selectedIndex].action();
          setOpen(false);
          setSearch("");
          setSelectedIndex(0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, filteredCommands, selectedIndex]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedIndex(0);
    }
  }, [open]);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            Command Palette
          </DialogTitle>
          <DialogDescription>
            Navegue rapidamente ou execute ações. Use as setas para navegar e Enter para selecionar.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          <Input
            placeholder="Digite para buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 text-base"
            autoFocus
          />
        </div>

        <ScrollArea className="max-h-[400px] px-6">
          <div className="space-y-6 pb-6">
            {/* Navegação */}
            {groupedCommands.navigation.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground px-2">
                  Navegação
                </h3>
                <div className="space-y-1">
                  {groupedCommands.navigation.map((cmd, idx) => {
                    const globalIndex = filteredCommands.indexOf(cmd);
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          setOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left",
                          "transition-colors duration-150",
                          "hover:bg-accent",
                          globalIndex === selectedIndex && "bg-accent"
                        )}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                      >
                        <cmd.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{cmd.label}</p>
                          {cmd.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {cmd.description}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ações Rápidas */}
            {groupedCommands.actions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground px-2">
                  Ações Rápidas
                </h3>
                <div className="space-y-1">
                  {groupedCommands.actions.map((cmd, idx) => {
                    const globalIndex = filteredCommands.indexOf(cmd);
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          setOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left",
                          "transition-colors duration-150",
                          "hover:bg-accent",
                          globalIndex === selectedIndex && "bg-accent"
                        )}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                      >
                        <cmd.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{cmd.label}</p>
                          {cmd.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {cmd.description}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Resultado vazio */}
            {filteredCommands.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhum resultado encontrado para "{search}"
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">↑↓</kbd>
              <span>navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Enter</kbd>
              <span>selecionar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Esc</kbd>
              <span>fechar</span>
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
