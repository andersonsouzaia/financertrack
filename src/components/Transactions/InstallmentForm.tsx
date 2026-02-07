import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Stepper } from '@/components/ui/stepper';
import { Card, CardContent } from '@/components/ui/card';
import { STEPS, BUTTONS } from '@/lib/microcopy';
import { ChevronLeft, ChevronRight, Calendar, CreditCard } from 'lucide-react';
import { format, addMonths, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface InstallmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faturaId?: string;
  cartaoId?: string;
  onSuccess?: () => void;
}

export function InstallmentForm({
  open,
  onOpenChange,
  faturaId,
  cartaoId,
  onSuccess,
}: InstallmentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [cartoes, setCartoes] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    descricao: '',
    valorTotal: '',
    totalParcelas: '3',
    dataPrimeiraParcela: format(new Date(), 'yyyy-MM-dd'),
    cartaoId: cartaoId || '',
    categoriaId: '',
    bancoContaId: '',
    observacoes: '',
  });

  const steps = [
    STEPS.totalValue,
    STEPS.numberOfInstallments,
    STEPS.firstDueDate,
    STEPS.reviewInstallments,
  ];

  useEffect(() => {
    if (open && user) {
      fetchData();
      if (cartaoId) {
        setFormData((prev) => ({ ...prev, cartaoId }));
      }
    }
  }, [open, user, cartaoId]);

  const fetchData = async () => {
    try {
      const [catsRes, accsRes, cardsRes] = await Promise.all([
        supabase
          .from('categorias_saidas')
          .select('*')
          .eq('user_id', user?.id)
          .order('nome'),
        supabase
          .from('bancos_contas')
          .select('*')
          .eq('user_id', user?.id)
          .eq('ativo', true)
          .order('nome'),
        user
          ? supabase
              .from('cartoes')
              .select('*')
              .eq('user_id', user.id)
              .eq('ativo', true)
              .order('nome')
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (catsRes.data) setCategorias(catsRes.data);
      if (accsRes.data) setContas(accsRes.data);
      if (cardsRes.data) setCartoes(cardsRes.data);

      // Set defaults
      if (catsRes.data?.[0] && !formData.categoriaId) {
        setFormData((prev) => ({
          ...prev,
          categoriaId: catsRes.data[0].id,
        }));
      }
      if (accsRes.data?.[0] && !formData.bancoContaId) {
        setFormData((prev) => ({
          ...prev,
          bancoContaId: accsRes.data[0].id,
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleNext = () => {
    // Validações por etapa
    if (currentStep === 1) {
      const valor = parseFloat(formData.valorTotal);
      if (!formData.descricao.trim()) {
        toast({
          variant: 'destructive',
          title: 'Descrição obrigatória',
          description: 'Informe uma descrição para a compra.',
        });
        return;
      }
      if (!formData.valorTotal || !isFinite(valor) || valor <= 0) {
        toast({
          variant: 'destructive',
          title: 'Valor inválido',
          description: 'Informe um valor válido maior que zero.',
        });
        return;
      }
    } else if (currentStep === 2) {
      const parcelas = parseInt(formData.totalParcelas);
      if (!parcelas || parcelas < 1 || parcelas > 12) {
        toast({
          variant: 'destructive',
          title: 'Número de parcelas inválido',
          description: 'O número de parcelas deve estar entre 1 e 12.',
        });
        return;
      }
    } else if (currentStep === 3) {
      if (!formData.dataPrimeiraParcela) {
        toast({
          variant: 'destructive',
          title: 'Data obrigatória',
          description: 'Selecione a data da primeira parcela.',
        });
        return;
      }
      if (!formData.cartaoId && !formData.bancoContaId) {
        toast({
          variant: 'destructive',
          title: 'Conta ou cartão obrigatório',
          description: 'Selecione uma conta ou cartão.',
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

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const valorTotal = parseFloat(formData.valorTotal);
      const totalParcelas = parseInt(formData.totalParcelas);
      const valorParcela = valorTotal / totalParcelas;
      const dataPrimeiraParcela = parse(
        formData.dataPrimeiraParcela,
        'yyyy-MM-dd',
        new Date()
      );

      // Criar compra parcelada
      const { data: compra, error: compraError } = await supabase
        .from('compras_parceladas')
        .insert({
          user_id: user.id,
          descricao: formData.descricao,
          valor_total: valorTotal,
          total_parcelas: totalParcelas,
          data_primeira_parcela: format(dataPrimeiraParcela, 'yyyy-MM-dd'),
          cartao_id: formData.cartaoId || null,
          categoria_id: formData.categoriaId || null,
          banco_conta_id: formData.bancoContaId || null,
          observacoes: formData.observacoes || null,
        })
        .select()
        .single();

      if (compraError) throw compraError;

      // Criar parcelas
      const parcelas = [];
      for (let i = 0; i < totalParcelas; i++) {
        const dataVencimento = addMonths(dataPrimeiraParcela, i);
        parcelas.push({
          compra_parcelada_id: compra.id,
          numero_parcela: i + 1,
          total_parcelas: totalParcelas,
          valor_parcela: valorParcela,
          data_vencimento: format(dataVencimento, 'yyyy-MM-dd'),
          pago: false,
          fatura_id: faturaId || null,
        });
      }

      const { error: parcelasError } = await supabase
        .from('parcelas')
        .insert(parcelas);

      if (parcelasError) throw parcelasError;

      toast({
        title: 'Parcelamento criado!',
        description: `Compra parcelada em ${totalParcelas} parcelas de ${valorParcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      });

      setFormData({
        descricao: '',
        valorTotal: '',
        totalParcelas: '3',
        dataPrimeiraParcela: format(new Date(), 'yyyy-MM-dd'),
        cartaoId: cartaoId || '',
        categoriaId: '',
        bancoContaId: '',
        observacoes: '',
      });
      setCurrentStep(1);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao criar parcelamento:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao criar parcelamento',
        description: error.message || 'Não foi possível criar o parcelamento.',
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularParcelas = () => {
    const valorTotal = parseFloat(formData.valorTotal || '0');
    const totalParcelas = parseInt(formData.totalParcelas || '3');
    const valorParcela = valorTotal / totalParcelas;
    const dataPrimeiraParcela = parse(
      formData.dataPrimeiraParcela,
      'yyyy-MM-dd',
      new Date()
    );

    return Array.from({ length: totalParcelas }, (_, i) => ({
      numero: i + 1,
      valor: valorParcela,
      vencimento: addMonths(dataPrimeiraParcela, i),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        setCurrentStep(1);
      }
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Parcelar Compra
          </DialogTitle>
          <DialogDescription>
            Divida uma compra em parcelas para melhor controle financeiro.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="py-4">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        {/* Etapa 1: Valor Total */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold mb-2">{STEPS.totalValue}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Informe a descrição e o valor total da compra.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formData.descricao}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, descricao: e.target.value }))
                }
                placeholder="Ex: Notebook, Sofá, Viagem..."
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Valor Total (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.valorTotal}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, valorTotal: e.target.value }))
                }
                placeholder="0,00"
                className="h-11 text-lg"
                required
              />
            </div>
          </div>
        )}

        {/* Etapa 2: Número de Parcelas */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold mb-2">{STEPS.numberOfInstallments}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Em quantas parcelas deseja dividir esta compra?
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[3, 6, 9, 12].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, totalParcelas: num.toString() }))
                  }
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200',
                    formData.totalParcelas === num.toString()
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background hover:border-primary/50'
                  )}
                >
                  <span className="text-2xl font-bold">{num}x</span>
                  <span className="text-xs">parcelas</span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Ou informe o número de parcelas</Label>
              <Input
                type="number"
                min="1"
                max="12"
                value={formData.totalParcelas}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, totalParcelas: e.target.value }))
                }
                className="h-11"
                required
              />
            </div>

            {formData.valorTotal && formData.totalParcelas && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Valor por parcela</p>
                    <p className="text-2xl font-bold text-primary">
                      {(
                        parseFloat(formData.valorTotal || '0') /
                        parseInt(formData.totalParcelas || '3')
                      ).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Etapa 3: Data da Primeira Parcela */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold mb-2">{STEPS.firstDueDate}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Quando será a primeira parcela?
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data da Primeira Parcela
              </Label>
              <Input
                type="date"
                value={formData.dataPrimeiraParcela}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dataPrimeiraParcela: e.target.value,
                  }))
                }
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              {categorias.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/50 bg-muted/20 p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma categoria encontrada
                  </p>
                </div>
              ) : (
                <Select
                  value={formData.categoriaId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, categoriaId: value }))
                  }
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

            {cartoes.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Cartão (opcional)
                </Label>
                <Select
                  value={formData.cartaoId || '__none__'}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      cartaoId: value === '__none__' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione um cartão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum cartão</SelectItem>
                    {cartoes.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span>{card.nome}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {contas.length > 0 && (
              <div className="space-y-2">
                <Label>Conta (opcional)</Label>
                <Select
                  value={formData.bancoContaId || '__none__'}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      bancoContaId: value === '__none__' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhuma conta</SelectItem>
                    {contas.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Etapa 4: Revisar Parcelas */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold mb-2">{STEPS.reviewInstallments}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {BUTTONS.reviewData}
              </p>
            </div>

            <Card className="border-border/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Descrição:</span>
                  <span className="font-medium">{formData.descricao}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valor Total:</span>
                  <span className="text-lg font-bold">
                    {parseFloat(formData.valorTotal || '0').toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Parcelas:</span>
                  <span className="font-medium">{formData.totalParcelas}x</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valor por Parcela:</span>
                  <span className="font-semibold text-primary">
                    {(
                      parseFloat(formData.valorTotal || '0') /
                      parseInt(formData.totalParcelas || '3')
                    ).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label>Parcelas</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {calcularParcelas().map((parcela) => (
                  <Card key={parcela.numero} className="border-border/50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Parcela {parcela.numero}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parcela.vencimento, "dd 'de' MMMM 'de' yyyy", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {parcela.valor.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
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
            onClick={() => onOpenChange(false)}
            className={currentStep === 1 ? 'flex-1' : ''}
          >
            Cancelar
          </Button>
          {currentStep < steps.length ? (
            <Button type="button" onClick={handleNext} className="flex-1">
              {BUTTONS.continue}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Criando...' : BUTTONS.confirm}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
