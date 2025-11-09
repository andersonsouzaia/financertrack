import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Você é o FinanceTrack IA, um assistente financeiro amigável para um app de finanças pessoais no Brasil.

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userInput } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    console.log('Classificando transação:', userInput);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('Classificação bem-sucedida:', content);

    return new Response(content, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao classificar transação:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      type: 'message',
      message: 'Desculpe, houve um erro ao processar sua mensagem. Tente novamente.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
