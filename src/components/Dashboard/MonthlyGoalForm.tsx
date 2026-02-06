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
import type { Database } from '@/integrations/supabase/types';

type MetaMensal = Database['public']['Tables']['metas_mensais']['Row'];
type Categoria = Database['public']['Tables']['categorias_saidas']['Row'];

const metaSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  tipo: z.enum(['gasto_maximo', 'economia_minima'], {
    required_error: 'Tipo é obrigatório',
  }),
  mes_ano: z.string().regex(/^\d{4}-\d{2}$/, 'Formato inválido (use YYYY-MM)'),
  valor_meta: z.coerce.number().min(0, 'Valor deve ser positivo').optional().nullable(),
  categoria_id: z.string().uuid().optional().nullable(),
  descricao: z.string().optional().nullable(),
  data_limite: z.string().optional().nullable(),
  prioridade: z.coerce.number().min(1).max(5).optional().nullable(),
  concluida: z.boolean().default(false),
});

type MetaFormValues = z.infer<typeof metaSchema>;

interface MonthlyGoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meta?: MetaMensal | null;
  onSuccess?: () => void;
}

export function MonthlyGoalForm({ open, onOpenChange, meta, onSuccess }: MonthlyGoalFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const form = useForm<MetaFormValues>({
    resolver: zodResolver(metaSchema),
    defaultValues: {
      titulo: '',
      tipo: 'gasto_maximo',
      mes_ano: getCurrentMonth(),
      valor_meta: null,
      categoria_id: null,
      descricao: '',
      data_limite: null,
      prioridade: null,
      concluida: false,
    },
  });

  useEffect(() => {
    if (meta) {
      form.reset({
        titulo: meta.titulo,
        tipo: meta.tipo as 'gasto_maximo' | 'economia_minima',
        mes_ano: meta.mes_ano,
        valor_meta: meta.valor_meta,
        categoria_id: meta.categoria_id && meta.categoria_id !== '' ? meta.categoria_id : null,
        descricao: meta.descricao || '',
        data_limite: meta.data_limite || null,
        prioridade: meta.prioridade || null,
        concluida: meta.concluida || false,
      });
    } else {
      form.reset({
        titulo: '',
        tipo: 'gasto_maximo',
        mes_ano: getCurrentMonth(),
        valor_meta: null,
        categoria_id: null,
        descricao: '',
        data_limite: null,
        prioridade: null,
        concluida: false,
      });
    }
  }, [meta, form]);

  useEffect(() => {
    const fetchCategorias = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('categorias_saidas')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao buscar categorias:', error);
      } else {
        setCategorias(data || []);
      }
    };

    if (open && user) {
      fetchCategorias();
    }
  }, [open, user]);

  const onSubmit = async (values: MetaFormValues) => {
    if (!user) return;

    setLoading(true);
    try {
      const dataToInsert = {
        ...values,
        user_id: user.id,
        valor_meta: values.valor_meta || null,
        categoria_id: values.categoria_id || null,
        descricao: values.descricao || null,
        data_limite: values.data_limite || null,
        prioridade: values.prioridade || null,
      };

      if (meta) {
        // Update
        const { error } = await supabase
          .from('metas_mensais')
          .update(dataToInsert)
          .eq('id', meta.id);

        if (error) throw error;

        toast({
          title: 'Meta atualizada!',
          description: 'A meta mensal foi atualizada com sucesso.',
        });
      } else {
        // Insert
        const { error } = await supabase.from('metas_mensais').insert(dataToInsert);

        if (error) throw error;

        toast({
          title: 'Meta criada!',
          description: 'A meta mensal foi criada com sucesso.',
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

  const tipo = form.watch('tipo');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meta ? 'Editar Meta Mensal' : 'Nova Meta Mensal'}</DialogTitle>
          <DialogDescription>
            {meta
              ? 'Atualize as informações da meta mensal'
              : 'Defina uma meta de gasto máximo ou economia mínima para o mês'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Limitar gastos com delivery" {...field} />
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
                        <SelectItem value="gasto_maximo">Gasto Máximo</SelectItem>
                        <SelectItem value="economia_minima">Economia Mínima</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mes_ano"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês/Ano</FormLabel>
                    <FormControl>
                      <Input type="month" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="valor_meta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {tipo === 'gasto_maximo' ? 'Gasto Máximo (R$)' : 'Economia Mínima (R$)'}
                  </FormLabel>
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
                  <FormDescription>
                    {tipo === 'gasto_maximo'
                      ? 'Valor máximo que você deseja gastar'
                      : 'Valor mínimo que você deseja economizar'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoria_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria (Opcional)</FormLabel>
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
                        <SelectValue placeholder="Selecione uma categoria (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhuma</SelectItem>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icone} {cat.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Se selecionada, a meta será aplicada apenas a esta categoria
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

            <div className="grid grid-cols-2 gap-4">
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
