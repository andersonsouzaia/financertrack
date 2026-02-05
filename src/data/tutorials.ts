/**
 * Dados mockados de tutoriais em vídeo
 */

export interface Tutorial {
  id: string;
  titulo: string;
  descricao: string;
  url: string; // URL do YouTube/Vimeo
  duracao: number; // em minutos
  nivel: 'iniciante' | 'intermediario' | 'avancado';
  categoria: string;
  thumbnail?: string;
}

export const tutorials: Tutorial[] = [
  {
    id: '1',
    titulo: 'Bem-vindo ao FinanceTrack',
    descricao: 'Aprenda os conceitos básicos e como começar a usar o sistema de gestão financeira.',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duracao: 5,
    nivel: 'iniciante',
    categoria: 'Introdução',
  },
  {
    id: '2',
    titulo: 'Como Cadastrar Suas Primeiras Transações',
    descricao: 'Passo a passo para cadastrar receitas e despesas no sistema.',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duracao: 8,
    nivel: 'iniciante',
    categoria: 'Transações',
  },
  {
    id: '3',
    titulo: 'Gerenciando Cartões de Crédito',
    descricao: 'Aprenda a cadastrar cartões, acompanhar faturas e controlar seus gastos.',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duracao: 12,
    nivel: 'intermediario',
    categoria: 'Cartões',
  },
  {
    id: '4',
    titulo: 'Criando e Acompanhando Metas Financeiras',
    descricao: 'Como definir metas mensais e de longo prazo e acompanhar seu progresso.',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duracao: 10,
    nivel: 'intermediario',
    categoria: 'Metas',
  },
  {
    id: '5',
    titulo: 'Calculadora de Juros Compostos',
    descricao: 'Entenda como usar a calculadora para planejar seus investimentos.',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duracao: 15,
    nivel: 'avancado',
    categoria: 'Investimentos',
  },
  {
    id: '6',
    titulo: 'Análise de Resumos Mensais e Anuais',
    descricao: 'Como interpretar os gráficos e relatórios para tomar melhores decisões financeiras.',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duracao: 12,
    nivel: 'intermediario',
    categoria: 'Relatórios',
  },
];

/**
 * Obtém tutoriais filtrados por nível
 */
export function getTutorialsByLevel(nivel: Tutorial['nivel']): Tutorial[] {
  return tutorials.filter((t) => t.nivel === nivel);
}

/**
 * Obtém tutoriais filtrados por categoria
 */
export function getTutorialsByCategory(categoria: string): Tutorial[] {
  return tutorials.filter((t) => t.categoria === categoria);
}

/**
 * Obtém todas as categorias únicas
 */
export function getCategories(): string[] {
  return Array.from(new Set(tutorials.map((t) => t.categoria)));
}
