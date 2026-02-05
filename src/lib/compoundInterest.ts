/**
 * Calculadora de Juros Compostos
 * 
 * Fórmula: M = P × (1 + i)^n + PMT × [((1 + i)^n - 1) / i]
 * Onde:
 * - M = Montante final
 * - P = Valor inicial (principal)
 * - PMT = Aporte mensal
 * - i = Taxa de juros mensal (em decimal)
 * - n = Número de meses
 */

export interface EvolucaoMes {
  mes: number;
  valorInicial: number;
  aporte: number;
  juros: number;
  montante: number;
}

export interface ResultadoJurosCompostos {
  montanteFinal: number;
  totalInvestido: number;
  totalJuros: number;
  evolucao: EvolucaoMes[];
}

/**
 * Calcula juros compostos com aportes mensais
 */
export function calcularJurosCompostos(
  valorInicial: number,
  aporteMensal: number,
  taxaMensal: number, // em decimal (ex: 0.01 para 1%)
  meses: number
): ResultadoJurosCompostos {
  const evolucao: EvolucaoMes[] = [];
  let montante = valorInicial;
  const taxaDecimal = taxaMensal / 100; // Converter porcentagem para decimal

  for (let mes = 1; mes <= meses; mes++) {
    const valorInicialMes = montante;
    const jurosMes = montante * taxaDecimal;
    montante = montante + jurosMes + aporteMensal;

    evolucao.push({
      mes,
      valorInicial: valorInicialMes,
      aporte: aporteMensal,
      juros: jurosMes,
      montante,
    });
  }

  const totalInvestido = valorInicial + aporteMensal * meses;
  const totalJuros = montante - totalInvestido;

  return {
    montanteFinal: montante,
    totalInvestido,
    totalJuros,
    evolucao,
  };
}

/**
 * Calcula o valor mensal necessário para atingir uma meta
 */
export function calcularValorMensalNecessario(
  valorMeta: number,
  valorAtual: number,
  taxaMensal: number, // em decimal (ex: 0.01 para 1%)
  mesesRestantes: number
): number {
  if (mesesRestantes <= 0) {
    return 0;
  }

  const taxaDecimal = taxaMensal / 100;
  const valorFaltante = valorMeta - valorAtual;

  if (valorFaltante <= 0) {
    return 0;
  }

  // Fórmula: PMT = (VF - P × (1 + i)^n) / [((1 + i)^n - 1) / i]
  // Simplificada para quando não há valor inicial: PMT = VF / [((1 + i)^n - 1) / i]
  const fatorJuros = Math.pow(1 + taxaDecimal, mesesRestantes);
  const fatorAnuidade = (fatorJuros - 1) / taxaDecimal;

  // Se há valor atual, considerar o crescimento dele
  const valorAtualFuturo = valorAtual * fatorJuros;
  const valorFaltanteAjustado = valorMeta - valorAtualFuturo;

  if (valorFaltanteAjustado <= 0) {
    return 0;
  }

  const aporteMensal = valorFaltanteAjustado / fatorAnuidade;

  return Math.max(0, Math.round(aporteMensal * 100) / 100);
}
