import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any; email?: string }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Tratar refresh token inválido
        if (event === 'TOKEN_REFRESHED' && !session) {
          // Token inválido, fazer logout silencioso
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        // Tratar erros de refresh token durante eventos de auth
        if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // Ignorar erros de refresh token inválido silenciosamente
      if (error) {
        const errorMessage = error.message || '';
        if (
          errorMessage.includes('Refresh Token') ||
          errorMessage.includes('refresh_token') ||
          errorMessage.includes('Invalid Refresh Token') ||
          error?.code === 'invalid_refresh_token'
        ) {
          // Limpar sessão inválida silenciosamente
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      // Capturar qualquer erro não tratado relacionado a refresh token
      const errorMessage = error?.message || '';
      if (
        errorMessage.includes('Refresh Token') ||
        errorMessage.includes('refresh_token') ||
        errorMessage.includes('Invalid Refresh Token')
      ) {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      // Para outros erros, apenas definir loading como false
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string): Promise<{ error: any; email?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no cadastro",
          description: error.message,
        });
        return { error };
      }

      if (!data.user) {
        toast({
          variant: "destructive",
          title: "Erro no cadastro",
          description: "Não foi possível criar o usuário.",
        });
        return { error: new Error("Usuário não criado") };
      }

      // Aguardar um momento para o trigger criar o registro em public.users
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Salvar email no localStorage para usar na verificação
      localStorage.setItem('signup_email', email);

      // Não mostrar toast aqui - será mostrado na página de verificação
      return { error: null, email };
    } catch (error: any) {
      console.error('❌ Erro no signUp:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: error.message,
        });
        return { error };
      }

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta.",
      });

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: error.message,
        });
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
  };

  // Garantir que sempre temos um valor válido para o contexto
  const contextValue: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Em vez de lançar erro imediatamente, retornar valores padrão durante desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.warn("useAuth must be used within an AuthProvider. Returning default values.");
      return {
        user: null,
        session: null,
        loading: true,
        signUp: async () => ({ error: new Error("AuthProvider not available") }),
        signIn: async () => ({ error: new Error("AuthProvider not available") }),
        signInWithGoogle: async () => ({ error: new Error("AuthProvider not available") }),
        signOut: async () => { },
      };
    }
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
