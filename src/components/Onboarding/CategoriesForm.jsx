import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { categories } from '@/data/categories';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function CategoriesForm({ onNext, onBack }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(
    categories.filter(c => c.preSelected).map(c => c.id)
  );

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedCategories.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione pelo menos uma categoria"
      });
      return;
    }

    setLoading(true);

    try {
      const categoriesToInsert = selectedCategories.map(catId => {
        const category = categories.find(c => c.id === catId);
        return {
          user_id: user.id,
          nome: category.name,
          tipo: category.type,
          icone: category.icon,
          cor: category.color,
          padrao: true,
          ativo: true
        };
      });

      const { error } = await supabase
        .from('categorias_saidas')
        .insert(categoriesToInsert);

      if (error) throw error;

      toast({
        title: "Categorias configuradas!",
        description: `${selectedCategories.length} categoria(s) adicionada(s)`
      });

      onNext();
    } catch (error) {
      console.error('Error saving categories:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar categorias",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-heading font-bold">Categorias de gastos</h2>
        <p className="text-muted-foreground">
          Selecione as categorias que fazem sentido para você
        </p>
        <p className="text-sm text-muted-foreground">
          (Você pode adicionar/remover depois)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {categories.map(category => (
          <Card
            key={category.id}
            className={`p-4 cursor-pointer transition-all ${
              selectedCategories.includes(category.id)
                ? 'border-primary bg-primary/5'
                : 'hover:border-muted-foreground'
            }`}
            onClick={() => toggleCategory(category.id)}
          >
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
              />
              <span className="text-2xl">{category.icon}</span>
              <Label className="cursor-pointer flex-1">{category.name}</Label>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-muted/50">
        <p className="text-center text-sm">
          <strong>{selectedCategories.length}</strong> categoria(s) selecionada(s)
        </p>
      </Card>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Próximo'}
        </Button>
      </div>
    </form>
  );
}
