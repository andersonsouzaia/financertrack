import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Edit, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { FaturaCard } from '@/components/Dashboard/FaturaCard';
import { CardForm } from '@/components/Dashboard/CardForm';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartCard } from '@/components/charts/ChartCard';
import { ChartTooltipContent } from '@/components/charts/ChartTooltip';
import type { Database } from '@/integrations/supabase/types';

type Cartao = Database['public']['Tables']['cartoes']['Row'];
type Fatura = Database['public']['Tables']['faturas_cartoes']['Row'];

export default function CardDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [cartao, setCartao] = useState<Cartao | null>(null);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchCardData();
    }
  }, [user, id]);

  const fetchCardData = async () => {
    if (!user || !id) return;

    setLoading(true);
    try {
      // Buscar cartão
      const { data: cardData, error: cardError } = await supabase
        .from('cartoes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (cardError) throw cardError;
      setCartao(cardData);

      // Buscar faturas históricas (últimos 12 meses)
      const { data: faturasData, error: faturasError } = await supabase
        .from('faturas_cartoes')
        .select('*')
        .eq('cartao_id', id)
        .order('mes_referencia', { ascending: false })
        .limit(12);

      if (faturasError) {
        console.error('Erro ao buscar faturas:', faturasError);
      } else {
        setFaturas(faturasData || []);
      }
    } catch (error: any) {
      console.error('Erro ao buscar dados do cartão:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar cartão',
        description: error.message || 'Ocorreu um erro ao carregar os dados do cartão.',
      });
      navigate('/cards');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (faturaId: string) => {
    try {
      const { error } = await supabase
        .from('faturas_cartoes')
        .update({
          pago: true,
          data_pagamento: new Date().toISOString().split('T')[0],
        })
        .eq('id', faturaId);

      if (error) throw error;

      toast({
        title: 'Fatura marcada como paga!',
        description: 'A fatura foi atualizada com sucesso.',
      });

      fetchCardData();
    } catch (error: any) {
      console.error('Erro ao marcar fatura como paga:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar fatura',
        description: error.message || 'Ocorreu um erro ao atualizar a fatura.',
      });
    }
  };

  const handleMarkAsUnpaid = async (faturaId: string) => {
    try {
      const { error } = await supabase
        .from('faturas_cartoes')
        .update({
          pago: false,
          data_pagamento: null,
        })
        .eq('id', faturaId);

      if (error) throw error;

      toast({
        title: 'Fatura atualizada!',
        description: 'A fatura foi marcada como não paga.',
      });

      fetchCardData();
    } catch (error: any) {
      console.error('Erro ao atualizar fatura:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar fatura',
        description: error.message || 'Ocorreu um erro ao atualizar a fatura.',
      });
    }
  };

  const handleDeleteCard = async () => {
    if (!cartao) return;
    if (!confirm('Tem certeza que deseja excluir este cartão? Todas as faturas também serão excluídas.')) return;

    try {
      const { error } = await supabase.from('cartoes').delete().eq('id', cartao.id);

      if (error) throw error;

      toast({
        title: 'Cartão excluído!',
        description: 'O cartão foi excluído com sucesso.',
      });

      navigate('/cards');
    } catch (error: any) {
      console.error('Erro ao excluir cartão:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir cartão',
        description: error.message || 'Ocorreu um erro ao excluir o cartão.',
      });
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'credito':
        return 'Crédito';
      case 'debito':
        return 'Débito';
      case 'ambos':
        return 'Crédito/Débito';
      default:
        return tipo;
    }
  };

  // Preparar dados para o gráfico
  const chartData = faturas
    .slice()
    .reverse()
    .map((fatura) => {
      const [ano, mes] = fatura.mes_referencia.split('-');
      return {
        mes: `${mes}/${ano}`,
        valor: Number(fatura.valor_total),
        pago: fatura.pago ? 1 : 0,
      };
    });

  if (loading) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      </AppLayout>
    );
  }

  if (!cartao) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Cartão não encontrado.</p>
          <Button onClick={() => navigate('/cards')}>Voltar para Cartões</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/cards')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{cartao.nome}</h1>
              <p className="text-muted-foreground mt-1">
                Detalhes e histórico de faturas
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setFormOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button variant="destructive" onClick={handleDeleteCard}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Informações do Cartão */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge>{getTipoLabel(cartao.tipo)}</Badge>
            </CardContent>
          </Card>

          {cartao.limite && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Limite</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(cartao.limite)}</p>
              </CardContent>
            </Card>
          )}

          {cartao.bandeira && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Bandeira</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{cartao.bandeira}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Gráfico de Evolução */}
        {chartData.length > 0 && (
          <ChartCard title="Evolução das Faturas">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="Valor da Fatura"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Faturas Históricas */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Faturas Históricas</h2>
          {faturas.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma fatura encontrada para este cartão.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {faturas.map((fatura) => (
                <FaturaCard
                  key={fatura.id}
                  fatura={fatura}
                  onMarkAsPaid={handleMarkAsPaid}
                  onMarkAsUnpaid={handleMarkAsUnpaid}
                />
              ))}
            </div>
          )}
        </div>

        {/* Form Dialog */}
        <CardForm
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) fetchCardData();
          }}
          card={cartao}
          onSuccess={() => {
            fetchCardData();
            setFormOpen(false);
          }}
        />
      </div>
    </AppLayout>
  );
}
