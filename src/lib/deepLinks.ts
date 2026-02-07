/**
 * Sistema de Deep Linking
 * 
 * Gera URLs contextuais para navegação direta para ações específicas,
 * seguindo o princípio de antecipação de UX de bancos modernos.
 */

/**
 * Gera deep link para pagar uma fatura específica
 */
export function generatePayInvoiceLink(cardId: string, faturaId: string): string {
  return `/cards/${cardId}/faturas/${faturaId}/pagar`;
}

/**
 * Gera deep link para criar nova transação com contexto pré-preenchido
 */
export function generateNewTransactionLink(params: {
  type?: 'entrada' | 'saida_fixa' | 'diario' | 'barcode';
  cardId?: string;
  categoryId?: string;
  accountId?: string;
  code?: string; // Para código de barras
}): string {
  const searchParams = new URLSearchParams();
  
  if (params.type) searchParams.set('type', params.type);
  if (params.cardId) searchParams.set('cardId', params.cardId);
  if (params.categoryId) searchParams.set('categoryId', params.categoryId);
  if (params.accountId) searchParams.set('accountId', params.accountId);
  if (params.code) searchParams.set('code', params.code);
  
  const queryString = searchParams.toString();
  return `/transactions/new${queryString ? `?${queryString}` : ''}`;
}

/**
 * Gera deep link para parcelar uma fatura
 */
export function generateInstallInvoiceLink(cardId: string, faturaId: string): string {
  return `/cards/${cardId}/faturas/${faturaId}/parcelar`;
}

/**
 * Gera deep link para ver detalhes de uma fatura
 */
export function generateInvoiceDetailsLink(cardId: string, faturaId: string): string {
  return `/cards/${cardId}/faturas/${faturaId}`;
}

/**
 * Gera deep link para ver detalhes de uma compra parcelada
 */
export function generateInstallmentDetailsLink(compraId: string): string {
  return `/installments/${compraId}`;
}

/**
 * Gera deep link para editar uma transação
 */
export function generateEditTransactionLink(transactionId: string): string {
  return `/transactions/${transactionId}/edit`;
}

/**
 * Gera deep link para ver detalhes de um cartão
 */
export function generateCardDetailsLink(cardId: string): string {
  return `/cards/${cardId}`;
}

/**
 * Gera deep link para criar uma meta mensal com contexto
 */
export function generateNewMonthlyGoalLink(params?: {
  categoryId?: string;
  tipo?: string;
}): string {
  const searchParams = new URLSearchParams();
  
  if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
  if (params?.tipo) searchParams.set('tipo', params.tipo);
  
  const queryString = searchParams.toString();
  return `/monthly-goals/new${queryString ? `?${queryString}` : ''}`;
}

/**
 * Gera deep link para notificação de fatura fechada
 */
export function generateInvoiceClosedNotificationLink(
  cardId: string,
  faturaId: string
): string {
  return generatePayInvoiceLink(cardId, faturaId);
}

/**
 * Parse de deep link para extrair parâmetros
 */
export function parseDeepLink(url: string): {
  path: string;
  params: Record<string, string>;
} {
  try {
    const urlObj = new URL(url, window.location.origin);
    const params: Record<string, string> = {};
    
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return {
      path: urlObj.pathname,
      params,
    };
  } catch {
    return {
      path: url,
      params: {},
    };
  }
}

/**
 * Valida se uma URL é um deep link válido
 */
export function isValidDeepLink(url: string): boolean {
  const validPaths = [
    '/cards/',
    '/transactions/',
    '/installments/',
    '/monthly-goals/',
  ];
  
  return validPaths.some((path) => url.includes(path));
}
