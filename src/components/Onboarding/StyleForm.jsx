import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const styles = [
  {
    id: 'controlador',
    icon: '🎯',
    title: 'CONTROLADOR',
    description: 'Quero metas firmes e alertas. Ajude-me a economizar!',
    features: [
      'Alertas imediatos',
      'Sugestões automáticas',
      'Limites rigorosos',
      'Relatórios detalhados'
    ],
    config: {
      quer_alertas: true,
      tone_ia: 'direto',
      agressividade_sugestoes: 8,
      frequencia_alertas: 'imediata'
    }
  },
  {
    id: 'balanceado',
    icon: '⚖️',
    title: 'BALANCEADO',
    description: 'Metas flexíveis com dicas amigáveis',
    badge: 'Recomendado',
    features: [
      'Dicas educacionais',
      'Alertas moderados',
      'Flexibilidade nas metas',
      'Sugestões não-agressivas'
    ],
    config: {
      quer_alertas: true,
      tone_ia: 'amigavel',
      agressividade_sugestoes: 5,
      frequencia_alertas: 'diaria'
    }
  },
  {
    id: 'organizador',
    icon: '📊',
    title: 'ORGANIZADOR',
    description: 'Quero apenas organizar e visualizar. Sem pressão de metas!',
    features: [
      'Sem alertas obrigatórios',
      'Apenas informação',
      'Flexibilidade total',
      'Sem recomendações agressivas'
    ],
    config: {
      quer_alertas: false,
      tone_ia: 'neutro',
      agressividade_sugestoes: 2,
      frequencia_alertas: 'semanal'
    }
  }
];

export function StyleForm({ onNext, onBack }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('balanceado');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const style = styles.find(s => s.id === selectedStyle);

      const { error } = await supabase
        .from('configuracao_usuario')
        .update({
          estilo_usuario: selectedStyle,
          ...style.config
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Estilo configurado!",
        description: `Você escolheu: ${style.title}`
      });

      onNext();
    } catch (error) {
      console.error('Error saving style:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar estilo",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-heading font-bold">Qual é seu estilo?</h2>
        <p className="text-muted-foreground">
          Escolha como deseja usar o FinanceTrack
        </p>
      </div>

      <RadioGroup value={selectedStyle} onValueChange={setSelectedStyle}>
        <div className="space-y-4">
          {styles.map(style => (
            <Card
              key={style.id}
              className={`p-6 cursor-pointer transition-all ${
                selectedStyle === style.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-muted-foreground'
              }`}
              onClick={() => setSelectedStyle(style.id)}
            >
              <div className="flex items-start space-x-4">
                <RadioGroupItem value={style.id} id={style.id} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{style.icon}</span>
                    <Label htmlFor={style.id} className="text-lg font-bold cursor-pointer">
                      {style.title}
                    </Label>
                    {style.badge && (
                      <span className="text-xs px-2 py-1 rounded-full bg-primary text-primary-foreground">
                        {style.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-3">{style.description}</p>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Incluí:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {style.features.map((feature, idx) => (
                        <li key={idx}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </RadioGroup>

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
