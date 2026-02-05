import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search } from 'lucide-react';
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
import { FinancialGoalCard } from '@/components/Dashboard/FinancialGoalCard';
import { FinancialGoalForm } from '@/components/Dashboard/FinancialGoalForm';
import { ContribuicaoForm } from '@/components/Dashboard/ContribuicaoForm';
import type { Database } from '@/integrations/supabase/types';

type MetaFinanceira = Database['public']['Tables']['metas_financeiras']['Row'];

export default function FinancialGoals() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [metas, setMetas] = useState<MetaFinanceira[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterAtivo, setFilterAtivo] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [contribuicaoOpen, setContribuicaoOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<MetaFinanceira | null>(null);
  const [selectedMetaId, setSelectedMetaId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMetas();
    }
  }, [user]);

  const fetchMetas = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('metas_financeiras')
        .select('*')
        .eq('user_id', user.id)
        .order('prioridade', { ascending: false, nullsFirst: false })
        .order('data_limite', { ascending: true, nullsFirst: true });

      if (error) throw error;

      setMetas(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar metas:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar metas',
        description: error.message || 'Ocorreu um erro ao carregar as metas financeiras.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeta = async (metaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;

    try {
      const { error } = await supabase.from('metas_financeiras').delete().eq('id', metaId);

      if (error) throw error;

      toast({
        title: 'Meta excluída!',
        description: 'A meta foi excluída com sucesso.',
      });

      fetchMetas();
    } catch (error: any) {
      console.error('Erro ao excluir meta:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir meta',
        description: error.message || 'Ocorreu um erro ao excluir a meta.',
      });
    }
  };

  const filteredMetas = metas.filter((meta) => {
    const matchesSearch = meta.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meta.descricao && meta.descricao.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTipo = filterTipo === 'all' || meta.tipo === filterTipo;
    const matchesAtivo = filterAtivo === 'all' ||
      (filterAtivo === 'ativo' && meta.ativo) ||
      (filterAtivo === 'inativo' && !meta.ativo);

    return matchesSearch && matchesTipo && matchesAtivo;
  });

  const handleEditMeta = (meta: MetaFinanceira) => {
    setEditingMeta(meta);
    setFormOpen(true);
  };

  const handleNewMeta = () => {
    setEditingMeta(null);
    setFormOpen(true);
  };

  const handleContribute = (metaId: string) => {
    setSelectedMetaId(metaId);
    setContribuicaoOpen(true);
  };

  const handleFormSuccess = () => {
    fetchMetas();
    setFormOpen(false);
    setEditingMeta(null);
  };

  const handleContribuicaoSuccess = () => {
    fetchMetas();
    setContribuicaoOpen(false);
    setSelectedMetaId(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Metas Financeiras</h1>
            <p className="text-muted-foreground mt-1">
              Defina e acompanhe seus objetivos financeiros de longo prazo
            </p>
          </div>
          <Button onClick={handleNewMeta}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Meta
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="reserva_emergencia">Reserva de Emergência</SelectItem>
              <SelectItem value="viagem">Viagem</SelectItem>
              <SelectItem value="compra">Compra</SelectItem>
              <SelectItem value="investimento">Investimento</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAtivo} onValueChange={setFilterAtivo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="ativo">Ativas</SelectItem>
              <SelectItem value="inativo">Inativas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de Metas */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filteredMetas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {metas.length === 0
                ? 'Nenhuma meta financeira cadastrada ainda.'
                : 'Nenhuma meta encontrada com os filtros aplicados.'}
            </p>
            {metas.length === 0 && (
              <Button onClick={handleNewMeta}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Meta
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMetas.map((meta) => (
              <FinancialGoalCard
                key={meta.id}
                meta={meta}
                onContribute={() => handleContribute(meta.id)}
                onClick={() => handleEditMeta(meta)}
              />
            ))}
          </div>
        )}

        {/* Form Dialog */}
        <FinancialGoalForm
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingMeta(null);
          }}
          meta={editingMeta}
          onSuccess={handleFormSuccess}
        />

        {/* Contribuição Dialog */}
        {selectedMetaId && (
          <ContribuicaoForm
            open={contribuicaoOpen}
            onOpenChange={(open) => {
              setContribuicaoOpen(open);
              if (!open) setSelectedMetaId(null);
            }}
            metaId={selectedMetaId}
            onSuccess={handleContribuicaoSuccess}
          />
        )}
      </div>
    </AppLayout>
  );
}
