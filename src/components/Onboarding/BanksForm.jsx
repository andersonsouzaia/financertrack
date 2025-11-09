import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { banks, accountTypes, accountPurposes } from '@/data/banks';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function BanksForm({ onNext, onBack }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([{
    nome_banco: '',
    tipo_conta: '',
    saldo_atual: '',
    finalidade: ''
  }]);

  const addAccount = () => {
    setAccounts([...accounts, {
      nome_banco: '',
      tipo_conta: '',
      saldo_atual: '',
      finalidade: ''
    }]);
  };

  const removeAccount = (index) => {
    if (accounts.length > 1) {
      setAccounts(accounts.filter((_, i) => i !== index));
    }
  };

  const updateAccount = (index, field, value) => {
    const newAccounts = [...accounts];
    newAccounts[index][field] = value;
    setAccounts(newAccounts);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + (Number(acc.saldo_atual) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Insert all accounts
      const accountsToInsert = accounts.map((acc, index) => ({
        user_id: user.id,
        nome_banco: acc.nome_banco,
        tipo_conta: acc.tipo_conta,
        saldo_atual: Number(acc.saldo_atual),
        saldo_inicial: Number(acc.saldo_atual),
        finalidade: acc.finalidade,
        moeda: 'BRL',
        principal: index === 0, // First account is principal
        ativo: true
      }));

      const { error } = await supabase
        .from('bancos_contas')
        .insert(accountsToInsert);

      if (error) throw error;

      // Update month with initial balance
      const today = new Date();
      await supabase
        .from('meses_financeiros')
        .update({ saldo_inicial: totalBalance })
        .eq('user_id', user.id)
        .eq('mes', today.getMonth() + 1)
        .eq('ano', today.getFullYear());

      toast({
        title: "Contas cadastradas!",
        description: `${accounts.length} conta(s) adicionada(s)`
      });

      onNext();
    } catch (error) {
      console.error('Error saving accounts:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar contas",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-heading font-bold">Suas contas bancárias</h2>
        <p className="text-muted-foreground">
          Registre suas contas para ter visão completa
        </p>
      </div>

      <div className="space-y-4">
        {accounts.map((account, index) => (
          <Card key={index} className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Conta {index + 1}</h3>
              {accounts.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAccount(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label>Banco *</Label>
                <Select 
                  value={account.nome_banco} 
                  onValueChange={(val) => updateAccount(index, 'nome_banco', val)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map(bank => (
                      <SelectItem key={bank.id} value={bank.name}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo de Conta *</Label>
                <Select 
                  value={account.tipo_conta} 
                  onValueChange={(val) => updateAccount(index, 'tipo_conta', val)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Saldo Atual (R$) *</Label>
                <Input
                  type="number"
                  value={account.saldo_atual}
                  onChange={(e) => updateAccount(index, 'saldo_atual', e.target.value)}
                  placeholder="10000"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <Label>Finalidade</Label>
                <Select 
                  value={account.finalidade} 
                  onValueChange={(val) => updateAccount(index, 'finalidade', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a finalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountPurposes.map(purpose => (
                      <SelectItem key={purpose.value} value={purpose.value}>
                        {purpose.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        ))}

        <Button type="button" variant="outline" onClick={addAccount} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar outra conta
        </Button>

        {totalBalance > 0 && (
          <Card className="p-4 bg-primary/5">
            <p className="text-center font-semibold">
              Saldo Total: <span className="text-primary text-xl">R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </p>
          </Card>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Próximo'}
        </Button>
      </div>
    </form>
  );
}
