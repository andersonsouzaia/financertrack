import { Edit2, Trash2, ChevronDown } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function TransactionsTable() {
  const { transactions, totals, loading, deleteTransaction } = useTransactions();

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta transação?')) {
      await deleteTransaction(id);
    }
  };

  if (loading) {
    return (
      <div className="w-full p-8 text-center">
        <p className="text-muted-foreground">Carregando transações...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="w-full p-8 text-center">
        <p className="text-muted-foreground">Nenhuma transação encontrada</p>
        <p className="text-sm text-muted-foreground mt-2">
          Use o chat abaixo para registrar seus gastos
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Dia</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="w-[100px]">Tipo</TableHead>
            <TableHead className="w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((trans, idx) => (
            <TableRow key={trans.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
              <TableCell className="font-semibold">{trans.dia}</TableCell>
              <TableCell>{trans.descricao}</TableCell>
              <TableCell>
                {trans.categoria && (
                  <span className="inline-flex items-center gap-1">
                    <span>{trans.categoria.icone}</span>
                    <span>{trans.categoria.nome}</span>
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <span className={
                  trans.tipo === 'entrada' ? 'text-success font-semibold' :
                  trans.tipo === 'saida_fixa' ? 'text-danger font-semibold' :
                  'text-primary font-semibold'
                }>
                  {trans.tipo === 'entrada' ? '+' : '-'} R$ {Number(trans.valor_original).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-xs px-2 py-1 rounded-full bg-muted">
                  {trans.tipo === 'entrada' ? 'Entrada' :
                   trans.tipo === 'saida_fixa' ? 'Fixa' : 'Diário'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(trans.id)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Totals */}
      <div className="border-t bg-muted/50 px-4 py-3 text-sm font-medium">
        <div className="flex justify-between items-center">
          <span>Totais do Mês:</span>
          <div className="flex gap-4">
            <span className="text-success">
              Entradas: R$ {totals.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-danger">
              Saídas: R$ {totals.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-primary">
              Diário: R$ {totals.diario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
