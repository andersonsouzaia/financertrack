import { useState } from 'react';

export default function OnboardingStep3({ data, onNext }) {
  const [formData, setFormData] = useState(data);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const gastoRecomendado = formData.renda_mensal > 0
    ? ((formData.renda_mensal * 0.4) / 30).toFixed(2)
    : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          💰 Qual é sua renda mensal?
        </h2>
        <p className="text-muted-foreground">
          Vamos calcular seu orçamento recomendado
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Renda Mensal (R$) *
          </label>
          <input
            type="number"
            value={formData.renda_mensal}
            onChange={(e) => handleChange('renda_mensal', parseFloat(e.target.value) || 0)}
            required
            min={0}
            step={100}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Tipo de Profissão *
          </label>
          <select
            value={formData.tipo_profissao}
            onChange={(e) => handleChange('tipo_profissao', e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="Empregado">Empregado (CLT)</option>
            <option value="Autónomo">Autônomo</option>
            <option value="Freelancer">Freelancer</option>
            <option value="Empresário">Empresário</option>
            <option value="Aposentado">Aposentado</option>
            <option value="Estudante">Estudante</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="freelancer"
            checked={formData.eh_freelancer}
            onChange={(e) => handleChange('eh_freelancer', e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="freelancer" className="text-sm font-medium text-foreground">
            Minha renda é variável
          </label>
        </div>

        {formData.eh_freelancer && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Renda Mínima (R$)
              </label>
              <input
                type="number"
                value={formData.renda_minima}
                onChange={(e) => handleChange('renda_minima', parseFloat(e.target.value) || 0)}
                min={0}
                step={100}
                className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Renda Máxima (R$)
              </label>
              <input
                type="number"
                value={formData.renda_maxima}
                onChange={(e) => handleChange('renda_maxima', parseFloat(e.target.value) || 0)}
                min={0}
                step={100}
                className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
              />
            </div>
          </div>
        )}

        <div className="bg-primary/10 p-4 rounded-lg">
          <p className="text-sm text-foreground">
            <strong>Gasto Recomendado por Dia:</strong>
          </p>
          <p className="text-2xl font-bold text-primary">
            R$ {gastoRecomendado}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            É apenas sua renda ou combina? *
          </label>
          <div className="space-y-2">
            {[
              { value: 'nenhuma', label: 'Apenas minha' },
              { value: 'conjuge', label: 'Combina com cônjuge' },
              { value: 'outros', label: 'Combina com outros (roommates)' }
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-2 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                <input
                  type="radio"
                  name="renda_compartilhada"
                  value={opt.value}
                  checked={formData.tipo_renda_compartilhada === opt.value}
                  onChange={(e) => handleChange('tipo_renda_compartilhada', e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-foreground">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {formData.tipo_renda_compartilhada !== 'nenhuma' && (
          <div className="space-y-3 p-4 bg-secondary/10 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Renda Total Compartilhada (R$)
              </label>
              <input
                type="number"
                value={formData.renda_total_compartilhada}
                onChange={(e) => handleChange('renda_total_compartilhada', parseFloat(e.target.value) || 0)}
                min={0}
                step={100}
                className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sua Parte (%)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={formData.sua_parte_percentual}
                onChange={(e) => handleChange('sua_parte_percentual', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm mt-2 text-muted-foreground">
                <span>Você: R$ {((formData.renda_total_compartilhada * formData.sua_parte_percentual) / 100).toFixed(2)}</span>
                <span>{formData.sua_parte_percentual}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
