import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries, currencies } from '@/data/countries';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function ProfileForm({ onNext, onBack }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: user?.user_metadata?.full_name || '',
    data_nascimento: '',
    pais: 'BR',
    moeda: 'BRL'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          nome_completo: formData.nome_completo,
          data_nascimento: formData.data_nascimento || null,
          pais: formData.pais
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // Update or insert configuracao_usuario
      const { error: configError } = await supabase
        .from('configuracao_usuario')
        .upsert({
          user_id: user.id,
          moeda_principal: formData.moeda,
          renda_mensal: 0 // Will be set in next step
        });

      if (configError) throw configError;

      toast({
        title: "Perfil salvo!",
        description: "Suas informações foram atualizadas"
      });

      onNext();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar perfil",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-heading font-bold">Conte-nos sobre você</h2>
        <p className="text-muted-foreground">
          Essas informações nos ajudam a personalizar sua experiência
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="nome">Nome Completo *</Label>
          <Input
            id="nome"
            value={formData.nome_completo}
            onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
            placeholder="João Silva"
            required
            minLength={3}
          />
        </div>

        <div>
          <Label htmlFor="data_nascimento">Data de Nascimento</Label>
          <Input
            id="data_nascimento"
            type="date"
            value={formData.data_nascimento}
            onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <Label htmlFor="pais">País *</Label>
          <Select value={formData.pais} onValueChange={(val) => setFormData({ ...formData, pais: val })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {countries.map(country => (
                <SelectItem key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="moeda">Moeda Principal *</Label>
          <Select value={formData.moeda} onValueChange={(val) => setFormData({ ...formData, moeda: val })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map(currency => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
