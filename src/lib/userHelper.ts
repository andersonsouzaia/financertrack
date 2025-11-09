import { supabase } from '@/integrations/supabase/client';

/**
 * Garante que o usuário existe na tabela public.users
 * Útil para situações onde o trigger pode ter falhado
 */
export async function ensureUserExists(userId: string, retries = 3): Promise<boolean> {
  if (!userId) return false;

  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error(`Tentativa ${i + 1}/${retries} - Erro ao verificar usuário:`, error);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
          continue;
        }
        return false;
      }

      if (data) {
        return true;
      }

      // Usuário não existe, aguardar um pouco mais (trigger pode estar executando)
      if (i < retries - 1) {
        console.log(`Tentativa ${i + 1}/${retries} - Usuário ainda não existe, aguardando...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    } catch (error) {
      console.error(`Erro inesperado ao verificar usuário:`, error);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
      }
    }
  }

  console.error('❌ Usuário não encontrado após todas as tentativas');
  return false;
}

/**
 * Aguarda até que o usuário esteja disponível no banco
 */
export async function waitForUser(userId: string, maxWaitMs = 5000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    const exists = await ensureUserExists(userId, 1);
    if (exists) return true;
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return false;
}
