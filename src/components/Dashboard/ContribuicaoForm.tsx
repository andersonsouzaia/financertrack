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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const contribuicaoSchema = z.object({
  valor: z.coerce.number().min(0.01, 'Valor deve ser positivo'),
  data_contribuicao: z.string().min(1, 'Data é obrigatória'),
  observacao: z.string().optional().nullable(),
  transacao_id: z.string().uuid().optional().nullable(),
});

type ContribuicaoFormValues = z.infer<typeof contribuicaoSchema>;

interface ContribuicaoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metaId: string;
  onSuccess?: () => void;
}

export function ContribuicaoForm({ open, onOpenChange, metaId, onSuccess }: ContribuicaoFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<ContribuicaoFormValues>({
    resolver: zodResolver(contribuicaoSchema),
    defaultValues: {
      valor: 0,
      data_contribuicao: new Date().toISOString().split('T')[0],
      observacao: '',
      transacao_id: null,
    },
  });

  const onSubmit = async (values: ContribuicaoFormValues) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('contribuicoes_metas').insert({
        meta_id: metaId,
        valor: values.valor,
        data_contribuicao: values.data_contribuicao,
        observacao: values.observacao || null,
        transacao_id: values.transacao_id || null,
      });

      if (error) throw error;

      toast({
        title: 'Contribuição registrada!',
        description: 'A contribuição foi registrada com sucesso.',
      });

      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao registrar contribuição:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao registrar contribuição',
        description: error.message || 'Ocorreu um erro ao registrar a contribuição.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Contribuição</DialogTitle>
          <DialogDescription>
            Registre uma contribuição para esta meta financeira
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="valor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
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
              name="data_contribuicao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da Contribuição</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione uma observação..."
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
                {loading ? 'Registrando...' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
