import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, ArrowUpCircle, ArrowDownCircle, Calendar, CreditCard, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Stepper } from "@/components/ui/stepper";
import { STEPS, BUTTONS } from "@/lib/microcopy";

interface QuickTransactionFormProps {
  month: any;
  onSuccess?: () => void;
  compact?: boolean;
}

export function QuickTransactionForm({
  month,
  onSuccess,
  compact = false,
}: QuickTransactionFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [isCardExpenseMode, setIsCardExpenseMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    tipo: "diario" as "entrada" | "saida_fixa" | "diario",
    descricao: "",
    valor: "",
    categoria_id: "",
    banco_conta_id: "",
    cartao_id: "",
    dia: new Date().getDate(),
  });

  const steps = [STEPS.whoReceives, STEPS.howMuch, STEPS.when, STEPS.confirm];

  useEffect(() => {
    if (open && user) {
      fetchData();
    }
  }, [open, user]);

  const fetchData = async () => {
    try {
      const [catsRes, accsRes, cardsRes] = await Promise.all([
        supabase
          .from("categorias_saidas")
          .select("*")
          .eq("user_id", user?.id)
          .order("nome"),
        supabase
          .from("bancos_contas")
          .select("*")
          .eq("user_id", user?.id)
          .eq("ativo", true)
          .order("nome"),
        user
          ? supabase
              .from("cartoes")
              .select("*")
              .eq("user_id", user.id)
              .eq("ativo", true)
              .order("nome")
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (catsRes.data) setCategorias(catsRes.data);
      if (accsRes.data) setContas(accsRes.data);
      if (cardsRes.data) setCartoes(cardsRes.data);

      // Set defaults
      if (catsRes.data?.[0] && !formData.categoria_id) {
        setFormData((prev) => ({
          ...prev,
          categoria_id: catsRes.data[0].id,
        }));
      }
      if (accsRes.data?.[0] && !formData.banco_conta_id) {
        setFormData((prev) => ({
          ...prev,
          banco_conta_id: accsRes.data[0].id,
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleNext = () => {
    // Validações por etapa
    if (currentStep === 1) {
      // Etapa 1: Quem recebe? - Tipo deve estar selecionado
      if (!formData.tipo) {
        toast({
          variant: "destructive",
          title: "Selecione o tipo",
          description: "Escolha se é entrada ou saída.",
        });
        return;
      }
    } else if (currentStep === 2) {
      // Etapa 2: Quanto? - Valor deve estar preenchido
      const valorNumerico = parseFloat(formData.valor);
      if (!formData.valor || !isFinite(valorNumerico) || valorNumerico <= 0) {
        toast({
          variant: "destructive",
          title: "Valor inválido",
          description: "Informe um valor válido.",
        });
        return;
      }
    } else if (currentStep === 3) {
      // Etapa 3: Quando? - Categoria e conta devem estar preenchidos
      if (!formData.categoria_id || !formData.banco_conta_id) {
        toast({
          variant: "destructive",
          title: "Campos obrigatórios",
          description: "Preencha categoria e conta.",
        });
        return;
      }
      if (isCardExpenseMode && !formData.cartao_id) {
        toast({
          variant: "destructive",
          title: "Cartão obrigatório",
          description: "Selecione um cartão para adicionar o gasto.",
        });
        return;
      }
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user || !month) return;

    const valorNumerico = parseFloat(formData.valor);
    
    // Validação: se modo cartão ativado, cartão é obrigatório
    if (isCardExpenseMode && !formData.cartao_id) {
      toast({
        variant: "destructive",
        title: "Cartão obrigatório",
        description: "Selecione um cartão para adicionar o gasto.",
      });
      return;
    }

    // Validação: se cartão selecionado, tipo deve ser saída
    if (formData.cartao_id && formData.tipo === "entrada") {
      toast({
        variant: "destructive",
        title: "Tipo inválido",
        description: "Gastos em cartão devem ser do tipo saída.",
      });
      return;
    }

    if (
      !formData.descricao.trim() ||
      !formData.categoria_id ||
      !isFinite(valorNumerico) ||
      valorNumerico <= 0
    ) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha descrição, valor e categoria.",
      });
      return;
    }

    setLoading(true);
    try {
      const contaAtual = contas.find((c) => c.id === formData.banco_conta_id);
      if (!contaAtual) {
        throw new Error("Conta selecionada não encontrada");
      }

      const { data: transData, error: transError } = await supabase
        .from("transacoes")
        .insert({
          user_id: user.id,
          mes_financeiro_id: month.id,
          categoria_id: formData.categoria_id,
          banco_conta_id: formData.banco_conta_id,
          cartao_id: formData.cartao_id && formData.cartao_id !== "__none__" ? formData.cartao_id : null,
          tipo: formData.tipo,
          descricao: formData.descricao.trim(),
          valor_original: valorNumerico,
          moeda_original: "BRL",
          dia: parseInt(String(formData.dia)),
          editado_manualmente: true,
        })
        .select()
        .single();

      if (transError) throw transError;

      // Atualizar saldo da conta
      const delta =
        formData.tipo === "entrada" ? valorNumerico : -valorNumerico;
      const novoSaldo = Number(contaAtual.saldo_atual) + delta;
      await supabase
        .from("bancos_contas")
        .update({ saldo_atual: novoSaldo })
        .eq("id", formData.banco_conta_id);

      toast({
        title: "Transação adicionada!",
        description: `${formData.tipo === "entrada" ? "+" : "-"} R$ ${valorNumerico.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}`,
      });

      // Reset form
      setFormData({
        tipo: "diario",
        descricao: "",
        valor: "",
        categoria_id: categorias[0]?.id || "",
        banco_conta_id: contas[0]?.id || "",
        cartao_id: "",
        dia: new Date().getDate(),
      });
      setIsCardExpenseMode(false);
      setCurrentStep(1);

      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao adicionar transação:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível adicionar a transação.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <>
        <Button
          onClick={() => setOpen(true)}
          className="h-12 gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          size="lg"
        >
          <Plus className="h-5 w-5" />
          Nova Transação
        </Button>

        <Dialog open={open} onOpenChange={(open) => {
          setOpen(open);
          if (!open) {
            setCurrentStep(1);
            setIsCardExpenseMode(false);
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Nova Transação
              </DialogTitle>
              <DialogDescription>
                Adicione uma transação rapidamente ao seu mês financeiro.
              </DialogDescription>
            </DialogHeader>

            {/* Stepper */}
            <div className="py-4">
              <Stepper steps={steps} currentStep={currentStep} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Etapa 1: Quem recebe? */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{STEPS.whoReceives}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esta transação é uma entrada ou uma saída?
                    </p>
                  </div>

                  {/* Modo Gasto no Cartão */}
                  {cartoes.length > 0 && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newMode = !isCardExpenseMode;
                          setIsCardExpenseMode(newMode);
                          if (newMode) {
                            setFormData((prev) => ({
                              ...prev,
                              tipo: "diario",
                              cartao_id: prev.cartao_id || cartoes[0]?.id || "",
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              cartao_id: "",
                            }));
                          }
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200",
                          isCardExpenseMode
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background hover:border-primary/50"
                        )}
                      >
                        <CreditCard className={cn("h-5 w-5 shrink-0", isCardExpenseMode && "text-primary")} />
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-sm">Gasto no Cartão</p>
                          <p className="text-xs text-muted-foreground">
                            {isCardExpenseMode
                              ? "Modo ativado - adicione um gasto usando cartão"
                              : "Ative para adicionar gastos diretamente no cartão"}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "h-5 w-9 rounded-full transition-colors duration-200",
                            isCardExpenseMode ? "bg-primary" : "bg-muted"
                          )}
                        >
                          <div
                            className={cn(
                              "h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                              isCardExpenseMode && "translate-x-4"
                            )}
                          />
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Tipo de transação */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "entrada", label: "Entrada", icon: ArrowUpCircle },
                      { value: "saida_fixa", label: "Saída Fixa", icon: X },
                      { value: "diario", label: "Gasto Diário", icon: ArrowDownCircle },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, tipo: value as any }))
                        }
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200",
                          formData.tipo === value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background hover:border-primary/50"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Etapa 2: Quanto? */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{STEPS.howMuch}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Qual é o valor desta transação?
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descrição</label>
                    <Input
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          descricao: e.target.value,
                        }))
                      }
                      placeholder="Ex: Almoço, Salário, Conta de luz..."
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Valor (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.valor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          valor: e.target.value,
                        }))
                      }
                      placeholder="0,00"
                      className="h-11 text-lg"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Etapa 3: Quando? */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{STEPS.when}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Quando ocorreu esta transação?
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Dia do mês
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.dia}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          dia: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Categoria</label>
                    {categorias.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border/50 bg-muted/20 p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          Nenhuma categoria encontrada
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setOpen(false);
                          }}
                        >
                          Criar Categoria
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value={formData.categoria_id}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, categoria_id: value }))
                        }
                        required
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <span className="flex items-center gap-2">
                                <span>{cat.icone}</span>
                                <span>{cat.nome}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Conta</label>
                    {contas.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border/50 bg-muted/20 p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          Nenhuma conta encontrada. Configure uma conta primeiro.
                        </p>
                      </div>
                    ) : (
                      <Select
                        value={formData.banco_conta_id}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            banco_conta_id: value,
                          }))
                        }
                        required
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione uma conta" />
                        </SelectTrigger>
                        <SelectContent>
                          {contas.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Cartão */}
                  {cartoes.length > 0 && (
                    <div className="space-y-2">
                      <label className={cn(
                        "text-sm font-medium flex items-center gap-2",
                        isCardExpenseMode && "text-primary"
                      )}>
                        <CreditCard className={cn("h-4 w-4", isCardExpenseMode && "text-primary")} />
                        Cartão {isCardExpenseMode ? "(obrigatório)" : "(opcional)"}
                      </label>
                      <Select
                        value={formData.cartao_id || "__none__"}
                        onValueChange={(value) => {
                          const actualValue = value === "__none__" ? "" : value;
                          setFormData((prev) => {
                            const newTipo = actualValue && prev.tipo === "entrada" ? "diario" : prev.tipo;
                            return {
                              ...prev,
                              cartao_id: actualValue,
                              tipo: newTipo as any,
                            };
                          });
                          if (actualValue && !isCardExpenseMode) {
                            setIsCardExpenseMode(true);
                          }
                        }}
                        required={isCardExpenseMode}
                      >
                        <SelectTrigger className={cn(
                          "h-11",
                          isCardExpenseMode && "border-primary/50 bg-primary/5"
                        )}>
                          <SelectValue placeholder="Selecione um cartão" />
                        </SelectTrigger>
                        <SelectContent>
                          {!isCardExpenseMode && (
                            <SelectItem value="__none__">Nenhum cartão</SelectItem>
                          )}
                          {cartoes.map((card) => (
                            <SelectItem key={card.id} value={card.id}>
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                <span>{card.nome}</span>
                                {card.bandeira && (
                                  <span className="text-xs text-muted-foreground">({card.bandeira})</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* Etapa 4: Confirmar? */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{STEPS.confirm}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {BUTTONS.reviewData}
                    </p>
                  </div>

                  <Card className="border-border/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tipo:</span>
                        <span className="font-medium">
                          {formData.tipo === "entrada" ? "Entrada" : formData.tipo === "saida_fixa" ? "Saída Fixa" : "Gasto Diário"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Descrição:</span>
                        <span className="font-medium">{formData.descricao || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Valor:</span>
                        <span className="text-lg font-bold">
                          R$ {parseFloat(formData.valor || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Dia:</span>
                        <span className="font-medium">{formData.dia}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Categoria:</span>
                        <span className="font-medium">
                          {categorias.find(c => c.id === formData.categoria_id)?.nome || "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Conta:</span>
                        <span className="font-medium">
                          {contas.find(c => c.id === formData.banco_conta_id)?.nome || "-"}
                        </span>
                      </div>
                      {formData.cartao_id && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Cartão:</span>
                          <span className="font-medium">
                            {cartoes.find(c => c.id === formData.cartao_id)?.nome || "-"}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Botões de navegação */}
              <div className="flex gap-3 pt-2">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className={currentStep === 1 ? "flex-1" : ""}
                >
                  Cancelar
                </Button>
                {currentStep < steps.length ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1"
                  >
                    {BUTTONS.continue}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? "Adicionando..." : BUTTONS.confirm}
                  </Button>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Versão inline (para usar diretamente no dashboard)
  return (
    <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold tracking-tight">Adicionar Transação</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Registre uma nova movimentação rapidamente
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "entrada", label: "Entrada", icon: ArrowUpCircle },
                { value: "saida_fixa", label: "Saída Fixa", icon: X },
                { value: "diario", label: "Gasto", icon: ArrowDownCircle },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, tipo: value as any }))
                  }
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium",
                    formData.tipo === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Descrição e Valor */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={formData.descricao}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    descricao: e.target.value,
                  }))
                }
                placeholder="Descrição..."
                className="h-10"
                required
              />
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.valor}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    valor: e.target.value,
                  }))
                }
                placeholder="Valor"
                className="h-10"
                required
              />
            </div>

            {/* Categoria e Conta */}
            <div className="grid grid-cols-2 gap-3">
              {categorias.length === 0 ? (
                <div className="col-span-2 rounded-lg border border-dashed border-border/50 bg-muted/20 p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    Crie uma categoria primeiro
                  </p>
                </div>
              ) : (
                <Select
                  value={formData.categoria_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, categoria_id: value }))
                  }
                  required
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <span>{cat.icone}</span>
                          <span>{cat.nome}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {contas.length === 0 ? (
                <div className="col-span-2 rounded-lg border border-dashed border-border/50 bg-muted/20 p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    Configure uma conta primeiro
                  </p>
                </div>
              ) : (
                <Select
                  value={formData.banco_conta_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      banco_conta_id: value,
                    }))
                  }
                  required
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {contas.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Adicionando..." : "Adicionar"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
