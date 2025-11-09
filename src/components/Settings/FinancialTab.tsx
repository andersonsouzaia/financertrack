import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Star, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FinancialTabProps {
  user: any;
}

interface AccountForm {
  id?: string;
  clientId: string;
  nome_banco: string;
  tipo_conta: string;
  saldo_atual: number;
  finalidade: string;
  principal: boolean;
}

const accountTypes = [
  { value: 'corrente', label: 'Conta Corrente' },
  { value: 'poupanca', label: 'Conta Poupança' },
  { value: 'investimento', label: 'Investimento' },
  { value: 'carteira', label: 'Carteira/Dinheiro' },
];

const accountPurposes = [
  { value: 'salario', label: 'Recebimento de salário' },
  { value: 'investimentos', label: 'Investimentos' },
  { value: 'gastos', label: 'Gastos gerais' },
  { value: 'reserva', label: 'Reserva / Poupança' },
  { value: 'outro', label: 'Outro' },
];

export function FinancialTab({ user }: FinancialTabProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);
  const [form, setForm] = useState({
    renda_mensal: 0,
    estilo_usuario: 'balanceado',
    moeda_principal: 'BRL',
    reserva_emergencia_meta: 0,
    reserva_emergencia_atual: 0,
  });
  const [accounts, setAccounts] = useState<AccountForm[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: configData, error: configError } = await supabase
        .from('configuracao_usuario')
        .select('id, renda_mensal, estilo_usuario, moeda_principal, reserva_emergencia_meta, reserva_emergencia_atual')
        .eq('user_id', user.id)
        .maybeSingle();

      if (configError) throw configError;

      if (configData) {
        setHasConfig(true);
        setForm({
          renda_mensal: configData.renda_mensal ?? 0,
          estilo_usuario: configData.estilo_usuario ?? 'balanceado',
          moeda_principal: configData.moeda_principal ?? 'BRL',
          reserva_emergencia_meta: configData.reserva_emergencia_meta ?? 0,
          reserva_emergencia_atual: configData.reserva_emergencia_atual ?? 0,
        });
      } else {
        setHasConfig(false);
        setForm({
          renda_mensal: 0,
          estilo_usuario: 'balanceado',
          moeda_principal: 'BRL',
          reserva_emergencia_meta: 0,
          reserva_emergencia_atual: 0,
        });
      }

      const { data: accountsData, error: accountsError } = await supabase
        .from('bancos_contas')
        .select('id, nome_banco, tipo_conta, saldo_atual, finalidade, principal')
        .eq('user_id', user.id)
        .order('principal', { ascending: false });

      if (accountsError) throw accountsError;

      setAccounts(
        (accountsData || []).map((account) => ({
          id: account.id,
          clientId: account.id,
          nome_banco: account.nome_banco || '',
          tipo_conta: account.tipo_conta || 'corrente',
          saldo_atual: Number(account.saldo_atual || 0),
          finalidade: account.finalidade || 'salario',
          principal: Boolean(account.principal),
        }))
      );
    } catch (error: any) {
      console.error('Erro ao carregar dados financeiros:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const addAccount = () => {
    setAccounts((prev) => [
      ...prev,
      {
        clientId: `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        nome_banco: '',
        tipo_conta: 'corrente',
        saldo_atual: 0,
        finalidade: 'salario',
        principal: prev.length === 0,
      },
    ]);
  };

  const handleAccountChange = (clientId: string, field: keyof AccountForm, value: any) => {
    setAccounts((prev) =>
      prev.map((account) =>
        account.clientId === clientId
          ? {
              ...account,
              [field]:
                field === 'saldo_atual'
                  ? Number(value)
                  : value,
            }
          : account
      )
    );
  };

  const markAsPrincipal = (clientId: string) => {
    setAccounts((prev) =>
      prev.map((account) => ({
        ...account,
        principal: account.clientId === clientId,
      }))
    );
  };

  const handleRemoveAccount = async (account: AccountForm) => {
    if (account.id) {
      const confirmed = window.confirm('Tem certeza que deseja remover esta conta?');
      if (!confirmed) return;
      try {
        const { error } = await supabase
          .from('bancos_contas')
          .delete()
          .eq('id', account.id);
        if (error) throw error;
        toast({
          title: 'Conta removida',
          description: 'A conta foi excluída com sucesso.',
        });
        setAccounts((prev) => prev.filter((item) => item.clientId !== account.clientId));
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Erro ao remover conta',
          description: error.message,
        });
      }
    } else {
      setAccounts((prev) => prev.filter((item) => item.clientId !== account.clientId));
    }
  };

  const handleSave = async () => {
    if (!form.renda_mensal || form.renda_mensal <= 0) {
      toast({
        variant: 'destructive',
        title: 'Renda inválida',
        description: 'Informe uma renda mensal maior que zero.',
      });
      return;
    }

    if (accounts.length > 0 && !accounts.some((account) => account.principal)) {
      toast({
        variant: 'destructive',
        title: 'Selecione uma conta principal',
        description: 'Defina qual conta será utilizada como principal.',
      });
      return;
    }

    const invalidAccount = accounts.find(
      (account) => !account.nome_banco.trim() || !account.tipo_conta
    );
    if (invalidAccount) {
      toast({
        variant: 'destructive',
        title: 'Complete as informações das contas',
        description: 'Preencha nome e tipo para todas as contas cadastradas.',
      });
      return;
    }

    setSaving(true);
    try {
      if (hasConfig) {
        const { error: updateError } = await supabase
          .from('configuracao_usuario')
          .update({
            renda_mensal: form.renda_mensal,
            estilo_usuario: form.estilo_usuario,
            moeda_principal: form.moeda_principal,
            reserva_emergencia_meta: form.reserva_emergencia_meta,
            reserva_emergencia_atual: form.reserva_emergencia_atual,
          })
          .eq('user_id', user.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('configuracao_usuario')
          .insert({
            user_id: user.id,
            renda_mensal: form.renda_mensal,
            estilo_usuario: form.estilo_usuario,
            moeda_principal: form.moeda_principal,
            reserva_emergencia_meta: form.reserva_emergencia_meta,
            reserva_emergencia_atual: form.reserva_emergencia_atual,
          });
        if (insertError) throw insertError;
      }

      for (const account of accounts) {
        const payload = {
          nome_banco: account.nome_banco,
          tipo_conta: account.tipo_conta,
          saldo_atual: Number(account.saldo_atual) || 0,
          finalidade: account.finalidade,
          principal: account.principal,
        };

        if (account.id) {
          const { error } = await supabase
            .from('bancos_contas')
            .update(payload)
            .eq('id', account.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('bancos_contas')
            .insert({
              user_id: user.id,
              ...payload,
            });
          if (error) throw error;
        }
      }

      toast({
        title: 'Configurações atualizadas!',
        description: 'Suas preferências financeiras foram salvas.',
      });
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar dados financeiros:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const totalContas = useMemo(
    () => accounts.reduce((sum, account) => sum + Number(account.saldo_atual || 0), 0),
    [accounts]
  );

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando dados financeiros...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="renda_mensal">Renda Mensal (principal)</Label>
          <Input
            id="renda_mensal"
            type="number"
            min={0}
            step="0.01"
            value={form.renda_mensal}
            onChange={(e) => setForm((prev) => ({ ...prev, renda_mensal: Number(e.target.value) }))}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Estilo de controle financeiro</Label>
            <Select
              value={form.estilo_usuario}
              onValueChange={(value) => setForm((prev) => ({ ...prev, estilo_usuario: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="controlador">Controlador (alertas constantes)</SelectItem>
                <SelectItem value="balanceado">Balanceado (recomendações leves)</SelectItem>
                <SelectItem value="organizador">Organizador (apenas organização)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Moeda principal</Label>
            <Select
              value={form.moeda_principal}
              onValueChange={(value) => setForm((prev) => ({ ...prev, moeda_principal: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">BRL - Real Brasileiro</SelectItem>
                <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - Libra Esterlina</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="reserva_meta">Meta da reserva de emergência (R$)</Label>
            <Input
              id="reserva_meta"
              type="number"
              min={0}
              step="0.01"
              value={form.reserva_emergencia_meta}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  reserva_emergencia_meta: Number(e.target.value),
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="reserva_atual">Quanto você já possui (R$)</Label>
            <Input
              id="reserva_atual"
              type="number"
              min={0}
              step="0.01"
              value={form.reserva_emergencia_atual}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  reserva_emergencia_atual: Number(e.target.value),
                }))
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-foreground">Importar extratos posteriormente</p>
            <p className="text-muted-foreground">
              Você pode enviar novos extratos a qualquer momento e o sistema fará a categorização automática.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/import-statement')}>
            <Upload className="h-4 w-4" />
            Importar extrato
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Contas bancárias</h3>
            <p className="text-xs text-muted-foreground">
              Saldo total nas contas:{" "}
              <span className="font-semibold text-foreground">
                {`R$ ${totalContas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </span>
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addAccount}>
            Adicionar conta
          </Button>
        </div>

        {accounts.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            Nenhuma conta cadastrada. Adicione ao menos uma conta para acompanhar saldos.
          </p>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div
                key={account.clientId}
                className="rounded-lg border border-border bg-muted/40 p-4 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Star
                      className={`h-4 w-4 ${account.principal ? 'text-yellow-500' : 'text-muted-foreground'}`}
                    />
                    {account.nome_banco || 'Nova conta'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={account.principal ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => markAsPrincipal(account.clientId)}
                    >
                      {account.principal ? 'Conta principal' : 'Definir como principal'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAccount(account)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome / Banco</Label>
                    <Input
                      value={account.nome_banco}
                      onChange={(e) =>
                        handleAccountChange(account.clientId, 'nome_banco', e.target.value)
                      }
                      placeholder="Ex: Nubank, Santander..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de conta</Label>
                    <Select
                      value={account.tipo_conta}
                      onValueChange={(value) =>
                        handleAccountChange(account.clientId, 'tipo_conta', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {accountTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Saldo atual</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={account.saldo_atual}
                      onChange={(e) =>
                        handleAccountChange(account.clientId, 'saldo_atual', e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Finalidade</Label>
                    <Select
                      value={account.finalidade}
                      onValueChange={(value) =>
                        handleAccountChange(account.clientId, 'finalidade', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {accountPurposes.map((purpose) => (
                          <SelectItem key={purpose.value} value={purpose.value}>
                            {purpose.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar alterações'}
      </Button>
    </div>
  );
}

