/**
 * Statement Analyzer - Análise de extratos com IA
 */

import { Transaction } from './statementParser';
import { classifyTransaction } from './openai';

export interface ClassifiedTransaction extends Transaction {
  categoria: string;
  confianca: number;
}

export interface BehaviorProfile {
  frequenciaGastos: number;
  gastaoDiaria: number;
  gastosMaioresValores: Array<{ valor: number; desc: string; categoria: string }>;
  categoriasFrequentes: Record<string, number>;
}

export interface StatementAnalysis {
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
  topCategories: Record<string, number>;
  behaviorProfile: BehaviorProfile;
  riskAlert: boolean;
  insights: string[];
  transactions: ClassifiedTransaction[];
}

/**
 * Analisar extrato com IA
 */
export async function analyzeStatement(
  transactions: Transaction[]
): Promise<StatementAnalysis> {
  try {
    const analysis: StatementAnalysis = {
      totalTransactions: transactions.length,
      totalIncome: 0,
      totalExpenses: 0,
      topCategories: {},
      behaviorProfile: {
        frequenciaGastos: 0,
        gastaoDiaria: 0,
        gastosMaioresValores: [],
        categoriasFrequentes: {}
      },
      riskAlert: false,
      insights: [],
      transactions: []
    };

    // 1. Calcular totais
    transactions.forEach(t => {
      if (t.tipo === 'entrada') {
        analysis.totalIncome += t.valor;
      } else {
        analysis.totalExpenses += t.valor;
      }
    });

    // 2. Classificar transações com IA (em lote para eficiência)
    const classifiedTransactions: ClassifiedTransaction[] = [];
    
    for (const transaction of transactions) {
      try {
        const classified = await classifyTransaction(transaction.descricao);
        
        const classifiedTx: ClassifiedTransaction = {
          ...transaction,
          categoria: classified.categoria || 'Outro',
          confianca: classified.confianca || 50
        };

        classifiedTransactions.push(classifiedTx);

        // Contar categorias
        const cat = classified.categoria || 'Outro';
        analysis.topCategories[cat] = (analysis.topCategories[cat] || 0) + transaction.valor;
      } catch (error) {
        console.error('Erro ao classificar transação:', error);
        classifiedTransactions.push({
          ...transaction,
          categoria: 'Não classificado',
          confianca: 0
        });
      }
    }

    analysis.transactions = classifiedTransactions;

    // 3. Identificar padrões
    analysis.behaviorProfile = identifyPatterns(classifiedTransactions);

    // 4. Alertas de risco
    if (analysis.totalExpenses > analysis.totalIncome * 1.5) {
      analysis.riskAlert = true;
      analysis.insights.push('⚠️ Gastos muito superiores à renda - possível endividamento');
    }

    // 5. Gerar insights
    analysis.insights = [...analysis.insights, ...generateInsights(analysis, classifiedTransactions)];

    return analysis;
  } catch (error) {
    console.error('Erro ao analisar extrato:', error);
    throw error;
  }
}

/**
 * Identificar padrões de comportamento
 */
function identifyPatterns(transactions: ClassifiedTransaction[]): BehaviorProfile {
  const profile: BehaviorProfile = {
    frequenciaGastos: 0,
    gastaoDiaria: 0,
    gastosMaioresValores: [],
    categoriasFrequentes: {}
  };

  // Gastos maiores valores
  profile.gastosMaioresValores = transactions
    .filter(t => t.tipo !== 'entrada')
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5)
    .map(t => ({ 
      valor: t.valor, 
      desc: t.descricao.substring(0, 50), 
      categoria: t.categoria 
    }));

  // Frequência de gastos
  profile.frequenciaGastos = transactions.filter(t => t.tipo !== 'entrada').length;

  // Gasto diário médio
  const dias = new Set(
    transactions
      .filter(t => t.data)
      .map(t => t.data!.toISOString().split('T')[0])
  );
  
  const totalGastos = transactions
    .filter(t => t.tipo !== 'entrada')
    .reduce((sum, t) => sum + t.valor, 0);
  
  profile.gastaoDiaria = dias.size > 0 ? totalGastos / dias.size : 0;

  // Categorias mais frequentes
  transactions.forEach(t => {
    if (t.tipo !== 'entrada') {
      profile.categoriasFrequentes[t.categoria] = 
        (profile.categoriasFrequentes[t.categoria] || 0) + 1;
    }
  });

  return profile;
}

/**
 * Gerar insights
 */
function generateInsights(
  analysis: StatementAnalysis, 
  transactions: ClassifiedTransaction[]
): string[] {
  const insights: string[] = [];

  // Insight 1: Saúde financeira
  const ratio = analysis.totalIncome > 0 
    ? (analysis.totalExpenses / analysis.totalIncome * 100).toFixed(1)
    : '0';

  if (parseFloat(ratio) > 80) {
    insights.push(`⚠️ Seus gastos representam ${ratio}% da renda - aperte os cintos!`);
  } else if (parseFloat(ratio) > 60) {
    insights.push(`✓ Gastos controlados em ${ratio}% da renda`);
  } else {
    insights.push(`✅ Excelente - apenas ${ratio}% da renda foi gasto`);
  }

  // Insight 2: Categoria dominante
  const categoryEntries = Object.entries(analysis.topCategories)
    .sort((a, b) => b[1] - a[1]);
  
  if (categoryEntries.length > 0) {
    const [topCat, topValue] = categoryEntries[0];
    const percentage = ((topValue / analysis.totalExpenses) * 100).toFixed(1);
    insights.push(`📊 Maior gasto em ${topCat}: ${percentage}% do total`);
  }

  // Insight 3: Padrão de PIX
  const pixCount = transactions.filter(t => 
    t.descricao.toLowerCase().includes('pix')
  ).length;
  
  if (pixCount > 0) {
    insights.push(`📱 ${pixCount} transações via PIX detectadas`);
  }

  // Insight 4: Gastos pequenos frequentes
  const gastoPequeno = transactions.filter(t => 
    t.tipo !== 'entrada' && t.valor < 50
  ).length;
  
  if (gastoPequeno > transactions.length * 0.3) {
    insights.push(`💡 Muitos gastos pequenos detectados - considere consolidar compras`);
  }

  // Insight 5: Recomendação
  if (analysis.totalExpenses > analysis.totalIncome) {
    insights.push('💰 Recomendação: Busque fontes adicionais de renda ou reduza gastos');
  } else {
    const economia = analysis.totalIncome - analysis.totalExpenses;
    insights.push(`💵 Você economizou R$ ${economia.toFixed(2)} neste período!`);
  }

  return insights;
}
