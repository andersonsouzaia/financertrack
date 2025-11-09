import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Wallet, ArrowRight, Sparkles } from "lucide-react";
import { ProfileForm } from "@/components/Onboarding/ProfileForm";
import { IncomeForm } from "@/components/Onboarding/IncomeForm";
import { BanksForm } from "@/components/Onboarding/BanksForm";
import { CategoriesForm } from "@/components/Onboarding/CategoriesForm";
import { StyleForm } from "@/components/Onboarding/StyleForm";
import { supabase } from "@/integrations/supabase/client";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate("/login");
    return null;
  }

  const totalSteps = 7;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      navigate("/dashboard");
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-2xl shadow-card-hover">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl font-heading">Configuração Inicial</CardTitle>
                <CardDescription>Passo {step} de {totalSteps}</CardDescription>
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="text-center space-y-6 py-8">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-heading font-bold">
                  Bem-vindo ao FinanceTrack!
                </h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  Em apenas 5 minutos você terá controle total das suas finanças
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 space-y-2 max-w-md mx-auto">
                <p className="text-sm font-medium">O que vamos configurar:</p>
                <ul className="text-sm text-muted-foreground space-y-1 text-left">
                  <li>✓ Seu perfil financeiro</li>
                  <li>✓ Renda mensal</li>
                  <li>✓ Contas bancárias</li>
                  <li>✓ Categorias de gastos</li>
                  <li>✓ Preferências do sistema</li>
                </ul>
              </div>
            </div>
          )}

          {step === 2 && (
            <ProfileForm onNext={handleNext} onBack={handleBack} />
          )}

          {step === 3 && (
            <IncomeForm onNext={handleNext} onBack={handleBack} />
          )}

          {step === 4 && (
            <BanksForm onNext={handleNext} onBack={handleBack} />
          )}

          {step === 5 && (
            <CategoriesForm onNext={handleNext} onBack={handleBack} />
          )}

          {step === 6 && (
            <StyleForm onNext={handleNext} onBack={handleBack} />
          )}

          {step === 7 && (
            <div className="text-center space-y-6 py-8">
              <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-12 h-12 text-success" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-heading font-bold">
                  Tudo pronto! 🎉
                </h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  Sua conta está configurada e pronta para usar
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 space-y-3 max-w-md mx-auto">
                <div className="text-sm">
                  <p className="font-medium mb-2">Configuração completa!</p>
                  <div className="space-y-1 text-muted-foreground text-left">
                    <p>✓ Perfil configurado</p>
                    <p>✓ Renda definida</p>
                    <p>✓ Contas cadastradas</p>
                    <p>✓ Categorias selecionadas</p>
                    <p>✓ Estilo personalizado</p>
                  </div>
                </div>
              </div>
              <Button size="lg" onClick={() => navigate("/dashboard")}>
                Ir para Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
