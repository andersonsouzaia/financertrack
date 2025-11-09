import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { X, ArrowLeft } from 'lucide-react';

export default function AddTransaction() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    tipo: 'diario',
    categoria_id: '',
    banco_conta_id: '',
    descricao: '',
    valor_original: 0,
    dia: new Date().getDate(),
    observacao: '',
    contexto: 'social',
    sentimento: 'neutro'
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const { data: cats } = await supabase
        .from('categorias_saidas')
        .select('id, nome, icone')
        .eq('user_id', user.id);

      setCategorias(cats || []);

      const { data: accs } = await supabase
        .from('bancos_contas')
        .select('id, nome_banco, saldo_atual')
        .eq('user_id', user.id);

      setContas(accs || []);

      if (cats && cats.length > 0) {
        setFormData(prev => ({ ...prev, categoria_id: cats[0].id }));
      }
      if (accs && accs.length > 0) {
        setFormData(prev => ({ ...prev, banco_conta_id: accs[0].id }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const hoje = new Date();
      const mes = hoje.getMonth() + 1;
      const ano = hoje.getFullYear();

      const { data: mesData, error: mesError } = await supabase
        .from('meses_financeiros')
        .select('id')
        .eq('user_id', user?.id)
        .eq('mes', mes)
        .eq('ano', ano)
        .maybeSingle();

      if (mesError || !mesData) throw new Error('Mês não encontrado');

      const { data: trans, error: transError } = await supabase
        .from('transacoes')
        .insert({
          user_id: user?.id,
          mes_financeiro_id: mesData.id,
          categoria_id: formData.categoria_id,
          banco_conta_id: formData.banco_conta_id,
          tipo: formData.tipo,
          descricao: formData.descricao,
          valor_original: parseFloat(formData.valor_original.toString()),
          moeda_original: 'BRL',
          dia: parseInt(formData.dia.toString())
        })
        .select()
        .single();

      if (transError) throw transError;

      if (formData.observacao) {
        await supabase
          .from('observacoes_gastos')
          .insert({
            transacao_id: trans.id,
            observacao: formData.observacao,
            contexto: formData.contexto,
            sentimento: formData.sentimento
          });
      }

      const { data: contaAtual } = await supabase
        .from('bancos_contas')
        .select('saldo_atual')
        .eq('id', formData.banco_conta_id)
        .single();

      if (contaAtual) {
        const novoSaldo = contaAtual.saldo_atual - (
          formData.tipo === 'entrada' ? -parseFloat(formData.valor_original.toString()) : parseFloat(formData.valor_original.toString())
        );

        await supabase
          .from('bancos_contas')
          .update({ saldo_atual: novoSaldo })
          .eq('id', formData.banco_conta_id);
      }

      toast({
        title: "Transação adicionada!",
        description: `R$ ${parseFloat(formData.valor_original.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} registrado`,
      });

      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error: any) {
      console.error('Erro ao adicionar transação:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-foreground" />
            </button>
            <h1 className="text-3xl font-bold text-foreground">
              Adicionar Transação
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-lg shadow-md p-6 space-y-6">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tipo de Transação *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'entrada', label: 'Entrada 🟢' },
                { value: 'saida_fixa', label: 'Saída Fixa 🔴' },
                { value: 'diario', label: 'Diário 🔵' }
              ].map(t => (
                <label key={t.value} className="relative">
                  <input
                    type="radio"
                    name="tipo"
                    value={t.value}
                    checked={formData.tipo === t.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                    className="hidden"
                  />
                  <div className={`p-3 border-2 rounded-lg cursor-pointer text-center font-medium transition-colors ${
                    formData.tipo === t.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}>
                    {t.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Descrição *
            </label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              required
              placeholder="Ex: Compras no supermercado"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {/* Valor */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Valor (R$) *
            </label>
            <input
              type="number"
              value={formData.valor_original}
              onChange={(e) => setFormData(prev => ({ ...prev, valor_original: parseFloat(e.target.value) || 0 }))}
              required
              min={0}
              step={0.01}
              placeholder="0,00"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Categoria *
            </label>
            <select
              value={formData.categoria_id}
              onChange={(e) => setFormData(prev => ({ ...prev, categoria_id: e.target.value }))}
              required
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
            >
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icone} {cat.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Conta */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Conta *
            </label>
            <select
              value={formData.banco_conta_id}
              onChange={(e) => setFormData(prev => ({ ...prev, banco_conta_id: e.target.value }))}
              required
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
            >
              {contas.map(conta => (
                <option key={conta.id} value={conta.id}>
                  {conta.nome_banco} - R$ {conta.saldo_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </option>
              ))}
            </select>
          </div>

          {/* Dia */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Dia do Mês
            </label>
            <input
              type="number"
              value={formData.dia}
              onChange={(e) => setFormData(prev => ({ ...prev, dia: parseInt(e.target.value) }))}
              min={1}
              max={31}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {/* Observação */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Observação (opcional)
            </label>
            <textarea
              value={formData.observacao}
              onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
              placeholder="Adicione detalhes sobre este gasto..."
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {/* Contexto e Sentimento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Contexto
              </label>
              <select
                value={formData.contexto}
                onChange={(e) => setFormData(prev => ({ ...prev, contexto: e.target.value }))}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="social">Social</option>
                <option value="necessidade">Necessidade</option>
                <option value="impulsivo">Impulsivo</option>
                <option value="stress">Stress</option>
                <option value="celebracao">Celebração</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sentimento
              </label>
              <select
                value={formData.sentimento}
                onChange={(e) => setFormData(prev => ({ ...prev, sentimento: e.target.value }))}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="feliz">Feliz 😊</option>
                <option value="neutro">Neutro 😐</option>
                <option value="stress">Stress 😰</option>
                <option value="culpa">Culpa 😔</option>
                <option value="satisfeito">Satisfeito 😌</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 px-4 py-3 border border-border rounded-lg text-foreground hover:bg-muted font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium transition-colors"
            >
              {loading ? 'Adicionando...' : 'Adicionar Transação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
