import { useState, useEffect } from 'react';

export default function OnboardingStep2({ data, onNext }) {
  const [formData, setFormData] = useState(data);

  // Sync com estado pai em tempo real
  useEffect(() => {
    onNext(formData);
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          👤 Conte-nos sobre você
        </h2>
        <p className="text-muted-foreground">
          Essas informações nos ajudam a personalizar sua experiência
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nome Completo *
          </label>
          <input
            type="text"
            value={formData.nome_completo}
            onChange={(e) => handleChange('nome_completo', e.target.value)}
            required
            minLength={3}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Data de Nascimento (opcional)
          </label>
          <input
            type="date"
            value={formData.data_nascimento}
            onChange={(e) => handleChange('data_nascimento', e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            País *
          </label>
          <select
            value={formData.pais}
            onChange={(e) => handleChange('pais', e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="Brasil">Brasil</option>
            <option value="Portugal">Portugal</option>
            <option value="Angola">Angola</option>
            <option value="Moçambique">Moçambique</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Moeda Principal *
          </label>
          <select
            value={formData.moeda_principal}
            onChange={(e) => handleChange('moeda_principal', e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="BRL">BRL - Real Brasileiro</option>
            <option value="USD">USD - Dólar Americano</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - Libra Esterlina</option>
            <option value="AOA">AOA - Kwanza Angolano</option>
            <option value="MZN">MZN - Metical Moçambicano</option>
          </select>
        </div>
      </div>
    </div>
  );
}
