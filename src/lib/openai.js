import { supabase } from '@/integrations/supabase/client';

/**
 * Classifica uma transação usando a API da OpenAI através de uma Edge Function segura.
 * A chave da API fica protegida no backend e nunca é exposta ao frontend.
 * 
 * @param {string} userInput - Texto do usuário descrevendo a transação
 * @returns {Promise<Object>} Objeto com tipo, categoria, valor e confirmação
 */
export async function classifyTransaction(userInput) {
  try {
    console.log('Enviando para classificação:', userInput);

    const { data, error } = await supabase.functions.invoke('classify-transaction', {
      body: { userInput }
    });

    if (error) {
      console.error('Erro na edge function:', error);
      throw error;
    }

    console.log('Resposta recebida:', data);

    // Se a resposta já é um objeto, retornar direto
    if (typeof data === 'object' && data !== null) {
      return data;
    }

    // Se for string JSON, fazer parse
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta:', parseError);
        return { 
          type: 'message', 
          message: data 
        };
      }
    }

    // Fallback
    return { 
      type: 'message', 
      message: 'Resposta inválida do servidor' 
    };

  } catch (error) {
    // Silenciar erros de "PRO FEATURE ONLY" ou Edge Function não disponível
    const isProFeatureError = error?.status === 400 && (error?.response === 'PRO FEATURE ONLY' || error?.message?.includes('PRO FEATURE'));
    const isFetchError = error.name === 'FunctionsFetchError' || error.message?.includes('fetch') || error.message?.includes('Failed to fetch');
    
    if (!isProFeatureError && !isFetchError) {
      console.error('Erro ao classificar transação:', error);
    }
    
    // Tratamento específico de erros
    if (isFetchError || isProFeatureError) {
      throw new Error('Serviço de classificação temporariamente indisponível. Você pode criar transações manualmente.');
    }
    
    throw new Error(error.message || 'Erro ao processar sua solicitação');
  }
}
