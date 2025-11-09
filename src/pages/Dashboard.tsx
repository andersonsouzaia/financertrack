import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, Calendar, Settings, LogOut } from "lucide-react";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-heading font-bold">FinanceTrack</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Olá, {user.email?.split('@')[0]}!
              </span>
              <Button variant="outline" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Saldo Card */}
          <Card className="shadow-card-hover border-l-4 border-l-balance-excellent">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-heading font-bold text-balance-excellent">
                  R$ 10.000,00
                </p>
                <p className="text-sm text-muted-foreground">
                  Renda: R$ 5.000/mês
                </p>
                <p className="text-xs text-balance-excellent">
                  ✓ Status: Ótimo (2x renda)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Gastos do Mês */}
          <Card className="shadow-card-hover">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Gastos do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-heading font-bold">
                  R$ 1.234,56
                </p>
                <p className="text-sm text-muted-foreground">
                  24.7% da renda mensal
                </p>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '24.7%' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Próximos Eventos */}
          <Card className="shadow-card-hover">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Dezembro 2025
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  Status: Aberto
                </p>
                <p className="text-sm text-muted-foreground">
                  23 dias restantes
                </p>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Fechar Mês
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message */}
        <Card className="mt-6 shadow-card">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-heading font-bold">
                Bem-vindo ao FinanceTrack! 🎉
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Seu dashboard está quase pronto. Complete o onboarding para configurar suas preferências
                e começar a gerenciar suas finanças de forma inteligente.
              </p>
              <Button size="lg" onClick={() => navigate("/onboarding")}>
                Completar Configuração
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
