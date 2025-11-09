export default function OnboardingStep1({ onNext }) {
  return (
    <div className="text-center space-y-6">
      <div className="text-5xl">🚀</div>
      
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Bem-vindo ao FinanceTrack!
        </h1>
        <p className="text-muted-foreground text-lg">
          Em apenas 7 passos você terá controle total das suas finanças
        </p>
      </div>

      <div className="bg-muted/50 p-6 rounded-lg text-left space-y-3">
        <p className="font-semibold text-foreground">O que vamos configurar:</p>
        <ul className="space-y-2 text-muted-foreground">
          <li>✓ Seu perfil financeiro</li>
          <li>✓ Renda mensal e estilo de uso</li>
          <li>✓ Suas contas bancárias</li>
          <li>✓ Categorias de gastos</li>
          <li>✓ Preferências do sistema</li>
        </ul>
      </div>

      <p className="text-sm text-muted-foreground">
        Leva menos de 5 minutos!
      </p>
    </div>
  );
}
