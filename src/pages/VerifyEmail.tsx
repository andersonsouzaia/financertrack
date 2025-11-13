import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";

export default function VerifyEmail() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Pegar email da URL ou do localStorage
    const emailFromUrl = searchParams.get('email');
    const emailFromStorage = localStorage.getItem('signup_email');
    
    if (emailFromUrl) {
      setEmail(emailFromUrl);
      localStorage.setItem('signup_email', emailFromUrl);
      setCountdown(60); // Iniciar contador de 60 segundos
    } else if (emailFromStorage) {
      setEmail(emailFromStorage);
    } else {
      // Se não tiver email, redirecionar para signup
      navigate('/signup');
    }
  }, [searchParams, navigate]);

  // Contador regressivo para reenvio
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-verificar quando OTP completo
  useEffect(() => {
    if (otp.length === 8 && !loading && !verified) {  // Mudou de 6 para 8
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  // Focar no input ao carregar (o InputOTP já faz isso automaticamente)

  const handleVerify = async () => {
    if (!otp || otp.length !== 8) {
      return;
    }

    if (!email) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Email não encontrado. Por favor, faça o cadastro novamente.",
      });
      navigate('/signup');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) {
        // Tratamento específico de erros de verificação
        const errorMessage = error.message || '';
        
        if (errorMessage.toLowerCase().includes('expired') || errorMessage.toLowerCase().includes('expirado')) {
          toast({
            variant: "destructive",
            title: "Código expirado",
            description: "Este código expirou. Solicite um novo código.",
          });
        } else if (errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('inválido')) {
          toast({
            variant: "destructive",
            title: "Código inválido",
            description: "O código informado está incorreto. Verifique e tente novamente.",
          });
        } else if (errorMessage.toLowerCase().includes('already') || errorMessage.toLowerCase().includes('já')) {
          toast({
            variant: "destructive",
            title: "Código já usado",
            description: "Este código já foi utilizado. Solicite um novo código.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erro ao verificar",
            description: errorMessage || "O código informado está incorreto ou expirado.",
          });
        }
        
        setOtp(""); // Limpar OTP para tentar novamente
        setLoading(false);
        return;
      }

      if (data.session && data.user) {
        setVerified(true);
        
        // Limpar email do localStorage
        localStorage.removeItem('signup_email');
        
        toast({
          title: "Email confirmado! ✅",
          description: "Redirecionando para configuração inicial...",
        });

        // Aguardar um momento para mostrar feedback
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verificar se onboarding foi completado
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('configuracao_onboarding')
          .select('onboarding_completo')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (onboardingError) {
          console.error('Erro ao verificar onboarding:', onboardingError);
          // Continuar mesmo com erro - pode ser primeiro acesso
        }

        if (onboardingData?.onboarding_completo) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      } else {
        // Caso raro: código válido mas sem sessão
        toast({
          variant: "destructive",
          title: "Erro inesperado",
          description: "Código válido, mas não foi possível criar a sessão. Tente fazer login.",
        });
        setLoading(false);
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error: any) {
      console.error('Erro ao verificar OTP:', error);
      
      const errorMessage = error?.message || '';
      
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        toast({
          variant: "destructive",
          title: "Erro de conexão",
          description: "Verifique sua conexão com a internet e tente novamente.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro inesperado",
          description: "Ocorreu um erro ao verificar o código. Tente novamente.",
        });
      }
      
      setOtp("");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || countdown > 0 || resending) return;

    setResending(true);
    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        // Tratamento específico para diferentes tipos de erro
        const errorStatus = error.status || (error as any)?.statusCode;
        const errorMessage = error.message || '';

        if (errorStatus === 429 || errorMessage.includes('429') || errorMessage.toLowerCase().includes('too many requests')) {
          // Rate limiting - aguardar mais tempo
          toast({
            variant: "destructive",
            title: "Muitas tentativas",
            description: "Você solicitou muitos códigos. Aguarde 5 minutos antes de tentar novamente.",
          });
          setCountdown(300); // 5 minutos de espera
        } else if (errorStatus === 403 || errorMessage.includes('403') || errorMessage.toLowerCase().includes('forbidden')) {
          // Erro de permissão - pode ser email já confirmado ou problema de configuração
          toast({
            variant: "destructive",
            title: "Não foi possível reenviar",
            description: "Este email pode já estar confirmado ou há um problema de configuração. Tente fazer login ou criar uma nova conta.",
          });
          setCountdown(120); // 2 minutos
        } else if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('not found')) {
          // Email não encontrado
          toast({
            variant: "destructive",
            title: "Email não encontrado",
            description: "Este email não está cadastrado. Por favor, faça um novo cadastro.",
          });
          setTimeout(() => navigate('/signup'), 2000);
        } else {
          // Outros erros
          toast({
            variant: "destructive",
            title: "Erro ao reenviar",
            description: errorMessage || "Não foi possível reenviar o código. Tente novamente em alguns instantes.",
          });
          setCountdown(120); // 2 minutos de espera
        }
      } else {
        // Sucesso
        toast({
          title: "Código reenviado! ✅",
          description: "Verifique sua caixa de entrada (e spam) para o novo código.",
        });
        setCountdown(120); // 2 minutos antes de poder reenviar novamente
        setOtp(""); // Limpar OTP atual
      }
    } catch (error: any) {
      console.error('Erro ao reenviar código:', error);
      
      // Tratamento de erro de rede ou outros erros inesperados
      const errorStatus = error?.status || error?.statusCode;
      const errorMessage = error?.message || '';

      if (errorStatus === 429 || errorMessage.includes('429')) {
        toast({
          variant: "destructive",
          title: "Muitas tentativas",
          description: "Aguarde 5 minutos antes de solicitar um novo código.",
        });
        setCountdown(300); // 5 minutos
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        toast({
          variant: "destructive",
          title: "Erro de conexão",
          description: "Verifique sua conexão com a internet e tente novamente.",
        });
        setCountdown(60); // 1 minuto
      } else {
        toast({
          variant: "destructive",
          title: "Erro inesperado",
          description: "Ocorreu um erro ao reenviar o código. Tente novamente mais tarde.",
        });
        setCountdown(120); // 2 minutos
      }
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md shadow-card-hover">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Email confirmado!</h2>
              <p className="text-muted-foreground mt-2">Redirecionando...</p>
            </div>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-card-hover">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-heading">Verificar Email</CardTitle>
            <CardDescription className="text-base mt-2">
              Digite o código de 8 dígitos enviado para  {/* Mudou de 6 para 8 */}
            </CardDescription>
            {email && (
              <p className="text-sm font-medium text-foreground mt-1 break-all">{email}</p>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={8}  // Mudou de 6 para 8
              value={otp}
              onChange={setOtp}
              disabled={loading}
              autoFocus
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
                <InputOTPSlot index={6} />  {/* Adicionar */}
                <InputOTPSlot index={7} />  {/* Adicionar */}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verificando código...</span>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleVerify}
              className="w-full"
              disabled={loading || otp.length !== 8}  // Mudou de 6 para 8
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar"
              )}
            </Button>

             <div className="text-center space-y-2">
               <Button
                 variant="link"
                 onClick={handleResend}
                 disabled={resending || countdown > 0}
                 className="text-sm"
               >
                 {resending ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin inline" />
                    Reenviando...
                  </>
                 ) : countdown > 0 ? (
                   countdown >= 60 ? (
                     `Aguarde ${Math.floor(countdown / 60)}min ${countdown % 60}s`
                   ) : (
                     `Reenviar código em ${countdown}s`
                   )
                 ) : (
                   "Não recebeu o código? Reenviar"
                 )}
               </Button>
               
               <div className="text-xs text-muted-foreground space-y-1">
                 <p>💡 Dicas:</p>
                 <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                   <li>Verifique a pasta de spam/lixo eletrônico</li>
                   <li>O código expira em 1 hora</li>
                   <li>Aguarde o tempo indicado antes de reenviar</li>
                 </ul>
               </div>
             </div>
          </div>

          <div className="pt-4 border-t">
            <Link to="/login" className="text-sm text-primary hover:underline text-center block">
              Voltar para login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

