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
import { Plus, X, ArrowUpCircle, ArrowDownCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [formData, setFormData] = useState({
    tipo: "diario" as "entrada" | "saida_fixa" | "diario",
    descricao: "",
    valor: "",
    categoria_id: "",
    banco_conta_id: "",
    cartao_id: "",
    dia: new Date().getDate(),
  });

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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user || !month) return;

    const valorNumerico = parseFloat(formData.valor);
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
          cartao_id: formData.cartao_id || null,
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

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Nova Transação
              </DialogTitle>
              <DialogDescription>
                Adicione uma transação rapidamente ao seu mês financeiro.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5">
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

              {/* Descrição */}
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

              {/* Valor e Dia */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor</label>
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
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
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
              </div>

              {/* Categoria */}
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
                        // Você pode navegar para a página de categorias aqui se necessário
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

              {/* Conta */}
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

              {/* Cartão (opcional) */}
              {cartoes.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cartão (opcional)</label>
                  <Select
                    value={formData.cartao_id}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, cartao_id: value }))
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Nenhum cartão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum cartão</SelectItem>
                      {cartoes.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Adicionando..." : "Adicionar Transação"}
                </Button>
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
