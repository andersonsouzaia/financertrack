import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Plus,
  X,
  CreditCard,
  Layers,
  Target,
  Receipt,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
// QuickTransactionForm será usado via navegação ou componente separado
import { CardForm } from "@/components/Dashboard/CardForm";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  color?: string;
}

export function FloatingActionButton() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<any>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    nome: "",
    icone: "📌",
    cor: "#10b981",
    tipo: "variavel",
  });
  const [creatingCategory, setCreatingCategory] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Buscar mês atual
  useEffect(() => {
    if (user && isOpen) {
      fetchCurrentMonth();
    }
  }, [user, isOpen]);

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

  const handleCreateCategory = async () => {
    if (!user || !categoryForm.nome.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha o nome da categoria.",
      });
      return;
    }

    setCreatingCategory(true);
    try {
      const { error } = await supabase.from("categorias_saidas").insert({
        user_id: user.id,
        nome: categoryForm.nome.trim(),
        icone: categoryForm.icone,
        cor: categoryForm.cor,
        tipo: categoryForm.tipo,
      });

      if (error) throw error;

      toast({
        title: "Categoria criada!",
        description: `A categoria "${categoryForm.nome}" foi criada com sucesso.`,
      });

      setCategoryForm({
        nome: "",
        icone: "📌",
        cor: "#10b981",
        tipo: "variavel",
      });
      setShowCategoryForm(false);
      setIsOpen(false);
    } catch (error: any) {
      console.error("Erro ao criar categoria:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível criar a categoria.",
      });
    } finally {
      setCreatingCategory(false);
    }
  };

  const actions: QuickAction[] = [
    {
      id: "transaction",
      label: "Nova Transação",
      icon: Receipt,
      action: () => {
        navigate("/transactions");
        setIsOpen(false);
      },
      color: "bg-primary",
    },
    {
      id: "card-expense",
      label: "Gasto no Cartão",
      icon: CreditCard,
      action: () => {
        navigate("/transactions");
        setIsOpen(false);
      },
      color: "bg-emerald-500",
    },
    {
      id: "category",
      label: "Criar Categoria",
      icon: Layers,
      action: () => {
        setShowCategoryForm(true);
        setIsOpen(false);
      },
      color: "bg-blue-500",
    },
    {
      id: "card",
      label: "Criar Cartão",
      icon: Wallet,
      action: () => {
        setShowCardForm(true);
        setIsOpen(false);
      },
      color: "bg-purple-500",
    },
    {
      id: "goal",
      label: "Criar Meta",
      icon: Target,
      action: () => {
        navigate("/monthly-goals");
        setIsOpen(false);
      },
      color: "bg-orange-500",
    },
  ];

  const angleStep = (2 * Math.PI) / actions.length;
  const radius = 80; // Distância do botão principal

  return (
    <>
      <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
        {/* Menu de ações */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 mb-2 space-y-2">
            {actions.map((action, index) => {
              const angle = index * angleStep - Math.PI / 2; // Começar do topo
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <div
                  key={action.id}
                  className="absolute"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    transition: "all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <Button
                    onClick={action.action}
                    className={cn(
                      "h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
                      "hover:scale-110 flex items-center justify-center",
                      action.color || "bg-primary"
                    )}
                    title={action.label}
                  >
                    <action.icon className="h-5 w-5 text-white" />
                  </Button>
                  <div
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 right-full mr-2",
                      "px-2 py-1 rounded-md bg-popover text-popover-foreground text-xs font-medium",
                      "shadow-md whitespace-nowrap pointer-events-none",
                      "opacity-0 group-hover:opacity-100 transition-opacity"
                    )}
                    style={{
                      transform: `translate(${x > 0 ? "-100%" : "0"}, -50%)`,
                    }}
                  >
                    {action.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Botão principal */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
            "bg-primary hover:bg-primary/90 flex items-center justify-center",
            isOpen && "rotate-45"
          )}
          size="lg"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Plus className="h-6 w-6 text-white" />
          )}
        </Button>
      </div>


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

      {/* Dialog de Categoria */}
      <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Criar Nova Categoria</DialogTitle>
            <DialogDescription>
              Adicione uma nova categoria para organizar seus gastos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Categoria</Label>
              <Input
                value={categoryForm.nome}
                onChange={(e) =>
                  setCategoryForm((prev) => ({ ...prev, nome: e.target.value }))
                }
                placeholder="Ex: Alimentação, Transporte..."
              />
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <Input
                value={categoryForm.icone}
                onChange={(e) =>
                  setCategoryForm((prev) => ({ ...prev, icone: e.target.value }))
                }
                placeholder="Emoji ou símbolo"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <Input
                type="color"
                value={categoryForm.cor}
                onChange={(e) =>
                  setCategoryForm((prev) => ({ ...prev, cor: e.target.value }))
                }
                className="h-12"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowCategoryForm(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateCategory}
                disabled={creatingCategory || !categoryForm.nome.trim()}
                className="flex-1"
              >
                {creatingCategory ? "Criando..." : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
