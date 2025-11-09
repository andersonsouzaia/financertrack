import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface PreferencesTabProps {
  user: any;
}

export function PreferencesTab({ user }: PreferencesTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    tema: 'light',
    idioma: 'pt-BR',
    tone_ia: 'amigavel',
    estilo_usuario: 'balanceado',
    agressividade_sugestoes: 5,
    frequencia_alertas: 'diaria',
  });

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data: prefData } = await supabase
          .from('user_preferences')
          .select('tema, idioma')
          .eq('user_id', user.id)
          .single();

        const { data: configData } = await supabase
          .from('configuracao_usuario')
          .select('tone_ia, estilo_usuario, agressividade_sugestoes, frequencia_alertas')
          .eq('user_id', user.id)
          .single();

        setPreferences({
          tema: prefData?.tema || 'light',
          idioma: prefData?.idioma || 'pt-BR',
          tone_ia: configData?.tone_ia || 'amigavel',
          estilo_usuario: configData?.estilo_usuario || 'balanceado',
          agressividade_sugestoes: configData?.agressividade_sugestoes || 5,
          frequencia_alertas: configData?.frequencia_alertas || 'diaria',
        });
      } catch (error) {
        console.error('Erro ao carregar preferências:', error);
      }
    };

    loadPreferences();
  }, [user.id]);

  const handleSelectChange = async (field: string, value: string) => {
    setLoading(true);
    try {
      const newPreferences = { ...preferences, [field]: value };
      setPreferences(newPreferences);

      if (field === 'tema' || field === 'idioma') {
        const { error } = await supabase
          .from('user_preferences')
          .update({ [field]: value })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('configuracao_usuario')
          .update({ [field]: value })
          .eq('user_id', user.id);

        if (error) throw error;
      }

      toast({
        title: 'Preferência atualizada',
        description: 'Suas configurações foram salvas',
      });
    } catch (error: any) {
      console.error('Erro ao atualizar:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = async (value: number[]) => {
    const newValue = value[0];
    setPreferences({ ...preferences, agressividade_sugestoes: newValue });
  };

  const handleSliderCommit = async (value: number[]) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('configuracao_usuario')
        .update({ agressividade_sugestoes: value[0] })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Agressividade atualizada',
        description: `Nível definido para ${value[0]}`,
      });
    } catch (error: any) {
      console.error('Erro ao atualizar:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Preferências</h3>
        <p className="text-sm text-muted-foreground">
          Personalize sua experiência no aplicativo
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="tema">Tema</Label>
          <Select
            value={preferences.tema}
            onValueChange={(value) => handleSelectChange('tema', value)}
            disabled={loading}
          >
            <SelectTrigger id="tema">
              <SelectValue placeholder="Selecione o tema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">☀️ Claro</SelectItem>
              <SelectItem value="dark">🌙 Escuro</SelectItem>
              <SelectItem value="auto">🔄 Automático</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="idioma">Idioma</Label>
          <Select
            value={preferences.idioma}
            onValueChange={(value) => handleSelectChange('idioma', value)}
            disabled={loading}
          >
            <SelectTrigger id="idioma">
              <SelectValue placeholder="Selecione o idioma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt-BR">🇧🇷 Português (Brasil)</SelectItem>
              <SelectItem value="en-US">🇺🇸 English (US)</SelectItem>
              <SelectItem value="es-ES">🇪🇸 Español</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tone_ia">Tom da IA</Label>
          <Select
            value={preferences.tone_ia}
            onValueChange={(value) => handleSelectChange('tone_ia', value)}
            disabled={loading}
          >
            <SelectTrigger id="tone_ia">
              <SelectValue placeholder="Selecione o tom" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="amigavel">😊 Amigável</SelectItem>
              <SelectItem value="profissional">💼 Profissional</SelectItem>
              <SelectItem value="direto">🎯 Direto</SelectItem>
              <SelectItem value="motivacional">💪 Motivacional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estilo_usuario">Estilo de Gestão</Label>
          <Select
            value={preferences.estilo_usuario}
            onValueChange={(value) => handleSelectChange('estilo_usuario', value)}
            disabled={loading}
          >
            <SelectTrigger id="estilo_usuario">
              <SelectValue placeholder="Selecione o estilo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conservador">🛡️ Conservador</SelectItem>
              <SelectItem value="balanceado">⚖️ Balanceado</SelectItem>
              <SelectItem value="agressivo">🚀 Agressivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequencia_alertas">Frequência de Alertas</Label>
          <Select
            value={preferences.frequencia_alertas}
            onValueChange={(value) => handleSelectChange('frequencia_alertas', value)}
            disabled={loading}
          >
            <SelectTrigger id="frequencia_alertas">
              <SelectValue placeholder="Selecione a frequência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tempo_real">⚡ Tempo Real</SelectItem>
              <SelectItem value="diaria">📅 Diária</SelectItem>
              <SelectItem value="semanal">📆 Semanal</SelectItem>
              <SelectItem value="mensal">📊 Mensal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="agressividade_sugestoes">Agressividade das Sugestões</Label>
            <span className="text-sm font-medium text-muted-foreground">
              {preferences.agressividade_sugestoes}
            </span>
          </div>
          <Slider
            id="agressividade_sugestoes"
            min={1}
            max={10}
            step={1}
            value={[preferences.agressividade_sugestoes]}
            onValueChange={handleSliderChange}
            onValueCommit={handleSliderCommit}
            disabled={loading}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Suave</span>
            <span>Moderado</span>
            <span>Intenso</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
