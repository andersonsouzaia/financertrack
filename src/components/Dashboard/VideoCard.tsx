import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Clock } from 'lucide-react';
import type { Tutorial } from '@/data/tutorials';
import { getTutorialProgress } from '@/lib/tutorialTracking';

interface VideoCardProps {
  tutorial: Tutorial;
  onClick?: () => void;
}

export function VideoCard({ tutorial, onClick }: VideoCardProps) {
  const progress = getTutorialProgress(tutorial.id);

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'iniciante':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermediario':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      case 'avancado':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{tutorial.titulo}</CardTitle>
          <Badge className={getNivelColor(tutorial.nivel)}>
            {tutorial.nivel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{tutorial.descricao}</p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{tutorial.duracao} min</span>
          </div>
          <Badge variant="outline">{tutorial.categoria}</Badge>
        </div>

        {progress && (
          <div className="pt-2">
            {progress.watched ? (
              <Badge variant="default" className="w-full justify-center">
                <Play className="h-3 w-3 mr-1" />
                Concluído
              </Badge>
            ) : progress.progress > 0 ? (
              <Badge variant="secondary" className="w-full justify-center">
                {progress.progress}% assistido
              </Badge>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
