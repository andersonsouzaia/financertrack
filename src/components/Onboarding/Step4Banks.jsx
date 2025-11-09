import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const BANCOS = [
  'Nubank', 'Bradesco', 'Itaú', 'Santander', 'Caixa Econômica',
  'Banco do Brasil', 'Banrisul', 'Inter', 'Banco Votorantim',
  'Banco Safra', 'BTG Pactual', 'XP Investimentos', 'Outro'
];

export default function OnboardingStep4({ data, onNext }) {
  const [contas, setContas] = useState(data.contas);

  const addConta = () => {
    setContas([...contas, {
      nome_banco: 'Nubank',
      tipo_conta: 'corrente',
      saldo_atual: 0,
      finalidade: 'salario',
      agencia: '',
      numero_conta: ''
    }]);
  };

  const removeConta = (index) => {
    if (contas.length > 1) {
      setContas(contas.filter((_, i) => i !== index));
    }
  };

  const updateConta = (index, field, value) => {
    const novasContas = [...contas];
    novasContas[index] = { ...novasContas[index], [field]: value };
    setContas(novasContas);
  };

  const saldoTotal = contas.reduce((sum, c) => sum + (parseFloat(c.saldo_atual) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext({ contas });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          🏦 Suas Contas Bancárias
        </h2>
        <p className="text-muted-foreground">
          Registre suas contas para ter visão completa
        </p>
      </div>

      <div className="space-y-4">
        {contas.map((conta, idx) => (
          <div key={idx} className="p-4 border border-border rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Conta {idx + 1}</h3>
              {contas.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeConta(idx)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Banco
                </label>
                <select
                  value={conta.nome_banco}
                  onChange={(e) => updateConta(idx, 'nome_banco', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm"
                >
                  {BANCOS.map(banco => (
                    <option key={banco} value={banco}>{banco}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tipo
                </label>
                <select
                  value={conta.tipo_conta}
                  onChange={(e) => updateConta(idx, 'tipo_conta', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm"
                >
                  <option value="corrente">Corrente</option>
                  <option value="poupanca">Poupança</option>
                  <option value="investimento">Investimento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Saldo (R$)
                </label>
                <input
                  type="number"
                  value={conta.saldo_atual}
                  onChange={(e) => updateConta(idx, 'saldo_atual', parseFloat(e.target.value) || 0)}
                  min={0}
                  step={100}
                  className="w-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Finalidade
                </label>
                <select
                  value={conta.finalidade}
                  onChange={(e) => updateConta(idx, 'finalidade', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm"
                >
                  <option value="salario">Salário</option>
                  <option value="poupanca">Poupança</option>
                  <option value="emergencia">Emergência</option>
                  <option value="investimentos">Investimentos</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addConta}
        className="w-full py-2 border-2 border-dashed border-primary/50 rounded-lg text-primary font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={18} /> Adicionar Outra Conta
      </button>

      <div className="bg-primary/10 p-4 rounded-lg">
        <p className="text-sm text-foreground">Saldo Total:</p>
        <p className="text-2xl font-bold text-primary">
          R$ {saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    </form>
  );
}
