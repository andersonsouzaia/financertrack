import { supabase } from '@/integrations/supabase/client';

/**
 * Classifica uma transação usando a API da OpenAI através de uma Edge Function segura.
 * A chave da API fica protegida no backend e nunca é exposta ao frontend.
 * 
 * @param {string} userInput - Texto do usuário descrevendo a transação
 * @returns {Promise<Object>} Objeto com tipo, categoria, valor e confirmação
 */
const SYSTEM_PROMPT = `Você é o FinanceTrack IA, um assistente financeiro amigável para um app de finanças pessoais no Brasil.

Suas tarefas:
1. Classificar transações a partir de linguagem natural em português
2. Extrair: tipo (entrada/saida_fixa/diario), categoria, valor
3. Ser conversacional e prestativo
4. Sugerir melhorias de forma gentil

Formato de resposta para transações (JSON):
{
  "tipo": "diario|saida_fixa|entrada",
  "categoria": "Alimentação|Transporte|Moradia|Diversão|Saúde/Beleza|Roupas/Acessórios|Educação|Setup/Equipamentos|Assinaturas|Outro",
  "valor": number,
  "descricao": "descrição extraída",
  "confianca": 0-100,
  "confirmacao": "Você quer registrar R$X em [categoria]?"
}

Para perguntas gerais, responda com:
{
  "type": "message",
  "message": "sua resposta"
}

Sempre responda em Português (BR).`;

export async function classifyTransaction(userInput) {
  try {
    console.log('Iniciando classificação de transação...');

    // 1. Tentar buscar a chave do usuário no banco
    const { data: { user } } = await supabase.auth.getUser();
    let userApiKey = null;

    if (user) {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('openai_api_key')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settings?.openai_api_key) {
        userApiKey = settings.openai_api_key;
        console.log('Usando chave de API do usuário (DB).');
      }
    }

    // Fallback para variável de ambiente (desenvolvimento local)
    if (!userApiKey && import.meta.env.VITE_OPENAI_API_KEY) {
      userApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      console.log('Usando chave de API do ambiente (local).');
    }

    // 2. Se tiver chave do usuário, chamar OpenAI diretamente (Client-side)
    if (userApiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userInput }
          ],
          temperature: 0.7,
          max_tokens: 500,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na API da OpenAI (Client-side):', response.status, errorText);
        throw new Error(`Erro na API personalizada: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      console.log('Resposta OpenAI (Client-side):', content);

      try {
        return JSON.parse(content);
      } catch (e) {
        console.error('Erro ao fazer parse do JSON OpenAI:', e);
        return { type: 'message', message: content };
      }
    }

    // 3. Fallback: Chamar Edge Function (Chave do servidor)
    console.log('Usando Edge Function (Chave do sistema)...');
    const { data, error } = await supabase.functions.invoke('classify-transaction', {
      body: { userInput }
    });

    if (error) {
      console.error('Erro na edge function:', error);
      throw error;
    }

    console.log('Resposta Edge Function:', data);

    if (typeof data === 'object' && data !== null) {
      return data;
    }

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
      // Se o erro foi na Edge Function e não temos chave de usuário, avisar
      if (!userApiKey) {
        throw new Error('Serviço de IA indisponível. Adicione sua chave OpenAI nas Configurações para continuar usando.');
      }
      throw new Error('Serviço de classificação temporariamente indisponível. Você pode criar transações manualmente.');
    }

    throw new Error(error.message || 'Erro ao processar sua solicitação');
  }
}
