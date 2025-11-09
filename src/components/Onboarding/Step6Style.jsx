import { useState, useEffect } from 'react';

const ESTILOS = [
  {
    id: 'controlador',
    titulo: '🎯 CONTROLADOR',
    descricao: 'Quero metas firmes e alertas. Ajude-me a economizar!',
    features: [
      'Alertas imediatos',
      'Sugestões automáticas',
      'Limites rigorosos',
      'Relatórios detalhados'
    ]
  },
  {
    id: 'balanceado',
    titulo: '⚖️ BALANCEADO',
    subtitulo: '⭐ RECOMENDADO',
    descricao: 'Metas flexíveis com dicas amigáveis',
    features: [
      'Dicas educacionais',
      'Alertas moderados',
      'Flexibilidade nas metas',
      'Sugestões não-agressivas'
    ]
  },
  {
    id: 'organizador',
    titulo: '📊 ORGANIZADOR',
    descricao: 'Quero apenas organizar e visualizar. Sem pressão!',
    features: [
      'Sem alertas obrigatórios',
      'Apenas informação',
      'Flexibilidade total',
      'Sem recomendações agressivas'
    ]
  }
];

export default function OnboardingStep6({ data, onNext }) {
  const [estilo, setEstilo] = useState(data.estilo_usuario);

  // Sync com estado pai em tempo real
  useEffect(() => {
    onNext({ estilo_usuario: estilo });
  }, [estilo]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Qual é seu estilo?
        </h2>
        <p className="text-muted-foreground">
          Escolha como deseja usar o FinanceTrack
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ESTILOS.map(s => {
          const isSelected = estilo === s.id;
          return (
            <label
              key={s.id}
              className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'
              }`}
            >
              <input
                type="radio"
                name="estilo"
                value={s.id}
                checked={isSelected}
                onChange={(e) => setEstilo(e.target.value)}
                className="hidden"
              />
              <div className="space-y-3">
                <div>
                  <div className="text-lg font-bold text-foreground">
                    {s.titulo}
                    {s.subtitulo && (
                      <span className="ml-2 text-sm">{s.subtitulo}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {s.descricao}
                  </p>
                </div>
                <ul className="space-y-1">
                  {s.features.map(f => (
                    <li key={f} className="text-sm text-foreground flex items-center gap-2">
                      • {f}
                    </li>
                  ))}
                </ul>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
