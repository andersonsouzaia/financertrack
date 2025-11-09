import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Wallet, ArrowRight, Sparkles } from "lucide-react";

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
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-heading font-bold">
                  Conte-nos sobre você
                </h2>
                <p className="text-muted-foreground">
                  Essas informações nos ajudam a personalizar sua experiência
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Formulário de perfil será implementado</p>
                  <p className="text-xs text-muted-foreground">
                    (Nome, Data de Nascimento, País, Moeda)
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-heading font-bold">
                  Qual é sua renda mensal?
                </h2>
                <p className="text-muted-foreground">
                  Vamos calcular seu orçamento recomendado
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Formulário de renda será implementado</p>
                  <p className="text-xs text-muted-foreground">
                    (Renda mensal, Tipo de profissão, Renda compartilhada)
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-heading font-bold">
                  Suas contas bancárias
                </h2>
                <p className="text-muted-foreground">
                  Registre suas contas para ter visão completa
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Formulário de contas será implementado</p>
                  <p className="text-xs text-muted-foreground">
                    (Nome do banco, Tipo, Saldo atual)
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-heading font-bold">
                  Categorias de gastos
                </h2>
                <p className="text-muted-foreground">
                  Selecione as categorias que fazem sentido para você
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Seleção de categorias será implementada</p>
                  <p className="text-xs text-muted-foreground">
                    (Alimentação, Transporte, Moradia, etc.)
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-heading font-bold">
                  Qual é seu estilo?
                </h2>
                <p className="text-muted-foreground">
                  Escolha como deseja usar o FinanceTrack
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Seleção de estilo será implementada</p>
                  <p className="text-xs text-muted-foreground">
                    (Controlador, Balanceado, Organizador)
                  </p>
                </div>
              </div>
            </div>
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
                  <p className="font-medium mb-2">Resumo da configuração:</p>
                  <div className="space-y-1 text-muted-foreground text-left">
                    <p>✓ Perfil configurado</p>
                    <p>✓ Renda: R$ 5.000/mês</p>
                    <p>✓ Saldo inicial: R$ 10.000</p>
                    <p>✓ 1 conta bancária</p>
                    <p>✓ 6 categorias ativas</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              Voltar
            </Button>
            <Button onClick={handleNext}>
              {step === totalSteps ? "Ir para Dashboard" : "Próximo"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
