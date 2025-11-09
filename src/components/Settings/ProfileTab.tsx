import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProfileTabProps {
  user: any;
}

export function ProfileTab({ user }: ProfileTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: '',
    data_nascimento: '',
    pais: '',
    moeda_principal: 'BRL'
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('nome_completo, data_nascimento, pais')
          .eq('id', user.id)
          .maybeSingle();

        const { data: config } = await supabase
          .from('configuracao_usuario')
          .select('moeda_principal')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setFormData(prev => ({
            ...prev,
            nome_completo: data.nome_completo || '',
            data_nascimento: data.data_nascimento || '',
            pais: data.pais || '',
            moeda_principal: config?.moeda_principal || 'BRL'
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    loadUserData();
  }, [user.id]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error: userError } = await supabase
        .from('users')
        .update({
          nome_completo: formData.nome_completo,
          data_nascimento: formData.data_nascimento,
          pais: formData.pais
        })
        .eq('id', user.id);

      const { error: configError } = await supabase
        .from('configuracao_usuario')
        .update({ moeda_principal: formData.moeda_principal })
        .eq('user_id', user.id);

      if (userError || configError) throw new Error('Erro ao atualizar');

      toast({
        title: "Perfil atualizado!",
        description: "Suas alterações foram salvas",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="nome_completo">Nome Completo</Label>
        <Input
          id="nome_completo"
          type="text"
          value={formData.nome_completo}
          onChange={(e) => setFormData(prev => ({ ...prev, nome_completo: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="data_nascimento">Data de Nascimento</Label>
        <Input
          id="data_nascimento"
          type="date"
          value={formData.data_nascimento || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="pais">País</Label>
        <Input
          id="pais"
          type="text"
          value={formData.pais}
          onChange={(e) => setFormData(prev => ({ ...prev, pais: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="moeda_principal">Moeda Principal</Label>
        <Select
          value={formData.moeda_principal}
          onValueChange={(value) => setFormData(prev => ({ ...prev, moeda_principal: value }))}
        >
          <SelectTrigger id="moeda_principal">
            <SelectValue placeholder="Selecione a moeda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BRL">BRL - Real Brasileiro</SelectItem>
            <SelectItem value="USD">USD - Dólar Americano</SelectItem>
            <SelectItem value="EUR">EUR - Euro</SelectItem>
            <SelectItem value="GBP">GBP - Libra Esterlina</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleSave}
        disabled={loading}
        className="w-full mt-6"
      >
        {loading ? 'Salvando...' : 'Salvar Alterações'}
      </Button>
    </div>
  );
}
