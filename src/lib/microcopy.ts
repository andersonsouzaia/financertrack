/**
 * Biblioteca de Microcopy - Textos orientadores seguindo princípios de UX de bancos modernos
 * 
 * Os textos aqui criam continuidade narrativa e orientam o usuário sobre o que acontecerá
 * na próxima tela/ação, seguindo o princípio de "não há choque na transição".
 */

// Botões de ação - descrevem exatamente o que a próxima página contém
export const BUTTONS = {
  // Navegação
  goToReceipt: "Ir para comprovante",
  reviewData: "Revisar dados",
  payNow: "Pagar agora",
  seeDetails: "Ver detalhes",
  backToDashboard: "Voltar ao dashboard",
  
  // Transações
  addTransaction: "Nova Transação",
  addCardExpense: "Gasto no Cartão",
  editTransaction: "Editar transação",
  deleteTransaction: "Excluir transação",
  
  // Faturas e Cartões
  payInvoice: "Pagar fatura",
  markAsPaid: "Marcar como pago",
  markAsUnpaid: "Marcar como não pago",
  installInvoice: "Parcelar fatura",
  viewInvoiceDetails: "Ver detalhes da fatura",
  shareReceipt: "Compartilhar comprovante",
  
  // Formulários
  continue: "Continuar",
  confirm: "Confirmar",
  cancel: "Cancelar",
  save: "Salvar",
  create: "Criar",
  update: "Atualizar",
  delete: "Excluir",
  
  // Ações rápidas
  createCategory: "Criar Categoria",
  createCard: "Criar Cartão",
  createGoal: "Criar Meta",
} as const;

// Mensagens de etapas - criam um túnel cognitivo
export const STEPS = {
  // Formulário de transação
  whoReceives: "Quem recebe?",
  howMuch: "Quanto?",
  when: "Quando?",
  confirm: "Confirmar?",
  
  // Formulário de parcelamento
  totalValue: "Valor total",
  numberOfInstallments: "Número de parcelas",
  firstDueDate: "Data da primeira parcela",
  reviewInstallments: "Revisar parcelas",
  confirmInstallments: "Confirmar parcelamento",
} as const;

// Mensagens contextuais - antecipam ações
export const CONTEXTUAL = {
  // Clipboard detection
  barcodeDetected: "Deseja pagar o boleto copiado?",
  payBarcode: "Pagar boleto",
  
  // Notificações
  invoiceClosed: "Fatura fechada",
  invoiceClosedMessage: "Sua fatura foi fechada. Deseja pagar agora?",
  goToPayment: "Ir para pagamento",
  
  // Ações sugeridas
  suggestInstallment: "Esta fatura pode ser parcelada",
  suggestPayment: "Fatura vence em breve",
  suggestReview: "Revisar antes de confirmar",
} as const;

// Mensagens de orientação em formulários
export const FORM_GUIDANCE = {
  // Campos obrigatórios
  requiredField: "Campo obrigatório",
  selectCategory: "Selecione uma categoria",
  selectAccount: "Selecione uma conta",
  selectCard: "Selecione um cartão",
  
  // Validações
  invalidValue: "Valor inválido",
  invalidDate: "Data inválida",
  cardRequired: "Cartão obrigatório para gastos",
  
  // Ajuda contextual
  helpCategory: "Categorize para melhor análise",
  helpDate: "Data da transação",
  helpValue: "Valor em reais (R$)",
  helpInstallments: "Divida em até 12 parcelas",
} as const;

// Mensagens de feedback
export const FEEDBACK = {
  // Sucesso
  transactionAdded: "Transação adicionada!",
  transactionUpdated: "Transação atualizada!",
  transactionDeleted: "Transação excluída!",
  invoicePaid: "Fatura marcada como paga!",
  installmentsCreated: "Parcelamento criado!",
  
  // Erros
  errorAdding: "Erro ao adicionar",
  errorUpdating: "Erro ao atualizar",
  errorDeleting: "Erro ao excluir",
  errorPaying: "Erro ao processar pagamento",
  
  // Confirmações
  confirmDelete: "Tem certeza que deseja excluir?",
  confirmPay: "Confirmar pagamento?",
  confirmInstallment: "Confirmar parcelamento?",
} as const;

// Placeholders e hints
export const PLACEHOLDERS = {
  description: "Ex: Supermercado, Restaurante...",
  value: "0,00",
  search: "Buscar...",
  selectCategory: "Selecione uma categoria",
  selectAccount: "Selecione uma conta",
  selectCard: "Selecione um cartão",
  numberOfInstallments: "Ex: 3, 6, 12",
} as const;

// Títulos e descrições de páginas
export const PAGE_TITLES = {
  dashboard: "Dashboard",
  transactions: "Transações",
  cards: "Cartões",
  invoices: "Faturas",
  installments: "Parcelas",
  goals: "Metas",
} as const;

export const PAGE_DESCRIPTIONS = {
  dashboard: "Acompanhe rapidamente o status financeiro do período selecionado",
  transactions: "Gerencie e acompanhe seus lançamentos financeiros",
  cards: "Gerencie seus cartões de crédito e débito",
  invoices: "Visualize e gerencie suas faturas",
  installments: "Acompanhe suas compras parceladas",
  goals: "Defina e acompanhe suas metas financeiras",
} as const;

// Tipos para TypeScript
export type ButtonKey = keyof typeof BUTTONS;
export type StepKey = keyof typeof STEPS;
export type ContextualKey = keyof typeof CONTEXTUAL;
export type FormGuidanceKey = keyof typeof FORM_GUIDANCE;
export type FeedbackKey = keyof typeof FEEDBACK;
export type PlaceholderKey = keyof typeof PLACEHOLDERS;
