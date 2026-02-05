import { useEffect, useRef } from 'react';
import { updateTutorialProgress, markTutorialAsWatched } from '@/lib/tutorialTracking';
import type { Tutorial } from '@/data/tutorials';

interface VideoPlayerProps {
  tutorial: Tutorial;
  onClose?: () => void;
}

export function VideoPlayer({ tutorial, onClose }: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Simular tracking de progresso (em produção, usar eventos do player)
    progressIntervalRef.current = setInterval(() => {
      updateTutorialProgress(tutorial.id, 50, false);
    }, 30000); // Atualizar a cada 30 segundos

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [tutorial.id]);

  const handleVideoEnd = () => {
    markTutorialAsWatched(tutorial.id);
    if (onClose) {
      setTimeout(onClose, 2000);
    }
  };

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
      <iframe
        ref={iframeRef}
        src={tutorial.url}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={() => {
          // Marcar como assistido quando o vídeo carregar (simulação)
          // Em produção, usar eventos do player de vídeo
        }}
      />
    </div>
  );
}
