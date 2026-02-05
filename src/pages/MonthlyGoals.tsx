import { useState, useEffect } from 'react';
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
import { MonthlyGoalCard } from '@/components/Dashboard/MonthlyGoalCard';
import { MonthlyGoalForm } from '@/components/Dashboard/MonthlyGoalForm';
import type { Database } from '@/integrations/supabase/types';

type MetaMensal = Database['public']['Tables']['metas_mensais']['Row'];

export default function MonthlyGoals() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [metas, setMetas] = useState<MetaMensal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterConcluida, setFilterConcluida] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<MetaMensal | null>(null);

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
        .from('metas_mensais')
        .select('*')
        .eq('user_id', user.id)
        .order('mes_ano', { ascending: false })
        .order('prioridade', { ascending: false, nullsFirst: false });

      if (error) throw error;

      setMetas(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar metas:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar metas',
        description: error.message || 'Ocorreu um erro ao carregar as metas mensais.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeta = async (metaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;

    try {
      const { error } = await supabase.from('metas_mensais').delete().eq('id', metaId);

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
    const matchesSearch = meta.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meta.descricao && meta.descricao.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTipo = filterTipo === 'all' || meta.tipo === filterTipo;
    const matchesConcluida = filterConcluida === 'all' ||
      (filterConcluida === 'concluida' && meta.concluida) ||
      (filterConcluida === 'pendente' && !meta.concluida);

    return matchesSearch && matchesTipo && matchesConcluida;
  });

  const handleEditMeta = (meta: MetaMensal) => {
    setEditingMeta(meta);
    setFormOpen(true);
  };

  const handleNewMeta = () => {
    setEditingMeta(null);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    fetchMetas();
    setFormOpen(false);
    setEditingMeta(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Metas Mensais</h1>
            <p className="text-muted-foreground mt-1">
              Defina e acompanhe suas metas de gastos e economia mensais
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
                placeholder="Buscar por título ou descrição..."
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
              <SelectItem value="gasto_maximo">Gasto Máximo</SelectItem>
              <SelectItem value="economia_minima">Economia Mínima</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterConcluida} onValueChange={setFilterConcluida}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="concluida">Concluídas</SelectItem>
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
                ? 'Nenhuma meta mensal cadastrada ainda.'
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
              <div key={meta.id} className="relative group">
                <MonthlyGoalCard meta={meta} onClick={() => handleEditMeta(meta)} />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMeta(meta.id);
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
        <MonthlyGoalForm
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingMeta(null);
          }}
          meta={editingMeta}
          onSuccess={handleFormSuccess}
        />
      </div>
    </AppLayout>
  );
}
