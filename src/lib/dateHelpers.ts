/**
 * Funções auxiliares para manipulação de datas e períodos
 */

export type PeriodType = 'month' | 'week' | 'day';

/**
 * Retorna o início e fim de uma semana baseada em uma data
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para segunda-feira
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Retorna o período anterior baseado no tipo
 */
export function getPreviousPeriod(currentPeriod: Date, type: PeriodType): Date {
  const newDate = new Date(currentPeriod);
  
  switch (type) {
    case 'month':
      newDate.setMonth(newDate.getMonth() - 1);
      break;
    case 'week':
      newDate.setDate(newDate.getDate() - 7);
      break;
    case 'day':
      newDate.setDate(newDate.getDate() - 1);
      break;
  }
  
  return newDate;
}

/**
 * Retorna o período próximo baseado no tipo
 */
export function getNextPeriod(currentPeriod: Date, type: PeriodType): Date {
  const newDate = new Date(currentPeriod);
  
  switch (type) {
    case 'month':
      newDate.setMonth(newDate.getMonth() + 1);
      break;
    case 'week':
      newDate.setDate(newDate.getDate() + 7);
      break;
    case 'day':
      newDate.setDate(newDate.getDate() + 1);
      break;
  }
  
  return newDate;
}

/**
 * Formata um período para exibição
 */
export function formatPeriod(period: Date, type: PeriodType): string {
  switch (type) {
    case 'month':
      return period.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    case 'week': {
      const { start, end } = getWeekRange(period);
      return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
    }
    case 'day':
      return period.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    default:
      return period.toLocaleDateString('pt-BR');
  }
}

/**
 * Verifica se uma data está no período atual
 */
export function isCurrentPeriod(date: Date, type: PeriodType): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  switch (type) {
    case 'month':
      return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    case 'week': {
      const { start: weekStart, end: weekEnd } = getWeekRange(date);
      const { start: todayWeekStart, end: todayWeekEnd } = getWeekRange(today);
      return weekStart.getTime() === todayWeekStart.getTime();
    }
    case 'day':
      return date.toDateString() === today.toDateString();
    default:
      return false;
  }
}

/**
 * Converte um objeto meses_financeiros para Date
 */
export function monthToDate(month: { mes: number; ano: number }): Date {
  return new Date(month.ano, month.mes - 1, 1);
}

/**
 * Converte uma Date para objeto meses_financeiros
 */
export function dateToMonth(date: Date): { mes: number; ano: number } {
  return {
    mes: date.getMonth() + 1,
    ano: date.getFullYear(),
  };
}
