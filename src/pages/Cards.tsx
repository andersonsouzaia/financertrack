import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { CardCard } from '@/components/Dashboard/CardCard';
import { CardForm } from '@/components/Dashboard/CardForm';
import type { Database } from '@/integrations/supabase/types';

type Cartao = Database['public']['Tables']['cartoes']['Row'];
type Fatura = Database['public']['Tables']['faturas_cartoes']['Row'];

export default function Cards() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [faturas, setFaturas] = useState<Record<string, Fatura>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterAtivo, setFilterAtivo] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Cartao | null>(null);

  useEffect(() => {
    if (user) {
      fetchCards();
    }
  }, [user]);

  const fetchCards = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: cardsData, error: cardsError } = await supabase
        .from('cartoes')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');

      if (cardsError) throw cardsError;

      setCartoes(cardsData || []);

      // Buscar faturas do mês atual para cada cartão
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const cartaoIds = (cardsData || []).map((c) => c.id);

      if (cartaoIds.length > 0) {
        const { data: faturasData, error: faturasError } = await supabase
          .from('faturas_cartoes')
          .select('*')
          .in('cartao_id', cartaoIds)
          .eq('mes_referencia', currentMonth);

        if (faturasError) {
          console.error('Erro ao buscar faturas:', faturasError);
        } else {
          const faturasMap: Record<string, Fatura> = {};
          (faturasData || []).forEach((fatura) => {
            faturasMap[fatura.cartao_id] = fatura;
          });
          setFaturas(faturasMap);
        }
      }
    } catch (error: any) {
      console.error('Erro ao buscar cartões:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar cartões',
        description: error.message || 'Ocorreu um erro ao carregar os cartões.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cartão?')) return;

    try {
      const { error } = await supabase.from('cartoes').delete().eq('id', cardId);

      if (error) throw error;

      toast({
        title: 'Cartão excluído!',
        description: 'O cartão foi excluído com sucesso.',
      });

      fetchCards();
    } catch (error: any) {
      console.error('Erro ao excluir cartão:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir cartão',
        description: error.message || 'Ocorreu um erro ao excluir o cartão.',
      });
    }
  };

  const filteredCards = cartoes.filter((card) => {
    const matchesSearch =
      card.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.bandeira && card.bandeira.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTipo = filterTipo === 'all' || card.tipo === filterTipo;
    const matchesAtivo = filterAtivo === 'all' || (filterAtivo === 'ativo' && card.ativo) || (filterAtivo === 'inativo' && !card.ativo);

    return matchesSearch && matchesTipo && matchesAtivo;
  });

  const handleEditCard = (card: Cartao) => {
    setEditingCard(card);
    setFormOpen(true);
  };

  const handleNewCard = () => {
    setEditingCard(null);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    fetchCards();
    setFormOpen(false);
    setEditingCard(null);
  };

  return (
    <AppLayout>
      <div className="w-full space-y-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Cartões</h1>
            <p className="text-muted-foreground">
              Gerencie seus cartões de crédito e débito
            </p>
          </div>
          <Button onClick={handleNewCard} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cartão
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou bandeira..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="credito">Crédito</SelectItem>
              <SelectItem value="debito">Débito</SelectItem>
              <SelectItem value="ambos">Ambos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAtivo} onValueChange={setFilterAtivo}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de Cartões */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-2">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-muted-foreground">Carregando cartões...</p>
            </div>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {cartoes.length === 0
                ? 'Nenhum cartão cadastrado ainda.'
                : 'Nenhum cartão encontrado com os filtros aplicados.'}
            </p>
            {cartoes.length === 0 && (
              <Button onClick={handleNewCard} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Cartão
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCards.map((card) => (
              <div key={card.id} className="relative group">
                <CardCard
                  cartao={card}
                  faturaAtual={faturas[card.id]}
                  onClick={() => navigate(`/cards/${card.id}`)}
                />
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCard(card);
                    }}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Dialog */}
        <CardForm
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingCard(null);
          }}
          card={editingCard}
          onSuccess={handleFormSuccess}
        />
      </div>
    </AppLayout>
  );
}
