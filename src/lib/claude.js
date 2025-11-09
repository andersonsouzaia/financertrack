import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true // Only for development
});

const systemPrompt = `You are FinanceTrack IA, a friendly financial assistant for a personal finance app in Brazil.

Your tasks:
1. Classify transactions from natural language in Portuguese
2. Extract: tipo (entrada/saida_fixa/diario), categoria, valor
3. Be conversational and helpful
4. Suggest improvements in a gentle way

Response format for transactions:
{
  "tipo": "diario|saida_fixa|entrada",
  "categoria": "Alimentação|Transporte|Moradia|Diversão|Saúde/Beleza|Roupas/Acessórios|Educação|Setup/Equipamentos|Assinaturas|Outro",
  "valor": number,
  "descricao": "extracted description",
  "confianca": 0-100,
  "confirmacao": "Você quer registrar R$X em [categoria]?"
}

For general questions, respond with:
{
  "type": "message",
  "message": "your response"
}

Always respond in Portuguese (BR).`;

export async function classifyTransaction(userInput) {
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: userInput
      }]
    });

    const content = response.content[0].text;
    
    try {
      return JSON.parse(content);
    } catch {
      return { type: 'message', message: content };
    }
  } catch (error) {
    console.error('Erro Claude API:', error);
    throw error;
  }
}
