import { useState, useEffect } from 'react';

const CATEGORIAS_DISPONIVEIS = [
  { nome: 'Alimentação', icone: '🍕', selecionada: true },
  { nome: 'Transporte', icone: '🚗', selecionada: true },
  { nome: 'Moradia', icone: '🏠', selecionada: true },
  { nome: 'Diversão', icone: '🎮', selecionada: true },
  { nome: 'Saúde/Beleza', icone: '💆', selecionada: true },
  { nome: 'Roupas/Acessórios', icone: '👗', selecionada: true },
  { nome: 'Educação', icone: '📚', selecionada: false },
  { nome: 'Setup/Equipamentos', icone: '💻', selecionada: false },
  { nome: 'Assinaturas', icone: '📱', selecionada: false },
  { nome: 'Investimentos', icone: '📈', selecionada: false },
  { nome: 'Seguros', icone: '🛡️', selecionada: false },
  { nome: 'Viagens', icone: '✈️', selecionada: false },
  { nome: 'Pets', icone: '🐾', selecionada: false },
  { nome: 'Outro', icone: '❓', selecionada: false }
];

export default function OnboardingStep5({ data, onNext }) {
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState(data.categorias_selecionadas);

  // Sync com estado pai em tempo real
  useEffect(() => {
    onNext({ categorias_selecionadas: categoriasSelecionadas });
  }, [categoriasSelecionadas]);

  const toggleCategoria = (nome) => {
    if (categoriasSelecionadas.includes(nome)) {
      setCategoriasSelecionadas(categoriasSelecionadas.filter(c => c !== nome));
    } else {
      setCategoriasSelecionadas([...categoriasSelecionadas, nome]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          📂 Categorias de Gastos
        </h2>
        <p className="text-muted-foreground">
          Selecione as categorias que fazem sentido para você
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {CATEGORIAS_DISPONIVEIS.map(cat => {
          const isSelected = categoriasSelecionadas.includes(cat.nome);
          return (
            <label
              key={cat.nome}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleCategoria(cat.nome)}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">{cat.icone}</span>
                <span className="text-sm font-medium text-foreground text-center">
                  {cat.nome}
                </span>
              </div>
            </label>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Você pode adicionar/remover depois
      </p>
    </div>
  );
}
