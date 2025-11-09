import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ensureMonthExists, getPreviousMonths, getMonthName } from '@/lib/monthHelper';

export default function Transactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<any>(null);
  const [months, setMonths] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [newRow, setNewRow] = useState<any>(null);

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

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  if (!selectedMonth) {
    return <div className="p-8 text-center">Nenhum mês selecionado</div>;
  }

  // Calcular totais
  const totals = {
    entradas: transacoes.filter(t => t.tipo === 'entrada').reduce((s, t) => s + t.valor_original, 0),
    saidas: transacoes.filter(t => t.tipo === 'saida_fixa').reduce((s, t) => s + t.valor_original, 0),
    diario: transacoes.filter(t => t.tipo === 'diario').reduce((s, t) => s + t.valor_original, 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-heading font-bold">Gestão de Transações</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Seletor de Mês */}
        <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
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
                    R$ {(totals.entradas - totals.saidas - totals.diario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
      </main>
    </div>
  );
}
