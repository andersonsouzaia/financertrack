import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ensureMonthExists, getPreviousMonths, getMonthName } from '@/lib/monthHelper';
import { ChartCard } from '@/components/charts/ChartCard';
import { ChartTooltipContent } from '@/components/charts/ChartTooltip';
import { getChartColor } from '@/components/charts/chart-colors';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [newRow, setNewRow] = useState<any>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    nome: '',
    icone: '📌',
    cor: '#2563eb',
    tipo: 'variavel',
  });
  const formatCurrency = (value) =>
    `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

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

  useEffect(() => {
    if (user) {
      initializeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (
      searchParams.get('nova') === '1' &&
      categorias.length > 0 &&
      contas.length > 0 &&
      !newRow &&
      !loading
    ) {
      handleAddRow();
      const params = new URLSearchParams(searchParams);
      params.delete('nova');
      setSearchParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, categorias, contas, newRow, loading]);

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

      // 5. Buscar transações do mês
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

  const loadTransactions = async (mesId: string) => {
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select(`
          *,
          categoria:categorias_saidas(nome, icone),
          observacao:observacoes_gastos(observacao)
        `)
        .eq('mes_financeiro_id', mesId)
        .eq('deletado', false)
        .order('dia', { ascending: true });

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
  };

  const handleMonthChange = (mes: any) => {
    setSelectedMonth(mes);
    loadTransactions(mes.id);
  };

  const handleAddRow = () => {
    if (categorias.length === 0) {
      toast({
        variant: "destructive",
        title: "Categorias necessárias",
        description: "Crie ao menos uma categoria antes de adicionar transações."
      });
      setShowCategoryDialog(true);
      return;
    }

    setNewRow({
      tipo: 'diario',
      categoria_id: categorias[0]?.id || '',
      banco_conta_id: contas[0]?.id || '',
      descricao: '',
      valor_original: '',
      dia: new Date().getDate(),
      observacao: ''
    });
  };

  const handleSaveNewRow = async () => {
    const valorNumerico = Number.parseFloat(newRow.valor_original);
    if (!newRow.descricao || !newRow.categoria_id || !Number.isFinite(valorNumerico)) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha descrição, valor e categoria com um valor válido"
      });
      return;
    }

    try {
      const contasAtualizadas = await fetchAccounts();
      const contaAtual = contasAtualizadas.find(c => c.id === newRow.banco_conta_id) || null;
      if (!contaAtual) {
        throw new Error('Conta selecionada não encontrada');
      }

      const { data: transData, error: transError } = await supabase
        .from('transacoes')
        .insert({
          user_id: user.id,
          mes_financeiro_id: selectedMonth.id,
          categoria_id: newRow.categoria_id,
          banco_conta_id: newRow.banco_conta_id,
          tipo: newRow.tipo,
          descricao: newRow.descricao,
          valor_original: valorNumerico,
          moeda_original: 'BRL',
          dia: parseInt(newRow.dia),
          editado_manualmente: true
        })
        .select()
        .single();

      if (transError) throw transError;

      // Inserir observação se houver
      if (newRow.observacao) {
        await supabase
          .from('observacoes_gastos')
          .insert({
            transacao_id: transData.id,
            observacao: newRow.observacao
          });
      }

      // Atualizar saldo
      const delta = newRow.tipo === 'entrada' ? valorNumerico : -valorNumerico;
      const novoSaldo = Number(contaAtual.saldo_atual) + delta;
      await supabase
        .from('bancos_contas')
        .update({ saldo_atual: novoSaldo })
        .eq('id', newRow.banco_conta_id);

      toast({
        title: "Transação adicionada!",
        description: `R$ ${parseFloat(newRow.valor_original).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      });

      setNewRow(null);
      await loadTransactions(selectedMonth.id);
      await fetchAccounts();
    } catch (error: any) {
      console.error('Erro:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message
      });
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      nome: '',
      icone: '📌',
      cor: '#2563eb',
      tipo: 'variavel',
    });
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
      resetCategoryForm();
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

  const handleUpdateTransaction = async (id: string) => {
    try {
      const transacaoOriginal = transacoes.find(t => t.id === id);
      if (!transacaoOriginal) {
        throw new Error('Transação não encontrada');
      }

      const dadosAtualizados = {
        dia: editValues.dia ?? transacaoOriginal.dia,
        descricao: editValues.descricao ?? transacaoOriginal.descricao,
        valor_original: editValues.valor_original ?? transacaoOriginal.valor_original,
        tipo: editValues.tipo ?? transacaoOriginal.tipo,
        banco_conta_id: editValues.banco_conta_id ?? transacaoOriginal.banco_conta_id,
      };

      const valorNovo = Number(dadosAtualizados.valor_original);
      if (!Number.isFinite(valorNovo)) {
        throw new Error('Informe um valor válido');
      }

      const { data: contaAtual } = await supabase
        .from('bancos_contas')
        .select('saldo_atual')
        .eq('id', transacaoOriginal.banco_conta_id)
        .maybeSingle();

      const { error } = await supabase
        .from('transacoes')
        .update({
          dia: dadosAtualizados.dia,
          descricao: dadosAtualizados.descricao,
          valor_original: valorNovo,
          tipo: dadosAtualizados.tipo,
          banco_conta_id: dadosAtualizados.banco_conta_id
        })
        .eq('id', id);

      if (error) throw error;

      const contaDestinoId = dadosAtualizados.banco_conta_id;
      const mesmaConta = contaDestinoId === transacaoOriginal.banco_conta_id;
      const efeitoAntigo = transacaoOriginal.tipo === 'entrada'
        ? Number(transacaoOriginal.valor_original)
        : -Number(transacaoOriginal.valor_original);
      const efeitoNovo = dadosAtualizados.tipo === 'entrada'
        ? valorNovo
        : -valorNovo;

      if (mesmaConta && contaAtual) {
        const delta = efeitoNovo - efeitoAntigo;
        if (delta !== 0) {
          const novoSaldo = Number(contaAtual.saldo_atual) + delta;
          await supabase
            .from('bancos_contas')
            .update({ saldo_atual: novoSaldo })
            .eq('id', transacaoOriginal.banco_conta_id);
        }
      } else {
        if (contaAtual) {
          const novoSaldoOrigem = Number(contaAtual.saldo_atual) - efeitoAntigo;
          await supabase
            .from('bancos_contas')
            .update({ saldo_atual: novoSaldoOrigem })
            .eq('id', transacaoOriginal.banco_conta_id);
        }

        const { data: contaDestino } = await supabase
          .from('bancos_contas')
          .select('saldo_atual')
          .eq('id', contaDestinoId)
          .maybeSingle();

        if (contaDestino) {
          const novoSaldoDestino = Number(contaDestino.saldo_atual) + efeitoNovo;
          await supabase
            .from('bancos_contas')
            .update({ saldo_atual: novoSaldoDestino })
            .eq('id', contaDestinoId);
        }
      }

      toast({ title: "Atualizado!" });
      setEditingId(null);
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
    if (!window.confirm('Deletar transação?')) return;

    try {
      await supabase
        .from('transacoes')
        .update({ deletado: true })
        .eq('id', id);

      toast({ title: "Deletado!" });
      await loadTransactions(selectedMonth.id);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message
      });
    }
  };

  const totals = useMemo(() => {
    const entradas = transacoes
      .filter(t => t.tipo === 'entrada')
      .reduce((s, t) => s + Number(t.valor_original || 0), 0);
    const saidas = transacoes
      .filter(t => t.tipo === 'saida_fixa')
      .reduce((s, t) => s + Number(t.valor_original || 0), 0);
    const diario = transacoes
      .filter(t => t.tipo === 'diario')
      .reduce((s, t) => s + Number(t.valor_original || 0), 0);

    return {
      entradas,
      saidas,
      diario,
      saldo: entradas - saidas - diario,
    };
  }, [transacoes]);

  const categoryChartData = useMemo(() => {
    const map = new Map<string, { name: string; value: number; icon: string }>();

    transacoes.forEach((trans) => {
      if (trans.tipo === 'entrada') return;
      const key = trans.categoria?.nome || 'Sem categoria';
      const icon = trans.categoria?.icone || '📌';
      const current = map.get(key) ?? { name: key, value: 0, icon };
      current.value += Number(trans.valor_original) || 0;
      map.set(key, current);
    });

    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [transacoes]);

  const dailyChartData = useMemo(() => {
    const daily = new Map<number, { dia: number; entradas: number; fixas: number; diario: number }>();

    transacoes.forEach((trans) => {
      const dia = trans.dia;
      if (!daily.has(dia)) {
        daily.set(dia, { dia, entradas: 0, fixas: 0, diario: 0 });
      }

      const entry = daily.get(dia)!;
      const valor = Number(trans.valor_original) || 0;

      if (trans.tipo === 'entrada') {
        entry.entradas += valor;
      } else if (trans.tipo === 'saida_fixa') {
        entry.fixas += valor;
      } else {
        entry.diario += valor;
      }
    });

    return Array.from(daily.values()).sort((a, b) => a.dia - b.dia);
  }, [transacoes]);

  const hasCategories = categorias.length > 0;
  const hasTransactions = transacoes.length > 0;

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  if (!selectedMonth) {
    return <div className="p-8 text-center">Nenhum mês selecionado</div>;
  }

  const headerActions = (
    <Button size="sm" onClick={() => navigate('/transactions?nova=1')} className="gap-2">
      <Plus className="h-4 w-4" />
      Nova transação
    </Button>
  );

  return (
    <AppLayout
      title="Transações"
      description="Gerencie e acompanhe seus lançamentos do mês selecionado."
      actions={headerActions}
      contentClassName="space-y-6"
    >
      <div className="flex flex-col gap-6">
        {/* Seletor de Mês */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {months.map(mes => (
              <Button
                key={mes.id}
                variant={selectedMonth.id === mes.id ? "default" : "outline"}
                onClick={() => handleMonthChange(mes)}
                className="whitespace-nowrap"
              >
                {getMonthName(mes.mes, mes.ano)}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowCategoryDialog(true)}>
              <Layers className="w-4 h-4" />
              Gerenciar categorias
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleAddRow}
              disabled={Boolean(newRow)}
            >
              <Plus className="w-4 h-4" />
              Nova linha rápida
            </Button>
          </div>
        </div>

        {!loading && !hasCategories && (
          <div className="mb-6 rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4 text-sm text-muted-foreground">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <span>
                Você ainda não possui categorias configuradas. Crie categorias para organizar seus gastos e habilitar a inclusão de transações.
              </span>
              <Button size="sm" onClick={() => setShowCategoryDialog(true)}>
                Criar categoria
              </Button>
            </div>
          </div>
        )}

        {/* Gráficos */}
        <div className="grid gap-4 lg:grid-cols-2 mb-8">
          <ChartCard
            title="Gastos por categoria"
            description="Visão geral das despesas do mês atual"
          >
            {categoryChartData.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Nenhum gasto registrado para este mês.
              </div>
            ) : (
              <>
                <ResponsiveContainer height={280}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={entry.name} fill={getChartColor(index)} />
                      ))}
                    </Pie>
                    <Tooltip
                      cursor={{ fill: 'rgba(148, 163, 184, 0.15)' }}
                      content={
                        <ChartTooltipContent
                          valueFormatter={(value) => formatCurrency(value)}
                        />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2">
                  {categoryChartData.slice(0, 5).map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: getChartColor(index) }}
                        />
                        <span className="font-medium text-foreground">
                          {item.icon} {item.name}
                        </span>
                      </div>
                      <span className="font-semibold text-muted-foreground">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </ChartCard>

          <ChartCard
            title="Fluxo diário"
            description="Entradas e saídas por dia do mês"
          >
            {dailyChartData.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Registre transações para visualizar o fluxo diário.
              </div>
            ) : (
              <ResponsiveContainer height={280}>
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={72} />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.15)' }}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(label) => `Dia ${label}`}
                        valueFormatter={(value, key) => {
                          const labels = {
                            entradas: 'Entradas',
                            fixas: 'Saídas Fixas',
                            diario: 'Gastos Diários',
                          } as Record<string, string>;
                          return `${labels[key] ?? key}: ${formatCurrency(value)}`;
                        }}
                      />
                    }
                  />
                  <Bar dataKey="entradas" name="Entradas" fill={getChartColor(0)} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fixas" name="Saídas Fixas" stackId="gastos" fill={getChartColor(2)} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="diario" name="Gastos Diários" stackId="gastos" fill={getChartColor(3)} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Tabela */}
        <div className="bg-card rounded-lg shadow overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b-2">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">Dia</th>
                  <th className="px-4 py-3 text-left font-bold">Descrição</th>
                  <th className="px-4 py-3 text-left font-bold">Categoria</th>
                  <th className="px-4 py-3 text-left font-bold">Tipo</th>
                  <th className="px-4 py-3 text-right font-bold">Valor</th>
                  <th className="px-4 py-3 text-left font-bold">Observação</th>
                  <th className="px-4 py-3 text-center font-bold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {transacoes.map((trans, idx) => (
                  <tr
                    key={trans.id}
                    className={`border-b hover:bg-muted/50 ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}
                  >
                    <td className="px-4 py-3 font-semibold">
                      {editingId === trans.id ? (
                        <input
                          type="number"
                          value={editValues.dia || trans.dia}
                          onChange={(e) => setEditValues({ ...editValues, dia: parseInt(e.target.value) })}
                          min="1"
                          max="31"
                          className="w-16 px-2 py-1 border rounded bg-background"
                        />
                      ) : (
                        trans.dia
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === trans.id ? (
                        <input
                          type="text"
                          value={editValues.descricao || trans.descricao}
                          onChange={(e) => setEditValues({ ...editValues, descricao: e.target.value })}
                          className="w-full px-2 py-1 border rounded bg-background"
                        />
                      ) : (
                        trans.descricao
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                        {trans.categoria?.icone} {trans.categoria?.nome}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {trans.tipo === 'entrada' ? '🟢 Entrada' :
                       trans.tipo === 'saida_fixa' ? '🔴 Saída Fixa' : '🔵 Diário'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {editingId === trans.id ? (
                        <input
                          type="number"
                          value={editValues.valor_original || trans.valor_original}
                          onChange={(e) => setEditValues({ ...editValues, valor_original: parseFloat(e.target.value) })}
                          step="0.01"
                          className="w-32 px-2 py-1 border rounded text-right bg-background"
                        />
                      ) : (
                        `R$ ${trans.valor_original.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {trans.observacao?.[0]?.observacao || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingId === trans.id ? (
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleUpdateTransaction(trans.id)}
                          >
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingId(null)}
                          >
                            ✗
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(trans.id);
                              setEditValues({
                                dia: trans.dia,
                                descricao: trans.descricao,
                                valor_original: trans.valor_original,
                                tipo: trans.tipo,
                                banco_conta_id: trans.banco_conta_id
                              });
                            }}
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteTransaction(trans.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {/* Linha de adição */}
                {newRow && (
                  <tr className="bg-yellow-50 dark:bg-yellow-900/20 border-b-2">
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={newRow.dia}
                        onChange={(e) => setNewRow({ ...newRow, dia: parseInt(e.target.value) })}
                        min="1"
                        max="31"
                        className="w-16 px-2 py-1 border rounded bg-background"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={newRow.descricao}
                        onChange={(e) => setNewRow({ ...newRow, descricao: e.target.value })}
                        placeholder="Descrição..."
                        className="w-full px-2 py-1 border rounded bg-background"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={newRow.categoria_id}
                        onChange={(e) => setNewRow({ ...newRow, categoria_id: e.target.value })}
                        className="w-full px-2 py-1 border rounded bg-background"
                      >
                        <option value="">Selecione</option>
                        {categorias.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icone} {cat.nome}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={newRow.tipo}
                        onChange={(e) => setNewRow({ ...newRow, tipo: e.target.value })}
                        className="w-full px-2 py-1 border rounded bg-background"
                      >
                        <option value="entrada">Entrada</option>
                        <option value="saida_fixa">Saída Fixa</option>
                        <option value="diario">Diário</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={newRow.valor_original}
                        onChange={(e) => setNewRow({ ...newRow, valor_original: e.target.value })}
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        className="w-full px-2 py-1 border rounded text-right bg-background"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={newRow.observacao}
                        onChange={(e) => setNewRow({ ...newRow, observacao: e.target.value })}
                        placeholder="Observação..."
                        className="w-full px-2 py-1 border rounded bg-background"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <Button size="sm" variant="default" onClick={handleSaveNewRow}>
                          ✓
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setNewRow(null)}>
                          ✗
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-muted border-t-2 font-bold">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right">TOTAL:</td>
                  <td className="px-4 py-3 text-right">
                    R$ {totals.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Botão Adicionar */}
        {!newRow && (
          <Button onClick={handleAddRow} className="mb-6">
            <Plus className="w-4 h-4 mr-2" /> Adicionar Transação
          </Button>
        )}

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-muted-foreground mb-1">Entradas</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              +R$ {totals.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-muted-foreground mb-1">Saídas Fixas</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              -R$ {totals.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-muted-foreground mb-1">Diário</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              -R$ {totals.diario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <Dialog
        open={showCategoryDialog}
        onOpenChange={(open) => {
          setShowCategoryDialog(open);
          if (!open) {
            resetCategoryForm();
            setCreatingCategory(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Criar nova categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Categorias existentes</p>
              {categorias.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ainda não há categorias cadastradas. Adicione novas ou volte ao onboarding para selecionar.
                </p>
              ) : (
                <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-md border border-dashed border-border p-3 text-sm">
                  {categorias.map((categoria) => (
                    <span
                      key={categoria.id}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-foreground"
                    >
                      <span>{categoria.icone}</span>
                      <span className="font-medium">{categoria.nome}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-border/60" />

            <div className="space-y-2">
              <Label htmlFor="categoria-nome">Nome</Label>
              <Input
                id="categoria-nome"
                placeholder="Ex: Alimentação, Transporte..."
                value={categoryForm.nome}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, nome: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria-icone">Ícone (emoji)</Label>
                <Input
                  id="categoria-icone"
                  value={categoryForm.icone}
                  maxLength={2}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, icone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria-cor">Cor</Label>
                <Input
                  id="categoria-cor"
                  type="color"
                  value={categoryForm.cor}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, cor: e.target.value }))}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria-tipo">Tipo</Label>
              <Select
                value={categoryForm.tipo}
                onValueChange={(value) => setCategoryForm((prev) => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger id="categoria-tipo">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="variavel">Gasto diário</SelectItem>
                  <SelectItem value="fixa">Despesa fixa</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCategoryDialog(false);
                resetCategoryForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateCategory} disabled={creatingCategory}>
              {creatingCategory ? 'Salvando...' : 'Criar categoria'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
