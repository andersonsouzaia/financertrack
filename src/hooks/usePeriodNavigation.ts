import { useState, useCallback, useEffect } from 'react';
import {
  getPreviousPeriod,
  getNextPeriod,
  formatPeriod,
  isCurrentPeriod,
  PeriodType,
  monthToDate,
  dateToMonth,
} from '@/lib/dateHelpers';

interface UsePeriodNavigationProps {
  initialPeriod: Date | { mes: number; ano: number };
  periodType: PeriodType;
  onPeriodChange?: (period: Date) => void;
}

export function usePeriodNavigation({
  initialPeriod,
  periodType,
  onPeriodChange,
}: UsePeriodNavigationProps) {
  // Converter initialPeriod para Date se necessário
  const getInitialDate = useCallback(() => {
    if (initialPeriod instanceof Date) {
      return initialPeriod;
    }
    return monthToDate(initialPeriod);
  }, [initialPeriod]);

  const [currentPeriod, setCurrentPeriod] = useState<Date>(getInitialDate);
  const [history, setHistory] = useState<Date[]>([getInitialDate()]);

  useEffect(() => {
    const newDate = getInitialDate();
    setCurrentPeriod(newDate);
    setHistory([newDate]);
  }, [getInitialDate]);

  const goToPrevious = useCallback(() => {
    const previous = getPreviousPeriod(currentPeriod, periodType);
    setCurrentPeriod(previous);
    setHistory((prev) => [previous, ...prev].slice(0, 10)); // Manter últimos 10
    onPeriodChange?.(previous);
  }, [currentPeriod, periodType, onPeriodChange]);

  const goToNext = useCallback(() => {
    const next = getNextPeriod(currentPeriod, periodType);
    setCurrentPeriod(next);
    setHistory((prev) => [next, ...prev].slice(0, 10));
    onPeriodChange?.(next);
  }, [currentPeriod, periodType, onPeriodChange]);

  const goToPeriod = useCallback(
    (period: Date) => {
      setCurrentPeriod(period);
      setHistory((prev) => [period, ...prev].slice(0, 10));
      onPeriodChange?.(period);
    },
    [onPeriodChange]
  );

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentPeriod(today);
    setHistory((prev) => [today, ...prev].slice(0, 10));
    onPeriodChange?.(today);
  }, [onPeriodChange]);

  const formattedPeriod = formatPeriod(currentPeriod, periodType);
  const isCurrent = isCurrentPeriod(currentPeriod, periodType);

  return {
    currentPeriod,
    formattedPeriod,
    isCurrent,
    goToPrevious,
    goToNext,
    goToPeriod,
    goToToday,
    history,
  };
}
