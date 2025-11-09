import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthName } from '@/lib/monthHelper';

export function TransactionsSpreadsheet() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState(null);
  const [months, setMonths] = useState([]);
  const [transacoes, setTransacoes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Buscar meses
      const { data: monthsData } = await supabase
        .from('meses_financeiros')
        .select('*')
        .eq('user_id', user.id)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false })
        .limit(12);

      setMonths(monthsData || []);
      
      if (monthsData && monthsData.length > 0) {
        setSelectedMonth(monthsData[0]);
        await loadTransactionsForMonth(monthsData[0].id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message
      });
      setLoading(false);
    }
  };

  const loadTransactionsForMonth = async (mesId) => {
    try {
      const { data } = await supabase
        .from('transacoes')
        .select(`
          *,
          categoria:categorias_saidas(nome, icone),
          observacao:observacoes_gastos(observacao)
        `)
        .eq('mes_financeiro_id', mesId)
        .eq('deletado', false)
        .order('dia', { ascending: true });

      // Organizar por dia
      const transacoesPorDia = {};
      data?.forEach(t => {
        if (!transacoesPorDia[t.dia]) {
          transacoesPorDia[t.dia] = [];
        }
        transacoesPorDia[t.dia].push(t);
      });

      setTransacoes(transacoesPorDia);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    }
  };

  const handleMonthChange = (mes) => {
    setSelectedMonth(mes);
    loadTransactionsForMonth(mes.id);
  };

  // Calcular saldos
  const getSaldoParaDia = (dia) => {
    let saldo = selectedMonth?.saldo_inicial || 0;

    for (let d = 1; d <= dia; d++) {
      if (transacoes[d]) {
        transacoes[d].forEach(t => {
          if (t.tipo === 'entrada') {
            saldo += Number(t.valor_original);
          } else {
            saldo -= Number(t.valor_original);
          }
        });
      }
    }

    return saldo;
  };

  const getValorPorTipo = (dia, tipo) => {
    if (!transacoes[dia]) return 0;

    return transacoes[dia]
      .filter(t => t.tipo === tipo)
      .reduce((sum, t) => sum + Number(t.valor_original), 0);
  };

  const getTotalPorTipo = (tipo) => {
    let total = 0;

    Object.values(transacoes).forEach(trans => {
      trans
        .filter(t => t.tipo === tipo)
        .forEach(t => {
          total += Number(t.valor_original);
        });
    });

    return total;
  };

  const getDescricaoPorDia = (dia) => {
    if (!transacoes[dia] || transacoes[dia].length === 0) return '-';
    
    return transacoes[dia]
      .map(t => {
        const obs = t.observacao?.[0]?.observacao || t.descricao;
        return `${t.categoria?.icone || '📌'} ${obs?.substring(0, 50)}`;
      })
      .join(' | ');
  };

  if (loading) return <div className="text-center p-8 text-foreground">Carregando...</div>;
  if (!selectedMonth) return <div className="text-center p-8 text-muted-foreground">Nenhum mês financeiro encontrado</div>;

  // Número de dias no mês
  const diasNoMes = new Date(selectedMonth.ano, selectedMonth.mes, 0).getDate();

  const totalEntradas = getTotalPorTipo('entrada');
  const totalSaidas = getTotalPorTipo('saida_fixa');
  const totalDiario = getTotalPorTipo('diario');
  const saldoFinal = getSaldoParaDia(diasNoMes);

  return (
    <div className="space-y-6">
      {/* Seletor de Mês */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => {
            const idx = months.indexOf(selectedMonth);
            if (idx < months.length - 1) {
              handleMonthChange(months[idx + 1]);
            }
          }}
          className="p-2 hover:bg-accent rounded"
          disabled={months.indexOf(selectedMonth) === months.length - 1}
        >
          <ChevronLeft size={24} className="text-foreground" />
        </button>

        <h2 className="text-2xl font-bold text-foreground min-w-64 text-center">
          {getMonthName(selectedMonth.mes, selectedMonth.ano)}
        </h2>

        <button
          onClick={() => {
            const idx = months.indexOf(selectedMonth);
            if (idx > 0) {
              handleMonthChange(months[idx - 1]);
            }
          }}
          className="p-2 hover:bg-accent rounded"
          disabled={months.indexOf(selectedMonth) === 0}
        >
          <ChevronRight size={24} className="text-foreground" />
        </button>
      </div>

      {/* Tabela Planilha */}
      <div className="bg-card rounded-lg shadow overflow-x-auto border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted border-b-2 border-border">
              <th className="px-4 py-3 text-left font-bold text-sm text-foreground border-r border-border">
                Dia
              </th>
              <th className="px-4 py-3 text-left font-bold text-sm text-foreground border-r border-border">
                Descrição/Observação
              </th>
              <th className="px-4 py-3 text-right font-bold text-sm text-green-600 dark:text-green-400 border-r border-border">
                Entrada
              </th>
              <th className="px-4 py-3 text-right font-bold text-sm text-red-600 dark:text-red-400 border-r border-border">
                Saída Fixa
              </th>
              <th className="px-4 py-3 text-right font-bold text-sm text-blue-600 dark:text-blue-400 border-r border-border">
                Diário
              </th>
              <th className="px-4 py-3 text-right font-bold text-sm text-foreground">
                Saldo
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Linhas para cada dia do mês */}
            {Array.from({ length: diasNoMes }, (_, i) => i + 1).map(dia => {
              const entrada = getValorPorTipo(dia, 'entrada');
              const saida = getValorPorTipo(dia, 'saida_fixa');
              const diario = getValorPorTipo(dia, 'diario');
              const saldo = getSaldoParaDia(dia);
              const descricao = getDescricaoPorDia(dia);
              const temTransacao = transacoes[dia] && transacoes[dia].length > 0;

              return (
                <tr
                  key={dia}
                  className={`border-b border-border ${
                    temTransacao
                      ? 'bg-yellow-50 dark:bg-yellow-900/10'
                      : 'bg-card'
                  }`}
                >
                  {/* Dia */}
                  <td className="px-4 py-3 font-bold text-foreground border-r border-border min-w-12">
                    {dia}
                  </td>

                  {/* Descrição */}
                  <td className="px-4 py-3 text-sm text-muted-foreground border-r border-border max-w-md truncate">
                    {descricao}
                  </td>

                  {/* Entrada */}
                  <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400 border-r border-border min-w-24">
                    {entrada > 0 ? `R$ ${entrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                  </td>

                  {/* Saída Fixa */}
                  <td className="px-4 py-3 text-right font-medium text-red-600 dark:text-red-400 border-r border-border min-w-24">
                    {saida > 0 ? `R$ ${saida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                  </td>

                  {/* Diário */}
                  <td className="px-4 py-3 text-right font-medium text-blue-600 dark:text-blue-400 border-r border-border min-w-24">
                    {diario > 0 ? `R$ ${diario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                  </td>

                  {/* Saldo */}
                  <td className={`px-4 py-3 text-right font-bold min-w-28 ${
                    saldo >= 0
                      ? 'text-foreground'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Footer com Totais */}
          <tfoot className="bg-muted border-t-2 border-border">
            <tr>
              <td colSpan="2" className="px-4 py-3 font-bold text-foreground border-r border-border">
                TOTAIS
              </td>
              <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400 border-r border-border">
                R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400 border-r border-border">
                R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-right font-bold text-blue-600 dark:text-blue-400 border-r border-border">
                R$ {totalDiario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-right font-bold text-foreground">
                R$ {saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
            </tr>

            {/* Linha de Performance */}
            <tr>
              <td colSpan="2" className="px-4 py-3 font-bold text-foreground border-r border-border">
                PERFORMANCE
              </td>
              <td colSpan="4" className={`px-4 py-3 text-right font-bold ${
                (totalEntradas - totalSaidas - totalDiario) >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                R$ {(totalEntradas - totalSaidas - totalDiario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-muted-foreground font-medium">ENTRADAS</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm text-muted-foreground font-medium">SAÍDAS FIXAS</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">
            R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-muted-foreground font-medium">DIÁRIO</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            R$ {totalDiario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${
          saldoFinal >= 0
            ? 'bg-muted border-border'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <p className="text-sm text-muted-foreground font-medium">SALDO TOTAL</p>
          <p className={`text-xl font-bold ${
            saldoFinal >= 0
              ? 'text-foreground'
              : 'text-red-600 dark:text-red-400'
          }`}>
            R$ {saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="text-sm text-muted-foreground">
          <p className="font-semibold mb-2 text-foreground">Como usar:</p>
          <ul className="space-y-1 text-xs">
            <li>✓ Cada linha representa um dia do mês</li>
            <li>✓ Use os botões ← → para navegar entre meses</li>
            <li>✓ Dias com transações aparecem em amarelo</li>
            <li>✓ O saldo é atualizado cumulativamente dia a dia</li>
            <li>✓ Clique em "Adicionar Transação" para inserir novos gastos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
