import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ensureMonthExists, getPreviousMonths } from '@/lib/monthHelper';

export function TransactionsTableView() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<any>(null);
  const [months, setMonths] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    tipo: 'diario',
    categoria_id: '',
    banco_conta_id: '',
    descricao: '',
    valor_original: 0,
    dia: new Date().getDate(),
    observacao: ''
  });

  useEffect(() => {
    initializeData();
  }, [user]);

  const initializeData = async () => {
    if (!user) return;

    try {
      const { month } = await ensureMonthExists(user.id);
      setSelectedMonth(month);

      const allMonths = await getPreviousMonths(user.id, 12);
      setMonths(allMonths);

      const { data: cats } = await supabase
        .from('categorias_saidas')
        .select('*')
        .eq('user_id', user.id);
      setCategorias(cats || []);

      const { data: accs } = await supabase
        .from('bancos_contas')
        .select('*')
        .eq('user_id', user.id);
      setContas(accs || []);

      if (cats && cats.length > 0) {
        setNewTransaction(prev => ({ ...prev, categoria_id: cats[0].id }));
      }
      if (accs && accs.length > 0) {
        setNewTransaction(prev => ({ ...prev, banco_conta_id: accs[0].id }));
      }

      await fetchTransactions(month.id);
    } catch (error: any) {
      console.error('Erro ao inicializar:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar",
        description: error.message
      });
    }
  };

  const fetchTransactions = async (mesId: string) => {
    try {
      const { data } = await supabase
        .from('transacoes')
        .select(`
          *,
          categoria:categorias_saidas(nome, icone),
          banco:bancos_contas(nome_banco),
          observacao:observacoes_gastos(observacao)
        `)
        .eq('mes_financeiro_id', mesId)
        .eq('deletado', false)
        .order('dia', { ascending: true });

      setTransacoes(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      setLoading(false);
    }
  };

  const handleMonthChange = (mes: any) => {
    setSelectedMonth(mes);
    fetchTransactions(mes.id);
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.descricao || !newTransaction.valor_original || !newTransaction.categoria_id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha descrição, valor e categoria"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transacoes')
        .insert({
          user_id: user?.id,
          mes_financeiro_id: selectedMonth.id,
          ...newTransaction,
          valor_original: parseFloat(newTransaction.valor_original.toString())
        })
        .select();

      if (error) throw error;

      const conta = contas.find(c => c.id === newTransaction.banco_conta_id);
      if (conta) {
        const novoSaldo = newTransaction.tipo === 'entrada'
          ? conta.saldo_atual + parseFloat(newTransaction.valor_original.toString())
          : conta.saldo_atual - parseFloat(newTransaction.valor_original.toString());

        await supabase
          .from('bancos_contas')
          .update({ saldo_atual: novoSaldo })
          .eq('id', newTransaction.banco_conta_id);
      }

      if (newTransaction.observacao && data && data[0]) {
        await supabase
          .from('observacoes_gastos')
          .insert({
            transacao_id: data[0].id,
            observacao: newTransaction.observacao
          });
      }

      toast({
        title: "Transação adicionada!",
        description: `R$ ${parseFloat(newTransaction.valor_original.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      });

      setNewTransaction({
        tipo: 'diario',
        categoria_id: categorias[0]?.id || '',
        banco_conta_id: contas[0]?.id || '',
        descricao: '',
        valor_original: 0,
        dia: new Date().getDate(),
        observacao: ''
      });
      setIsAddingRow(false);
      await fetchTransactions(selectedMonth.id);
    } catch (error: any) {
      console.error('Erro ao adicionar:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message
      });
    }
  };

  const handleUpdateTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transacoes')
        .update(editValues)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Transação atualizada!",
      });

      setEditingId(null);
      await fetchTransactions(selectedMonth.id);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message
      });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Deseja deletar esta transação?')) return;

    try {
      await supabase
        .from('transacoes')
        .update({ deletado: true })
        .eq('id', id);

      toast({
        title: "Transação deletada!"
      });

      await fetchTransactions(selectedMonth.id);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message
      });
    }
  };

  if (loading) return <div className="text-center p-8 text-muted-foreground">Carregando...</div>;
  if (!selectedMonth) return <div className="text-center p-8 text-muted-foreground">Nenhum mês selecionado</div>;

  const totals = {
    entradas: transacoes.filter(t => t.tipo === 'entrada').reduce((sum, t) => sum + t.valor_original, 0),
    saidas: transacoes.filter(t => t.tipo === 'saida_fixa').reduce((sum, t) => sum + t.valor_original, 0),
    diario: transacoes.filter(t => t.tipo === 'diario').reduce((sum, t) => sum + t.valor_original, 0)
  };

  return (
    <div className="transactions-table-container space-y-4">
      {/* Seletor de Mês */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {months.map(mes => (
          <button
            key={mes.id}
            onClick={() => handleMonthChange(mes)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
              selectedMonth.id === mes.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {mes.mes}/{mes.ano}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto bg-card rounded-lg shadow border">
        <table className="w-full">
          <thead className="bg-muted border-b-2">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-bold text-foreground">Dia</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-foreground">Descrição</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-foreground">Categoria</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-foreground">Tipo</th>
              <th className="px-4 py-3 text-right text-sm font-bold text-foreground">Valor</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-foreground">Observação</th>
              <th className="px-4 py-3 text-center text-sm font-bold text-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {transacoes.map((trans, idx) => (
              <tr
                key={trans.id}
                className={`border-b hover:bg-muted/50 transition-colors ${
                  idx % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                }`}
              >
                <td className="px-4 py-3 font-semibold text-foreground">
                  {editingId === trans.id ? (
                    <input
                      type="number"
                      value={editValues.dia || trans.dia}
                      onChange={(e) => setEditValues({ ...editValues, dia: parseInt(e.target.value) })}
                      min={1}
                      max={31}
                      className="w-12 px-2 py-1 border rounded bg-background"
                    />
                  ) : (
                    trans.dia
                  )}
                </td>
                <td className="px-4 py-3 text-foreground">
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
                  <span className="inline-block px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                    {trans.categoria?.icone} {trans.categoria?.nome}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-medium ${
                    trans.tipo === 'entrada' ? 'text-green-600 dark:text-green-400' :
                    trans.tipo === 'saida_fixa' ? 'text-red-600 dark:text-red-400' :
                    'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {trans.tipo === 'entrada' ? '+' : '-'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">
                  {editingId === trans.id ? (
                    <input
                      type="number"
                      value={editValues.valor_original || trans.valor_original}
                      onChange={(e) => setEditValues({ ...editValues, valor_original: parseFloat(e.target.value) })}
                      step={0.01}
                      className="w-24 px-2 py-1 border rounded text-right bg-background"
                    />
                  ) : (
                    `R$ ${trans.valor_original.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {trans.observacao?.[0]?.observacao}
                </td>
                <td className="px-4 py-3 text-center flex justify-center gap-2">
                  {editingId === trans.id ? (
                    <>
                      <button
                        onClick={() => handleUpdateTransaction(trans.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-muted text-foreground rounded text-sm hover:bg-muted/80"
                      >
                        ✗
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(trans.id);
                          setEditValues(trans);
                        }}
                        className="p-1 text-primary hover:bg-primary/10 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(trans.id)}
                        className="p-1 text-destructive hover:bg-destructive/10 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {/* Linha de adição */}
            {isAddingRow && (
              <tr className="bg-yellow-50 dark:bg-yellow-900/20 border-b-2 border-yellow-300">
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={newTransaction.dia}
                    onChange={(e) => setNewTransaction({ ...newTransaction, dia: parseInt(e.target.value) })}
                    min={1}
                    max={31}
                    className="w-12 px-2 py-1 border rounded bg-background"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={newTransaction.descricao}
                    onChange={(e) => setNewTransaction({ ...newTransaction, descricao: e.target.value })}
                    placeholder="Descrição..."
                    className="w-full px-2 py-1 border rounded bg-background"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={newTransaction.categoria_id}
                    onChange={(e) => setNewTransaction({ ...newTransaction, categoria_id: e.target.value })}
                    className="w-full px-2 py-1 border rounded bg-background text-sm"
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
                    value={newTransaction.tipo}
                    onChange={(e) => setNewTransaction({ ...newTransaction, tipo: e.target.value })}
                    className="w-full px-2 py-1 border rounded bg-background text-sm"
                  >
                    <option value="entrada">Entrada</option>
                    <option value="saida_fixa">Saída Fixa</option>
                    <option value="diario">Diário</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={newTransaction.valor_original}
                    onChange={(e) => setNewTransaction({ ...newTransaction, valor_original: parseFloat(e.target.value) || 0 })}
                    step={0.01}
                    min={0}
                    placeholder="0,00"
                    className="w-full px-2 py-1 border rounded text-right bg-background"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={newTransaction.observacao}
                    onChange={(e) => setNewTransaction({ ...newTransaction, observacao: e.target.value })}
                    placeholder="Observação..."
                    className="w-full px-2 py-1 border rounded bg-background text-sm"
                  />
                </td>
                <td className="px-4 py-3 text-center flex justify-center gap-2">
                  <button
                    onClick={handleAddTransaction}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 font-bold"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingRow(false);
                      setNewTransaction({
                        tipo: 'diario',
                        categoria_id: categorias[0]?.id || '',
                        banco_conta_id: contas[0]?.id || '',
                        descricao: '',
                        valor_original: 0,
                        dia: new Date().getDate(),
                        observacao: ''
                      });
                    }}
                    className="px-3 py-1 bg-muted text-foreground rounded text-sm hover:bg-muted/80"
                  >
                    ✗
                  </button>
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-muted border-t-2">
            <tr>
              <td colSpan={4} className="px-4 py-3 font-bold text-foreground text-right">TOTAL:</td>
              <td className="px-4 py-3 font-bold text-right text-foreground">
                R$ {(totals.entradas + totals.saidas + totals.diario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Botão de Adicionar */}
      {!isAddingRow && (
        <button
          onClick={() => setIsAddingRow(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus size={18} /> Adicionar Transação
        </button>
      )}

      {/* Resumo por Tipo */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
        <div>
          <p className="text-sm text-muted-foreground">Entradas</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            +R$ {totals.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Saídas Fixas</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">
            -R$ {totals.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Diário</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            -R$ {totals.diario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
}
