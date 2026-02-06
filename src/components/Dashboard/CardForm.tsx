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
import type { Database } from '@/integrations/supabase/types';

type Cartao = Database['public']['Tables']['cartoes']['Row'];
type BancoConta = Database['public']['Tables']['bancos_contas']['Row'];

const cardSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo: z.enum(['credito', 'debito', 'ambos'], {
    required_error: 'Tipo é obrigatório',
  }),
  bandeira: z.string().optional(),
  limite: z.coerce.number().min(0, 'Limite deve ser positivo').optional().nullable(),
  dia_fechamento: z.coerce
    .number()
    .min(1, 'Dia deve estar entre 1 e 31')
    .max(31, 'Dia deve estar entre 1 e 31')
    .optional()
    .nullable(),
  dia_vencimento: z.coerce
    .number()
    .min(1, 'Dia deve estar entre 1 e 31')
    .max(31, 'Dia deve estar entre 1 e 31')
    .optional()
    .nullable(),
  banco_conta_id: z.string().uuid().optional().nullable(),
  ativo: z.boolean().default(true),
});

type CardFormValues = z.infer<typeof cardSchema>;

interface CardFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: Cartao | null;
  onSuccess?: () => void;
}

export function CardForm({ open, onOpenChange, card, onSuccess }: CardFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [contas, setContas] = useState<BancoConta[]>([]);

  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      nome: '',
      tipo: 'credito',
      bandeira: '',
      limite: null,
      dia_fechamento: null,
      dia_vencimento: null,
      banco_conta_id: null,
      ativo: true,
    },
  });

  useEffect(() => {
    if (card) {
      form.reset({
        nome: card.nome,
        tipo: card.tipo as 'credito' | 'debito' | 'ambos',
        bandeira: card.bandeira || '',
        limite: card.limite,
        dia_fechamento: card.dia_fechamento,
        dia_vencimento: card.dia_vencimento,
        banco_conta_id: card.banco_conta_id || null,
        ativo: card.ativo ?? true,
      });
    } else {
      form.reset({
        nome: '',
        tipo: 'credito',
        bandeira: '',
        limite: null,
        dia_fechamento: null,
        dia_vencimento: null,
        banco_conta_id: null,
        ativo: true,
      });
    }
  }, [card, form]);

  useEffect(() => {
    const fetchContas = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('bancos_contas')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('nome_banco');

      if (error) {
        console.error('Erro ao buscar contas:', error);
      } else {
        setContas(data || []);
      }
    };

    if (open && user) {
      fetchContas();
    }
  }, [open, user]);

  const onSubmit = async (values: CardFormValues) => {
    if (!user) return;

    setLoading(true);
    try {
      const dataToInsert = {
        ...values,
        user_id: user.id,
        limite: values.limite || null,
        dia_fechamento: values.dia_fechamento || null,
        dia_vencimento: values.dia_vencimento || null,
        banco_conta_id: values.banco_conta_id || null,
      };

      if (card) {
        // Update
        const { error } = await supabase
          .from('cartoes')
          .update(dataToInsert)
          .eq('id', card.id);

        if (error) throw error;

        toast({
          title: 'Cartão atualizado!',
          description: 'As informações do cartão foram atualizadas com sucesso.',
        });
      } else {
        // Insert
        const { error } = await supabase.from('cartoes').insert(dataToInsert);

        if (error) throw error;

        toast({
          title: 'Cartão cadastrado!',
          description: 'O cartão foi cadastrado com sucesso.',
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar cartão:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar cartão',
        description: error.message || 'Ocorreu um erro ao salvar o cartão.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{card ? 'Editar Cartão' : 'Novo Cartão'}</DialogTitle>
          <DialogDescription>
            {card
              ? 'Atualize as informações do cartão'
              : 'Preencha os dados para cadastrar um novo cartão'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cartão</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Cartão Nubank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      <SelectItem value="credito">Crédito</SelectItem>
                      <SelectItem value="debito">Débito</SelectItem>
                      <SelectItem value="ambos">Crédito/Débito</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bandeira"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bandeira</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Visa, Mastercard" {...field} />
                  </FormControl>
                  <FormDescription>Opcional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="limite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limite (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : parseFloat(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>Opcional - Apenas para cartões de crédito</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dia_fechamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia de Fechamento</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="Ex: 10"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? null : parseInt(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>Dia do mês (1-31)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dia_vencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia de Vencimento</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="Ex: 15"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? null : parseInt(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>Dia do mês (1-31)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="banco_conta_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta Bancária</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      // Garantir que valores vazios sejam convertidos para null
                      if (!value || value === '' || value === '__none__') {
                        field.onChange(null);
                      } else {
                        field.onChange(value);
                      }
                    }}
                    value={field.value && field.value !== '' ? String(field.value) : '__none__'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conta (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhuma</SelectItem>
                      {contas.map((conta) => (
                        <SelectItem key={conta.id} value={conta.id}>
                          {conta.nome_banco} - {conta.tipo_conta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Opcional - Vincular a uma conta bancária</FormDescription>
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
                {loading ? 'Salvando...' : card ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
