export default function OnboardingStep7({ data, onNext, loading }) {
  const saldoTotal = data.contas.reduce((sum, c) => sum + c.saldo_atual, 0);
  const gastoRecomendado = data.renda_mensal > 0
    ? ((data.renda_mensal * 0.4) / 30).toFixed(2)
    : 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Tudo Pronto!
        </h2>
        <p className="text-muted-foreground">
          Sua conta está configurada e pronta para usar
        </p>
      </div>

      <div className="space-y-4 bg-muted/50 p-6 rounded-lg">
        <div className="pb-4 border-b border-border">
          <p className="text-sm text-muted-foreground font-medium">👤 PERFIL</p>
          <p className="text-lg font-semibold text-foreground">{data.nome_completo}</p>
          <p className="text-sm text-muted-foreground">{data.pais} • {data.moeda_principal}</p>
        </div>

        <div className="pb-4 border-b border-border">
          <p className="text-sm text-muted-foreground font-medium">💰 RENDA</p>
          <p className="text-lg font-semibold text-foreground">
            R$ {data.renda_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">
            Gasto recomendado: R$ {gastoRecomendado}/dia
          </p>
        </div>

        <div className="pb-4 border-b border-border">
          <p className="text-sm text-muted-foreground font-medium">🏦 CONTAS</p>
          <p className="text-lg font-semibold text-foreground">
            {data.contas.length} conta{data.contas.length > 1 ? 's' : ''}
          </p>
          <p className="text-sm text-muted-foreground">
            Saldo Total: R$ {saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="pb-4 border-b border-border">
          <p className="text-sm text-muted-foreground font-medium">📂 CATEGORIAS</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {data.categorias_selecionadas.slice(0, 6).map(cat => (
              <span key={cat} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {cat}
              </span>
            ))}
            {data.categorias_selecionadas.length > 6 && (
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                +{data.categorias_selecionadas.length - 6} mais
              </span>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground font-medium">⚖️ ESTILO</p>
          <p className="text-lg font-semibold text-foreground capitalize">
            {data.estilo_usuario}
          </p>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={loading}
        className="w-full px-4 py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 font-bold text-lg transition-opacity"
      >
        {loading ? 'Processando...' : '✓ Começar a Usar'}
      </button>
    </div>
  );
}
