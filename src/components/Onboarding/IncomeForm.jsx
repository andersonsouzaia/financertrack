import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function IncomeForm({ onNext, onBack }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    renda_mensal: '',
    tipo_profissao: 'empregado',
    eh_freelancer: 'nao',
    renda_minima: '',
    renda_maxima: '',
    renda_compartilhada: 'nao',
    renda_total: '',
    sua_parte: ''
  });

  const dailyRecommended = formData.renda_mensal ? ((formData.renda_mensal * 0.4) / 30).toFixed(2) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isFreelancer = formData.eh_freelancer === 'sim';
      const isShared = formData.renda_compartilhada !== 'nao';

      // Update configuracao_usuario
      const { error: configError } = await supabase
        .from('configuracao_usuario')
        .update({
          renda_mensal: Number(formData.renda_mensal),
          tipo_profissao: formData.tipo_profissao,
          eh_freelancer: isFreelancer,
          renda_minima_freelancer: isFreelancer ? Number(formData.renda_minima) : null,
          renda_maxima_freelancer: isFreelancer ? Number(formData.renda_maxima) : null,
          gasto_diario_recomendado: Number(dailyRecommended)
        })
        .eq('user_id', user.id);

      if (configError) throw configError;

      // Update configuracao_saldo_usuario
      const { error: saldoError } = await supabase
        .from('configuracao_saldo_usuario')
        .upsert({
          user_id: user.id,
          renda_mensal: Number(formData.renda_mensal)
        });

      if (saldoError) throw saldoError;

      // If shared income, create grupo
      if (isShared) {
        const { data: grupo, error: grupoError } = await supabase
          .from('renda_compartilhada')
          .insert({
            criado_por: user.id,
            tipo: formData.renda_compartilhada,
            renda_total: Number(formData.renda_total)
          })
          .select()
          .single();

        if (grupoError) throw grupoError;

        // Add user as member
        await supabase
          .from('renda_compartilhada_membros')
          .insert({
            renda_compartilhada_id: grupo.id,
            user_id: user.id,
            valor_renda: Number(formData.sua_parte),
            confirmado: true
          });
      }

      // Create current month
      const today = new Date();
      await supabase
        .from('meses_financeiros')
        .insert({
          user_id: user.id,
          mes: today.getMonth() + 1,
          ano: today.getFullYear(),
          status: 'aberto'
        });

      toast({
        title: "Renda configurada!",
        description: `Gasto recomendado: R$${dailyRecommended}/dia`
      });

      onNext();
    } catch (error) {
      console.error('Error saving income:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar renda",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-heading font-bold">Qual é sua renda mensal?</h2>
        <p className="text-muted-foreground">
          Vamos calcular seu orçamento recomendado
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="renda">Renda Mensal (R$) *</Label>
          <Input
            id="renda"
            type="number"
            value={formData.renda_mensal}
            onChange={(e) => setFormData({ ...formData, renda_mensal: e.target.value })}
            placeholder="5000"
            required
            min="0"
            step="0.01"
          />
          {formData.renda_mensal && (
            <p className="text-sm text-success mt-1">
              💡 Recomendado gastar ~R${dailyRecommended}/dia
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="tipo">Tipo de Profissão *</Label>
          <Select value={formData.tipo_profissao} onValueChange={(val) => setFormData({ ...formData, tipo_profissao: val })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="empregado">Empregado (CLT)</SelectItem>
              <SelectItem value="autonomo">Autônomo</SelectItem>
              <SelectItem value="freelancer">Freelancer</SelectItem>
              <SelectItem value="empresario">Empresário</SelectItem>
              <SelectItem value="aposentado">Aposentado</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>É freelancer/autônomo?</Label>
          <RadioGroup value={formData.eh_freelancer} onValueChange={(val) => setFormData({ ...formData, eh_freelancer: val })}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id="nao-free" />
              <Label htmlFor="nao-free">Não</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id="sim-free" />
              <Label htmlFor="sim-free">Sim</Label>
            </div>
          </RadioGroup>
        </div>

        {formData.eh_freelancer === 'sim' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min">Renda Mínima (R$)</Label>
              <Input
                id="min"
                type="number"
                value={formData.renda_minima}
                onChange={(e) => setFormData({ ...formData, renda_minima: e.target.value })}
                placeholder="3000"
              />
            </div>
            <div>
              <Label htmlFor="max">Renda Máxima (R$)</Label>
              <Input
                id="max"
                type="number"
                value={formData.renda_maxima}
                onChange={(e) => setFormData({ ...formData, renda_maxima: e.target.value })}
                placeholder="8000"
              />
            </div>
          </div>
        )}

        <div>
          <Label>Sua renda é compartilhada?</Label>
          <RadioGroup value={formData.renda_compartilhada} onValueChange={(val) => setFormData({ ...formData, renda_compartilhada: val })}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id="nao-shared" />
              <Label htmlFor="nao-shared">Apenas minha</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="casal" id="casal" />
              <Label htmlFor="casal">Casal</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="familia" id="familia" />
              <Label htmlFor="familia">Família/Outros</Label>
            </div>
          </RadioGroup>
        </div>

        {formData.renda_compartilhada !== 'nao' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total">Renda Total (R$) *</Label>
              <Input
                id="total"
                type="number"
                value={formData.renda_total}
                onChange={(e) => setFormData({ ...formData, renda_total: e.target.value })}
                placeholder="10000"
                required
              />
            </div>
            <div>
              <Label htmlFor="parte">Sua Parte (R$) *</Label>
              <Input
                id="parte"
                type="number"
                value={formData.sua_parte}
                onChange={(e) => setFormData({ ...formData, sua_parte: e.target.value })}
                placeholder="5000"
                required
              />
            </div>
          </div>
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
