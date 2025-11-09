import { supabase } from '@/integrations/supabase/client';
import { ensureUserExists } from './userHelper';

/**
 * Garante que o mês financeiro existe, se não, cria automaticamente
 */
export async function ensureMonthExists(userId: string) {
  if (!userId) throw new Error('User ID não fornecido');

  // Garantir que usuário existe em public.users antes de criar mês
  const userExists = await ensureUserExists(userId);
  if (!userExists) {
    throw new Error('Usuário não encontrado. Por favor, faça logout e login novamente.');
  }

  try {
    const hoje = new Date();
    const mes = hoje.getMonth() + 1;
    const ano = hoje.getFullYear();

    // Tentar buscar o mês existente
    const { data: existingMonth, error: selectError } = await supabase
      .from('meses_financeiros')
      .select('*')
      .eq('user_id', userId)
      .eq('mes', mes)
      .eq('ano', ano)
      .maybeSingle();

    // Se mês existe, retornar
    if (existingMonth) {
      return { success: true, month: existingMonth, created: false };
    }

    // Buscar saldo inicial de todas as contas
    const { data: contas } = await supabase
      .from('bancos_contas')
      .select('saldo_atual')
      .eq('user_id', userId);

    const saldoInicial = contas?.reduce((sum, c) => sum + (c.saldo_atual || 0), 0) || 0;

    // Criar novo mês
    const { data: newMonth, error: createError } = await supabase
      .from('meses_financeiros')
      .insert({
        user_id: userId,
        mes: mes,
        ano: ano,
        status: 'aberto',
        saldo_inicial: saldoInicial
      })
      .select()
      .single();

    if (createError) throw createError;

    return { success: true, month: newMonth, created: true };
  } catch (error) {
    console.error('Erro ao garantir mês:', error);
    throw error;
  }
}

/**
 * Retorna meses anteriores para visualização histórica
 */
export async function getPreviousMonths(userId: string, limit = 12) {
  try {
    const { data } = await supabase
      .from('meses_financeiros')
      .select('*')
      .eq('user_id', userId)
      .order('ano', { ascending: false })
      .order('mes', { ascending: false })
      .limit(limit);

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar meses anteriores:', error);
    return [];
  }
}

/**
 * Formata nome do mês
 */
export function getMonthName(mes: number, ano: number) {
  const date = new Date(ano, mes - 1, 1);
  return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
}

/**
 * Garante a existência de um mês específico (mes/ano) e o retorna
 */
export async function ensureSpecificMonthExists(userId: string, mes: number, ano: number) {
  if (!userId) throw new Error('User ID não fornecido');

  const userExists = await ensureUserExists(userId);
  if (!userExists) {
    throw new Error('Usuário não encontrado. Por favor, faça logout e login novamente.');
  }

  try {
    const { data: existingMonth } = await supabase
      .from('meses_financeiros')
      .select('*')
      .eq('user_id', userId)
      .eq('mes', mes)
      .eq('ano', ano)
      .maybeSingle();

    if (existingMonth) {
      return existingMonth;
    }

    const { data: contas } = await supabase
      .from('bancos_contas')
      .select('saldo_atual')
      .eq('user_id', userId);

    const saldoInicial = contas?.reduce((sum, c) => sum + (c.saldo_atual || 0), 0) || 0;

    const { data: newMonth, error: createError } = await supabase
      .from('meses_financeiros')
      .insert({
        user_id: userId,
        mes,
        ano,
        status: 'aberto',
        saldo_inicial: saldoInicial
      })
      .select()
      .single();

    if (createError) throw createError;

    return newMonth;
  } catch (error) {
    console.error('Erro ao garantir mês específico:', error);
    throw error;
  }
}

/**
 * Retorna uma lista de meses (garantindo existência) a partir do mês atual retrocedendo `range`
 */
export async function ensureRecentMonths(userId: string, range = 6) {
  if (!userId) return [];

  const today = new Date();
  const months: any[] = [];

  for (let i = 0; i < range; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const mes = date.getMonth() + 1;
    const ano = date.getFullYear();
    try {
      const ensuredMonth = await ensureSpecificMonthExists(userId, mes, ano);
      months.push(ensuredMonth);
    } catch (error) {
      console.error(`Erro ao garantir mês ${mes}/${ano}:`, error);
    }
  }

  return months.sort((a, b) => {
    if (a.ano === b.ano) {
      return b.mes - a.mes;
    }
    return b.ano - a.ano;
  });
}
