import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface PrivacyTabProps {
  user: any;
}

export function PrivacyTab({ user }: PrivacyTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    permitir_coleta_dados: false,
    perfil_publico: false,
    aceita_xapi_logs: false,
    aceita_lgpd: false,
  });

  useEffect(() => {
    const loadPrivacySettings = async () => {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('aceita_lgpd, aceita_xapi_logs')
          .eq('id', user.id)
          .single();

        const { data: prefData } = await supabase
          .from('user_preferences')
          .select('permitir_coleta_dados, perfil_publico')
          .eq('user_id', user.id)
          .single();

        setSettings({
          aceita_lgpd: userData?.aceita_lgpd || false,
          aceita_xapi_logs: userData?.aceita_xapi_logs || false,
          permitir_coleta_dados: prefData?.permitir_coleta_dados || false,
          perfil_publico: prefData?.perfil_publico || false,
        });
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };

    loadPrivacySettings();
  }, [user.id]);

  const handleToggle = async (field: string, value: boolean) => {
    setLoading(true);
    try {
      const newSettings = { ...settings, [field]: value };
      setSettings(newSettings);

      if (field === 'aceita_lgpd' || field === 'aceita_xapi_logs') {
        const { error } = await supabase
          .from('users')
          .update({ [field]: value })
          .eq('id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .update({ [field]: value })
          .eq('user_id', user.id);

        if (error) throw error;
      }

      toast({
        title: 'Configuração atualizada',
        description: 'Suas preferências de privacidade foram salvas',
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
        <h3 className="text-lg font-semibold text-foreground mb-2">Privacidade e Dados</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie como seus dados são coletados e utilizados
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="aceita_lgpd" className="text-base font-medium">
              Aceitar termos LGPD
            </Label>
            <p className="text-sm text-muted-foreground">
              Consentimento para coleta e processamento de dados pessoais
            </p>
          </div>
          <Switch
            id="aceita_lgpd"
            checked={settings.aceita_lgpd}
            onCheckedChange={(checked) => handleToggle('aceita_lgpd', checked)}
            disabled={loading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="aceita_xapi_logs" className="text-base font-medium">
              Logs de atividade (xAPI)
            </Label>
            <p className="text-sm text-muted-foreground">
              Permitir registro de ações para análise de comportamento
            </p>
          </div>
          <Switch
            id="aceita_xapi_logs"
            checked={settings.aceita_xapi_logs}
            onCheckedChange={(checked) => handleToggle('aceita_xapi_logs', checked)}
            disabled={loading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="permitir_coleta_dados" className="text-base font-medium">
              Coleta de dados analíticos
            </Label>
            <p className="text-sm text-muted-foreground">
              Permitir análise de uso para melhorar a experiência
            </p>
          </div>
          <Switch
            id="permitir_coleta_dados"
            checked={settings.permitir_coleta_dados}
            onCheckedChange={(checked) => handleToggle('permitir_coleta_dados', checked)}
            disabled={loading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="perfil_publico" className="text-base font-medium">
              Perfil público
            </Label>
            <p className="text-sm text-muted-foreground">
              Tornar seu perfil visível para outros usuários
            </p>
          </div>
          <Switch
            id="perfil_publico"
            checked={settings.perfil_publico}
            onCheckedChange={(checked) => handleToggle('perfil_publico', checked)}
            disabled={loading}
          />
        </div>
      </Card>
    </div>
  );
}
