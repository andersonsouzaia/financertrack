import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { calcularValorMensalNecessario } from '@/lib/compoundInterest';
import type { Database } from '@/integrations/supabase/types';

type MetaFinanceira = Database['public']['Tables']['metas_financeiras']['Row'];

const metaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo: z.enum(['reserva_emergencia', 'viagem', 'compra', 'investimento', 'outro'], {
    required_error: 'Tipo é obrigatório',
  }),
  valor_meta: z.coerce.number().min(0.01, 'Valor deve ser positivo'),
  valor_atual: z.coerce.number().min(0, 'Valor atual não pode ser negativo').default(0),
  data_limite: z.string().optional().nullable(),
  descricao: z.string().optional().nullable(),
  prioridade: z.coerce.number().min(1).max(5).optional().nullable(),
  ativo: z.boolean().default(true),
});

type MetaFormValues = z.infer<typeof metaSchema>;

interface FinancialGoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meta?: MetaFinanceira | null;
  onSuccess?: () => void;
}

export function FinancialGoalForm({ open, onOpenChange, meta, onSuccess }: FinancialGoalFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [valorMensalSugerido, setValorMensalSugerido] = useState<number | null>(null);

  const form = useForm<MetaFormValues>({
    resolver: zodResolver(metaSchema),
    defaultValues: {
      nome: '',
      tipo: 'outro',
      valor_meta: 0,
      valor_atual: 0,
      data_limite: null,
      descricao: '',
      prioridade: null,
      ativo: true,
    },
  });

  useEffect(() => {
    if (meta) {
      form.reset({
        nome: meta.nome,
        tipo: meta.tipo as any,
        valor_meta: meta.valor_meta,
        valor_atual: meta.valor_atual || 0,
        data_limite: meta.data_limite || null,
        descricao: meta.descricao || '',
        prioridade: meta.prioridade || null,
        ativo: meta.ativo ?? true,
      });
    } else {
      form.reset({
        nome: '',
        tipo: 'outro',
        valor_meta: 0,
        valor_atual: 0,
        data_limite: null,
        descricao: '',
        prioridade: null,
        ativo: true,
      });
    }
  }, [meta, form]);

  // Calcular valor mensal sugerido quando valor_meta, valor_atual ou data_limite mudarem
  useEffect(() => {
    const valorMeta = form.watch('valor_meta');
    const valorAtual = form.watch('valor_atual') || 0;
    const dataLimite = form.watch('data_limite');

    if (valorMeta > 0 && dataLimite) {
      const hoje = new Date();
      const limite = new Date(dataLimite);
      const mesesRestantes = Math.max(1, Math.ceil((limite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      
      // Usar taxa de 0% para cálculo simples (sem juros)
      const valorMensal = calcularValorMensalNecessario(valorMeta, valorAtual, 0, mesesRestantes);
      setValorMensalSugerido(valorMensal);
    } else {
      setValorMensalSugerido(null);
    }
  }, [form.watch('valor_meta'), form.watch('valor_atual'), form.watch('data_limite')]);

  const onSubmit = async (values: MetaFormValues) => {
    if (!user) return;

    setLoading(true);
    try {
      const dataToInsert = {
        ...values,
        user_id: user.id,
        valor_atual: values.valor_atual || 0,
        data_limite: values.data_limite || null,
        descricao: values.descricao || null,
        prioridade: values.prioridade || null,
        valor_mensal_sugerido: valorMensalSugerido,
      };

      if (meta) {
        // Update
        const { error } = await supabase
          .from('metas_financeiras')
          .update(dataToInsert)
          .eq('id', meta.id);

        if (error) throw error;

        toast({
          title: 'Meta atualizada!',
          description: 'A meta financeira foi atualizada com sucesso.',
        });
      } else {
        // Insert
        const { error } = await supabase.from('metas_financeiras').insert(dataToInsert);

        if (error) throw error;

        toast({
          title: 'Meta criada!',
          description: 'A meta financeira foi criada com sucesso.',
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar meta:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar meta',
        description: error.message || 'Ocorreu um erro ao salvar a meta.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meta ? 'Editar Meta Financeira' : 'Nova Meta Financeira'}</DialogTitle>
          <DialogDescription>
            {meta
              ? 'Atualize as informações da meta financeira'
              : 'Defina uma meta de longo prazo para seus objetivos financeiros'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Meta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Viagem para Europa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="reserva_emergencia">Reserva de Emergência</SelectItem>
                        <SelectItem value="viagem">Viagem</SelectItem>
                        <SelectItem value="compra">Compra</SelectItem>
                        <SelectItem value="investimento">Investimento</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prioridade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade (1-5)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        placeholder="1"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? null : parseInt(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor_meta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Meta (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor_atual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Atual (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="data_limite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Limite (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    {valorMensalSugerido !== null && (
                      <span className="font-semibold text-primary">
                        Valor mensal sugerido: R$ {valorMensalSugerido.toFixed(2)}
                      </span>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione uma descrição ou observação..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : meta ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
