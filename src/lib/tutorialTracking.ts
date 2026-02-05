/**
 * Sistema de tracking de progresso de tutoriais
 * Armazena progresso no localStorage
 */

export interface TutorialProgress {
  tutorialId: string;
  watched: boolean;
  progress: number; // 0-100
  lastWatchedAt?: string;
}

const STORAGE_KEY = 'financertrack_tutorial_progress';

/**
 * Obtém progresso de um tutorial específico
 */
export function getTutorialProgress(tutorialId: string): TutorialProgress | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const progress: TutorialProgress[] = JSON.parse(stored);
    return progress.find((p) => p.tutorialId === tutorialId) || null;
  } catch (error) {
    console.error('Erro ao buscar progresso do tutorial:', error);
    return null;
  }
}

/**
 * Obtém todos os progressos salvos
 */
export function getAllTutorialProgress(): TutorialProgress[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    return JSON.parse(stored);
  } catch (error) {
    console.error('Erro ao buscar progressos dos tutoriais:', error);
    return [];
  }
}

/**
 * Salva progresso de um tutorial
 */
export function saveTutorialProgress(progress: TutorialProgress): void {
  try {
    const allProgress = getAllTutorialProgress();
    const existingIndex = allProgress.findIndex(
      (p) => p.tutorialId === progress.tutorialId
    );

    if (existingIndex >= 0) {
      allProgress[existingIndex] = progress;
    } else {
      allProgress.push(progress);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error('Erro ao salvar progresso do tutorial:', error);
  }
}

/**
 * Marca tutorial como assistido
 */
export function markTutorialAsWatched(tutorialId: string): void {
  saveTutorialProgress({
    tutorialId,
    watched: true,
    progress: 100,
    lastWatchedAt: new Date().toISOString(),
  });
}

/**
 * Atualiza progresso de um tutorial
 */
export function updateTutorialProgress(
  tutorialId: string,
  progress: number,
  watched: boolean = false
): void {
  saveTutorialProgress({
    tutorialId,
    watched,
    progress: Math.min(100, Math.max(0, progress)),
    lastWatchedAt: watched ? new Date().toISOString() : undefined,
  });
}

/**
 * Remove progresso de um tutorial
 */
export function removeTutorialProgress(tutorialId: string): void {
  try {
    const allProgress = getAllTutorialProgress();
    const filtered = allProgress.filter((p) => p.tutorialId !== tutorialId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Erro ao remover progresso do tutorial:', error);
  }
}
