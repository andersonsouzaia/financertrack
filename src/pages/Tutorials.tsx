import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { tutorials, getCategories, getTutorialsByCategory, getTutorialsByLevel } from '@/data/tutorials';
import { VideoCard } from '@/components/Dashboard/VideoCard';
import { VideoPlayer } from '@/components/Dashboard/VideoPlayer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Tutorial } from '@/data/tutorials';

export default function Tutorials() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterNivel, setFilterNivel] = useState<string>('all');
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);

  const categories = getCategories();

  const filteredTutorials = tutorials.filter((tutorial) => {
    const matchesSearch =
      tutorial.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutorial.descricao.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategoria = filterCategoria === 'all' || tutorial.categoria === filterCategoria;
    const matchesNivel = filterNivel === 'all' || tutorial.nivel === filterNivel;

    return matchesSearch && matchesCategoria && matchesNivel;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tutoriais</h1>
          <p className="text-muted-foreground mt-1">
            Aprenda a usar o FinanceTrack com nossos tutoriais em vídeo
          </p>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tutoriais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterNivel} onValueChange={setFilterNivel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              <SelectItem value="iniciante">Iniciante</SelectItem>
              <SelectItem value="intermediario">Intermediário</SelectItem>
              <SelectItem value="avancado">Avançado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de Tutoriais */}
        {filteredTutorials.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum tutorial encontrado com os filtros aplicados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTutorials.map((tutorial) => (
              <VideoCard
                key={tutorial.id}
                tutorial={tutorial}
                onClick={() => setSelectedTutorial(tutorial)}
              />
            ))}
          </div>
        )}

        {/* Player Dialog */}
        <Dialog open={!!selectedTutorial} onOpenChange={(open) => !open && setSelectedTutorial(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedTutorial?.titulo}</DialogTitle>
            </DialogHeader>
            {selectedTutorial && (
              <VideoPlayer
                tutorial={selectedTutorial}
                onClose={() => setSelectedTutorial(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
