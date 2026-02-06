import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ensureMonthExists, getPreviousMonths, getMonthName } from '@/lib/monthHelper';
import { AppLayout } from '@/components/layout/AppLayout';
import { QuickTransactionForm } from '@/components/Dashboard/QuickTransactionForm';
import { DailyTransactionsView } from '@/components/Transactions/DailyTransactionsView';
import { TransactionsOverview } from '@/components/Transactions/TransactionsOverview';
import { GoalsSection } from '@/components/Transactions/GoalsSection';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Layers, Table2, Filter, X, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function Transactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<any>(null);
  const [months, setMonths] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [filterCartao, setFilterCartao] = useState<string>('all');
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    nome: '',
    icone: '📌',
    cor: '#2563eb',
    tipo: 'variavel',
  });
  const [viewMode, setViewMode] = useState<'overview' | 'daily'>('daily');

  const fetchCategories = async () => {
    const { data: cats, error: catError } = await supabase
      .from('categorias_saidas')
      .select('*')
      .eq('user_id', user?.id);

    if (catError) throw catError;
    setCategorias(cats || []);
    return cats || [];
  };

  const fetchAccounts = async () => {
    const { data: accs, error: accError } = await supabase
      .from('bancos_contas')
      .select('*')
      .eq('user_id', user?.id);

    if (accError) throw accError;
    setContas(accs || []);
    return accs || [];
  };

  const fetchCards = async () => {
    if (!user) return [];
    const { data: cards, error: cardsError } = await supabase
      .from('cartoes')
      .select('*')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .order('nome');

    if (cardsError) {
      console.error('Erro ao buscar cartões:', cardsError);
      return [];
    }
    setCartoes(cards || []);
    return cards || [];
  };

  useEffect(() => {
    if (user) {
      initializeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const initializeData = async () => {
    try {
      setLoading(true);

      // 1. Garantir que mês existe
      const { month } = await ensureMonthExists(user.id);
      setSelectedMonth(month);

      // 2. Buscar todos os meses
      const allMonths = await getPreviousMonths(user.id, 12);
      setMonths(allMonths);

      // 3. Buscar categorias
      await fetchCategories();

      // 4. Buscar contas
      await fetchAccounts();

      // 5. Buscar cartões
      await fetchCards();

      // 6. Buscar transações do mês
      await loadTransactions(month.id);
    } catch (error: any) {
      console.error('Erro ao inicializar:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar",
        description: error.message
      });
      setLoading(false);
    }
  };

  const loadTransactions = useCallback(async (mesId: string) => {
    try {
      let query = supabase
        .from('transacoes')
        .select(`
          *,
          categoria:categorias_saidas(nome, icone),
          cartao:cartoes(nome, tipo),
          observacao:observacoes_gastos(observacao)
        `)
        .eq('mes_financeiro_id', mesId)
        .eq('deletado', false);

      if (filterCartao !== 'all') {
        if (filterCartao === 'none') {
          query = query.is('cartao_id', null);
        } else {
          query = query.eq('cartao_id', filterCartao);
        }
      }

      const { data, error } = await query.order('dia', { ascending: true });

      if (error) throw error;

      setTransacoes(data || []);
      setLoading(false);
    } catch (error: any) {
      console.error('Erro ao buscar transações:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message
      });
      setLoading(false);
    }
  }, [filterCartao, toast]);

  const handleMonthChange = (mes: any) => {
    setSelectedMonth(mes);
    loadTransactions(mes.id);
  };

  useEffect(() => {
    if (selectedMonth) {
      loadTransactions(selectedMonth.id);
    }
  }, [filterCartao, selectedMonth, loadTransactions]);

  const handleEdit = (transaction: any) => {
    setEditingTransaction({
      ...transaction,
      categoria_id: transaction.categoria_id,
      banco_conta_id: transaction.banco_conta_id,
      cartao_id: transaction.cartao_id || '',
    });
    setShowEditDialog(true);
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction || !selectedMonth) return;

    try {
      const valorNovo = parseFloat(String(editingTransaction.valor_original));
      if (!editingTransaction.descricao || !editingTransaction.categoria_id || !isFinite(valorNovo)) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Preencha todos os campos obrigatórios"
        });
        return;
      }

      const { error } = await supabase
        .from('transacoes')
        .update({
          dia: editingTransaction.dia,
          descricao: editingTransaction.descricao,
          valor_original: valorNovo,
          tipo: editingTransaction.tipo,
          categoria_id: editingTransaction.categoria_id,
          banco_conta_id: editingTransaction.banco_conta_id,
          cartao_id: editingTransaction.cartao_id || null,
        })
        .eq('id', editingTransaction.id);

      if (error) throw error;

      toast({ title: "Transação atualizada!" });
      setShowEditDialog(false);
      setEditingTransaction(null);
      await loadTransactions(selectedMonth.id);
      await fetchAccounts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message
      });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      await supabase
        .from('transacoes')
        .update({ deletado: true })
        .eq('id', id);

      toast({ title: "Transação excluída!" });
      await loadTransactions(selectedMonth.id);
      await fetchAccounts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message
      });
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.nome.trim()) {
      toast({
        variant: "destructive",
        title: "Informe um nome",
        description: "A nova categoria precisa ter um nome."
      });
      return;
    }

    setCreatingCategory(true);
    try {
      await supabase
        .from('categorias_saidas')
        .insert({
          user_id: user.id,
          nome: categoryForm.nome.trim(),
          icone: categoryForm.icone || '📌',
          cor: categoryForm.cor || '#2563eb',
          tipo: categoryForm.tipo,
          padrao: false,
        });

      toast({
        title: "Categoria criada!",
        description: "Você já pode utilizá-la nas transações."
      });

      setShowCategoryDialog(false);
      setCategoryForm({
        nome: '',
        icone: '📌',
        cor: '#2563eb',
        tipo: 'variavel',
      });
      await fetchCategories();
    } catch (error: any) {
      console.error('Erro ao criar categoria:', error);
      toast({
        variant: "destructive",
        title: "Erro ao criar categoria",
        description: error.message
      });
    } finally {
      setCreatingCategory(false);
    }
  };

  const headerActions = (
    <div className="flex items-center gap-3">
      <QuickTransactionForm month={selectedMonth} compact onSuccess={() => loadTransactions(selectedMonth?.id)} />
    </div>
  );

  if (loading && !selectedMonth) {
    return (
      <AppLayout title="Transações" description="Gerencie suas transações">
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Transações"
      description="Gerencie e acompanhe seus lançamentos financeiros"
      actions={headerActions}
      contentClassName="w-full space-y-8"
    >
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        {/* Month Selector */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Mês de referência
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {months.slice(0, 6).map(mes => (
                <Button
                  key={mes.id}
                  variant={selectedMonth?.id === mes.id ? "default" : "outline"}
                  onClick={() => handleMonthChange(mes)}
                  className="whitespace-nowrap"
                  size="sm"
                >
                  {getMonthName(mes.mes, mes.ano)}
                </Button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2" 
              onClick={() => setShowCategoryDialog(true)}
            >
              <Layers className="w-4 h-4" />
              Categorias
            </Button>
            {cartoes.length > 0 && (
              <Select value={filterCartao} onValueChange={setFilterCartao}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Filtrar por cartão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cartões</SelectItem>
                  <SelectItem value="none">Sem cartão</SelectItem>
                  {cartoes.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Tabs for View Modes */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'overview' | 'daily')} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="daily" className="gap-2">
            <Calendar className="h-4 w-4" />
            Visualização Diária
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-2">
            <Table2 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-8 space-y-8">
          <TransactionsOverview transactions={transacoes} loading={loading} />
          
          {/* Metas Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">Metas e Objetivos</h2>
            </div>
            <GoalsSection />
          </div>
        </TabsContent>

        <TabsContent value="daily" className="mt-8 space-y-8">
          <DailyTransactionsView
            transactions={transacoes}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDeleteTransaction}
            selectedMonth={selectedMonth}
          />
          
          {/* Metas Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">Metas e Objetivos</h2>
            </div>
            <GoalsSection />
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Transaction Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
            <DialogDescription>
              Atualize os dados da transação
            </DialogDescription>
          </DialogHeader>

          {editingTransaction && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dia</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={editingTransaction.dia}
                    onChange={(e) =>
                      setEditingTransaction({
                        ...editingTransaction,
                        dia: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingTransaction.valor_original}
                    onChange={(e) =>
                      setEditingTransaction({
                        ...editingTransaction,
                        valor_original: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={editingTransaction.descricao}
                  onChange={(e) =>
                    setEditingTransaction({
                      ...editingTransaction,
                      descricao: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={editingTransaction.categoria_id}
                    onValueChange={(value) =>
                      setEditingTransaction({
                        ...editingTransaction,
                        categoria_id: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icone} {cat.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Conta</Label>
                  <Select
                    value={editingTransaction.banco_conta_id}
                    onValueChange={(value) =>
                      setEditingTransaction({
                        ...editingTransaction,
                        banco_conta_id: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contas.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={editingTransaction.tipo}
                  onValueChange={(value: any) =>
                    setEditingTransaction({
                      ...editingTransaction,
                      tipo: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida_fixa">Saída Fixa</SelectItem>
                    <SelectItem value="diario">Gasto Diário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateTransaction}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription>
              Crie uma nova categoria para suas transações
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={categoryForm.nome}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, nome: e.target.value })
                }
                placeholder="Ex: Alimentação"
              />
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <Input
                value={categoryForm.icone}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, icone: e.target.value })
                }
                placeholder="📌"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={categoryForm.tipo}
                onValueChange={(value: any) =>
                  setCategoryForm({ ...categoryForm, tipo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="variavel">Variável</SelectItem>
                  <SelectItem value="fixa">Fixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCategory} disabled={creatingCategory}>
              {creatingCategory ? "Criando..." : "Criar Categoria"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
