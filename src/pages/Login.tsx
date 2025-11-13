import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  // Verificar email pendente de verificação ao carregar a página
  useEffect(() => {
    if (user) {
      // Usuário já logado - verificar onboarding
      const checkOnboarding = async () => {
        const { data: onboardingData } = await supabase
          .from('configuracao_onboarding')
          .select('onboarding_completo')
          .eq('user_id', user.id)
          .maybeSingle();

        if (onboardingData?.onboarding_completo) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }
      };
      checkOnboarding();
    } else {
      // Verificar se há email pendente de verificação no localStorage
      const pendingEmail = localStorage.getItem('signup_email');
      if (pendingEmail) {
        // Redirecionar para página de verificação
        navigate(`/verify-email?email=${encodeURIComponent(pendingEmail)}`, { replace: true });
      }
    }
  }, [user, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);
    
    setLoading(false);

    if (error) {
      // Verificar se o erro é porque o email não está confirmado
      const errorMessage = error.message?.toLowerCase() || '';
      
      if (errorMessage.includes('email') && (errorMessage.includes('not confirmed') || errorMessage.includes('confirm') || errorMessage.includes('verify'))) {
        // Email não confirmado - salvar email e redirecionar para verificação
        localStorage.setItem('signup_email', email);
        navigate(`/verify-email?email=${encodeURIComponent(email)}`, { replace: true });
        return;
      }
      // Outros erros já são tratados pelo toast no signIn
      return;
    }

    // Login bem-sucedido - verificar confirmação de email
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Verificar se email está confirmado
      if (!session.user.email_confirmed_at) {
        // Email não confirmado - redirecionar para verificação
        localStorage.setItem('signup_email', session.user.email || email);
        navigate(`/verify-email?email=${encodeURIComponent(session.user.email || email)}`, { replace: true });
        return;
      }

      // Email confirmado - verificar onboarding
      const { data: onboardingData } = await supabase
        .from('configuracao_onboarding')
        .select('onboarding_completo')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (onboardingData?.onboarding_completo) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    } else {
      navigate("/dashboard");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-card-hover">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Wallet className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-heading">FinanceTrack</CardTitle>
            <CardDescription className="text-base mt-2">
              Entre para gerenciar suas finanças
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Esqueceu?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                ou continue com
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Cadastre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
