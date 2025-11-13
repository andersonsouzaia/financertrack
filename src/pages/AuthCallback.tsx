import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // O Supabase automaticamente processa o hash da URL e cria a sessão
        // Precisamos apenas verificar se há uma sessão válida
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Erro ao obter sessão:', sessionError);
          throw sessionError;
        }

        if (!session?.user) {
          console.error('❌ Nenhuma sessão encontrada após callback');
          setError('Não foi possível confirmar seu email. Por favor, tente fazer login novamente.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        console.log('✅ Email confirmado, sessão criada para:', session.user.email);

        // Aguardar um momento para garantir que o contexto atualize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar se o onboarding foi completado
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('configuracao_onboarding')
          .select('onboarding_completo')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (onboardingError) {
          console.error('❌ Erro ao verificar onboarding:', onboardingError);
          // Continuar mesmo com erro - pode ser primeiro acesso
        }

        if (onboardingData?.onboarding_completo) {
          console.log('✅ Onboarding já completado, redirecionando para dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          console.log('📋 Primeiro acesso - redirecionando para onboarding');
          navigate('/onboarding', { replace: true });
        }
      } catch (err: any) {
        console.error('❌ Erro no callback:', err);
        setError(err.message || 'Erro ao processar confirmação de email');
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Confirmando email...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-destructive font-semibold">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  return null;
}

