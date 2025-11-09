import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, TrendingUp, Trash2, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function Assets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const [newAsset, setNewAsset] = useState({
    nome: '',
    tipo: 'investimento',
    valor_inicial: 0,
    valor_atual: 0,
    taxa_rendimento: 0,
    descricao: ''
  });

  useEffect(() => {
    if (user) {
      loadAssets();
    }
  }, [user]);

  const loadAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('investimentos')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('data_criacao', { ascending: false });

      if (error) throw error;

      setAssets(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar ativos:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os ativos"
      });
      setLoading(false);
    }
  };

  const handleAddAsset = async () => {
    try {
      const { error } = await supabase
        .from('investimentos')
        .insert({
          user_id: user.id,
          ...newAsset
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Ativo adicionado com sucesso"
      });

      setShowAddDialog(false);
      setNewAsset({
        nome: '',
        tipo: 'investimento',
        valor_inicial: 0,
        valor_atual: 0,
        taxa_rendimento: 0,
        descricao: ''
      });
      loadAssets();
    } catch (error) {
      console.error('Erro ao adicionar ativo:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar o ativo"
      });
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este ativo?')) return;

    try {
      const { error } = await supabase
        .from('investimentos')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Ativo removido com sucesso"
      });

      loadAssets();
    } catch (error) {
      console.error('Erro ao deletar ativo:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o ativo"
      });
    }
  };

  const totalInvestido = assets.reduce((sum, a) => sum + Number(a.valor_inicial), 0);
  const totalAtual = assets.reduce((sum, a) => sum + Number(a.valor_atual), 0);
  const lucroTotal = totalAtual - totalInvestido;
  const rentabilidade = totalInvestido > 0 ? ((lucroTotal / totalInvestido) * 100).toFixed(2) : 0;

  if (loading) return <div className="text-center p-8 text-foreground">Carregando...</div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft size={24} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Patrimônios e Ativos
              </h1>
              <p className="text-muted-foreground">
                Gerencie seus investimentos e patrimônios
              </p>
            </div>
          </div>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2" size={18} />
                Adicionar Ativo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Ativo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="nome">Nome do Ativo</Label>
                  <Input
                    id="nome"
                    value={newAsset.nome}
                    onChange={(e) => setNewAsset({ ...newAsset, nome: e.target.value })}
                    placeholder="Ex: Tesouro Direto, Ações, Imóvel"
                  />
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={newAsset.tipo}
                    onValueChange={(value) => setNewAsset({ ...newAsset, tipo: value })}
                  >
                    <SelectTrigger id="tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="investimento">Investimento</SelectItem>
                      <SelectItem value="imovel">Imóvel</SelectItem>
                      <SelectItem value="veiculo">Veículo</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="valor_inicial">Valor Investido (R$)</Label>
                  <Input
                    id="valor_inicial"
                    type="number"
                    value={newAsset.valor_inicial}
                    onChange={(e) => setNewAsset({ ...newAsset, valor_inicial: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                  />
                </div>

                <div>
                  <Label htmlFor="valor_atual">Valor Atual (R$)</Label>
                  <Input
                    id="valor_atual"
                    type="number"
                    value={newAsset.valor_atual}
                    onChange={(e) => setNewAsset({ ...newAsset, valor_atual: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                  />
                </div>

                <div>
                  <Label htmlFor="taxa">Taxa de Rendimento (%)</Label>
                  <Input
                    id="taxa"
                    type="number"
                    value={newAsset.taxa_rendimento}
                    onChange={(e) => setNewAsset({ ...newAsset, taxa_rendimento: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                  />
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição (Opcional)</Label>
                  <Input
                    id="descricao"
                    value={newAsset.descricao || ''}
                    onChange={(e) => setNewAsset({ ...newAsset, descricao: e.target.value })}
                    placeholder="Detalhes sobre o ativo"
                  />
                </div>

                <Button onClick={handleAddAsset} className="w-full">
                  Adicionar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card p-6 rounded-lg shadow border border-border">
            <p className="text-sm text-muted-foreground mb-1">Total Investido</p>
            <p className="text-2xl font-bold text-foreground">
              R$ {totalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow border border-border">
            <p className="text-sm text-muted-foreground mb-1">Valor Atual</p>
            <p className="text-2xl font-bold text-foreground">
              R$ {totalAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className={`p-6 rounded-lg shadow border ${
            lucroTotal >= 0
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <p className="text-sm text-muted-foreground mb-1">Lucro/Prejuízo</p>
            <p className={`text-2xl font-bold ${
              lucroTotal >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              R$ {lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow border border-border">
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
              <TrendingUp size={16} />
              Rentabilidade
            </p>
            <p className={`text-2xl font-bold ${
              Number(rentabilidade) >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {rentabilidade}%
            </p>
          </div>
        </div>

        {/* Lista de Ativos */}
        <div className="bg-card rounded-lg shadow border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-foreground">Meus Ativos</h2>
          </div>

          {assets.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Nenhum ativo cadastrado ainda.</p>
              <p className="text-sm mt-2">Clique em "Adicionar Ativo" para começar.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {assets.map(asset => {
                const lucro = Number(asset.valor_atual) - Number(asset.valor_inicial);
                const rentabilidadeItem = Number(asset.valor_inicial) > 0
                  ? ((lucro / Number(asset.valor_inicial)) * 100).toFixed(2)
                  : 0;

                return (
                  <div key={asset.id} className="p-6 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {asset.nome}
                          </h3>
                          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                            {asset.tipo}
                          </span>
                        </div>

                        {asset.descricao && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {asset.descricao}
                          </p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Investido</p>
                            <p className="text-sm font-medium text-foreground">
                              R$ {Number(asset.valor_inicial).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">Valor Atual</p>
                            <p className="text-sm font-medium text-foreground">
                              R$ {Number(asset.valor_atual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">Lucro/Prejuízo</p>
                            <p className={`text-sm font-medium ${
                              lucro >= 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              R$ {lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">Rentabilidade</p>
                            <p className={`text-sm font-medium ${
                              Number(rentabilidadeItem) >= 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {rentabilidadeItem}%
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAsset(asset.id)}
                        >
                          <Trash2 size={18} className="text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
