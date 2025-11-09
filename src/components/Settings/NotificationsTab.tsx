import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface NotificationsTabProps {
  user: any;
}

export function NotificationsTab({ user }: NotificationsTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    notificacoes_ativadas: true,
    notificacoes_email: true,
    notificacoes_push: true,
    quer_alertas: true,
    quer_recomendacoes_automaticas: false,
  });

  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const { data: prefData } = await supabase
          .from('user_preferences')
          .select('notificacoes_ativadas, notificacoes_email, notificacoes_push')
          .eq('user_id', user.id)
          .single();

        const { data: configData } = await supabase
          .from('configuracao_usuario')
          .select('quer_alertas, quer_recomendacoes_automaticas')
          .eq('user_id', user.id)
          .single();

        setSettings({
          notificacoes_ativadas: prefData?.notificacoes_ativadas ?? true,
          notificacoes_email: prefData?.notificacoes_email ?? true,
          notificacoes_push: prefData?.notificacoes_push ?? true,
          quer_alertas: configData?.quer_alertas ?? true,
          quer_recomendacoes_automaticas: configData?.quer_recomendacoes_automaticas ?? false,
        });
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };

    loadNotificationSettings();
  }, [user.id]);

  const handleToggle = async (field: string, value: boolean) => {
    setLoading(true);
    try {
      const newSettings = { ...settings, [field]: value };
      setSettings(newSettings);

      if (field === 'quer_alertas' || field === 'quer_recomendacoes_automaticas') {
        const { error } = await supabase
          .from('configuracao_usuario')
          .update({ [field]: value })
          .eq('user_id', user.id);

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
        description: 'Suas preferências de notificação foram salvas',
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
        <h3 className="text-lg font-semibold text-foreground mb-2">Notificações</h3>
        <p className="text-sm text-muted-foreground">
          Escolha como deseja receber atualizações e alertas
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="notificacoes_ativadas" className="text-base font-medium">
              Ativar notificações
            </Label>
            <p className="text-sm text-muted-foreground">
              Controle mestre de todas as notificações
            </p>
          </div>
          <Switch
            id="notificacoes_ativadas"
            checked={settings.notificacoes_ativadas}
            onCheckedChange={(checked) => handleToggle('notificacoes_ativadas', checked)}
            disabled={loading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="notificacoes_email" className="text-base font-medium">
              Notificações por e-mail
            </Label>
            <p className="text-sm text-muted-foreground">
              Receber alertas e resumos por e-mail
            </p>
          </div>
          <Switch
            id="notificacoes_email"
            checked={settings.notificacoes_email}
            onCheckedChange={(checked) => handleToggle('notificacoes_email', checked)}
            disabled={loading || !settings.notificacoes_ativadas}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="notificacoes_push" className="text-base font-medium">
              Notificações push
            </Label>
            <p className="text-sm text-muted-foreground">
              Receber notificações direto no dispositivo
            </p>
          </div>
          <Switch
            id="notificacoes_push"
            checked={settings.notificacoes_push}
            onCheckedChange={(checked) => handleToggle('notificacoes_push', checked)}
            disabled={loading || !settings.notificacoes_ativadas}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="quer_alertas" className="text-base font-medium">
              Alertas financeiros
            </Label>
            <p className="text-sm text-muted-foreground">
              Avisos sobre gastos excessivos e limites
            </p>
          </div>
          <Switch
            id="quer_alertas"
            checked={settings.quer_alertas}
            onCheckedChange={(checked) => handleToggle('quer_alertas', checked)}
            disabled={loading || !settings.notificacoes_ativadas}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="quer_recomendacoes_automaticas" className="text-base font-medium">
              Recomendações da IA
            </Label>
            <p className="text-sm text-muted-foreground">
              Receber sugestões automáticas de economia
            </p>
          </div>
          <Switch
            id="quer_recomendacoes_automaticas"
            checked={settings.quer_recomendacoes_automaticas}
            onCheckedChange={(checked) => handleToggle('quer_recomendacoes_automaticas', checked)}
            disabled={loading || !settings.notificacoes_ativadas}
          />
        </div>
      </Card>
    </div>
  );
}
