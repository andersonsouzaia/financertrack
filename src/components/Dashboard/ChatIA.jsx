import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { classifyTransaction } from '@/lib/openai';
import { useToast } from '@/hooks/use-toast';
import { ensureMonthExists } from '@/lib/monthHelper';

export function ChatIA() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! 👋 Eu sou o assistente financeiro. Descreva seus gastos e eu ajudo a registrá-los!', timestamp: new Date().toISOString() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [chatSessionId, setChatSessionId] = useState(null);
  const scrollRef = useRef(null);

  // Carregar histórico anterior
  useEffect(() => {
    if (!user) return;

    const loadChatHistory = async () => {
      try {
        const { data } = await supabase
          .from('chat_historico_completo')
          .select('*')
          .eq('user_id', user.id)
          .order('data_criacao', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setChatSessionId(data.id);
          if (data.mensagens && data.mensagens.length > 0) {
            setMessages(data.mensagens);
          }
        }
      } catch (error) {
        console.log('Sem histórico anterior');
      }
    };

    loadChatHistory();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveChatToDatabase = async (userMsg, assistantResponse) => {
    if (!user) return;

    try {
      const newMessages = [...messages, userMsg, assistantResponse];

      if (chatSessionId) {
        await supabase
          .from('chat_historico_completo')
          .update({
            mensagens: newMessages,
            data_atualizacao: new Date().toISOString()
          })
          .eq('id', chatSessionId);
      } else {
        const { data, error } = await supabase
          .from('chat_historico_completo')
          .insert({
            user_id: user.id,
            topico: 'transacao',
            mensagens: newMessages
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setChatSessionId(data.id);
      }
    } catch (error) {
      console.error('Erro ao salvar chat:', error);
    }
  };

  const handleConfirmTransaction = async () => {
    if (!pendingTransaction || !user) return;

    try {
      const today = new Date();
      const day = today.getDate();

      // Garantir que o mês existe
      const { month: monthData } = await ensureMonthExists(user.id);

      // Get category ID
      const { data: category, error: catError } = await supabase
        .from('categorias_saidas')
        .select('id')
        .eq('user_id', user.id)
        .eq('nome', pendingTransaction.categoria)
        .maybeSingle();

      if (catError) throw catError;

      // Se categoria não existe, criar
      let categoryId = category?.id;
      if (!categoryId) {
        const { data: newCat, error: createCatError } = await supabase
          .from('categorias_saidas')
          .insert({
            user_id: user.id,
            nome: pendingTransaction.categoria,
            icone: '📌',
            cor: '#3b82f6',
            tipo: 'variavel',
            padrao: false
          })
          .select()
          .single();

        if (createCatError) throw createCatError;
        categoryId = newCat.id;
      }

      // Get primary account
      const { data: contaData, error: contaError } = await supabase
        .from('bancos_contas')
        .select('id, saldo_atual')
        .eq('user_id', user.id)
        .eq('principal', true)
        .maybeSingle();

      if (contaError) throw contaError;
      if (!contaData) throw new Error('Conta principal não encontrada');

      // Insert transaction
      const { data: transData, error: transError } = await supabase
        .from('transacoes')
        .insert({
          user_id: user.id,
          mes_financeiro_id: monthData.id,
          categoria_id: categoryId,
          banco_conta_id: contaData.id,
          tipo: pendingTransaction.tipo,
          valor_original: pendingTransaction.valor,
          moeda_original: 'BRL',
          descricao: pendingTransaction.descricao,
          dia: day,
          editado_manualmente: false
        })
        .select()
        .single();

      if (transError) throw transError;

      // Update account balance
      const novoSaldo = contaData.saldo_atual - (
        pendingTransaction.tipo === 'entrada' ? -pendingTransaction.valor : pendingTransaction.valor
      );

      await supabase
        .from('bancos_contas')
        .update({ saldo_atual: novoSaldo })
        .eq('id', contaData.id);

      // Insert observation
      if (transData) {
        await supabase
          .from('observacoes_gastos')
          .insert({
            transacao_id: transData.id,
            contexto: 'social',
            sentimento: 'neutro'
          });
      }

      const successMsg = {
        role: 'assistant',
        type: 'success',
        content: `✅ Transação registrada! R$ ${pendingTransaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${pendingTransaction.categoria}`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, successMsg]);

      // Update chat history with confirmed transaction
      const updatedMessages = messages.map(msg => {
        if (msg.type === 'confirmation' && msg.pendingData?.valor === pendingTransaction.valor) {
          return {
            ...msg,
            confirmed: true,
            confirmTime: new Date().toISOString()
          };
        }
        return msg;
      });

      if (chatSessionId) {
        await supabase
          .from('chat_historico_completo')
          .update({ mensagens: [...updatedMessages, successMsg] })
          .eq('id', chatSessionId);
      }

      toast({
        title: "Transação registrada!",
        description: `R$ ${pendingTransaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} adicionado`
      });

      setPendingTransaction(null);
    } catch (error) {
      console.error('Error confirming transaction:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível registrar a transação"
      });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { 
      role: 'user', 
      content: input,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await classifyTransaction(input);

      let assistantResponse = {
        role: 'assistant',
        timestamp: new Date().toISOString()
      };

      if (response.tipo && response.valor) {
        setPendingTransaction(response);
        assistantResponse = {
          ...assistantResponse,
          type: 'confirmation',
          content: response.confirmacao || `Entendi! Você quer registrar R$ ${response.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${response.categoria}?`,
          pendingData: response
        };
      } else {
        assistantResponse = {
          ...assistantResponse,
          type: 'message',
          content: response.message || 'Desculpe, não entendi muito bem.'
        };
      }

      setMessages(prev => [...prev, assistantResponse]);
      await saveChatToDatabase(userMsg, assistantResponse);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMsg = {
        role: 'assistant',
        type: 'error',
        content: 'Desculpe, houve um erro. Tente novamente.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💬 Assistente Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col h-96">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : msg.type === 'success'
                    ? 'bg-success/20 text-success'
                    : msg.type === 'error'
                    ? 'bg-danger/20 text-danger'
                    : 'bg-muted text-foreground'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                  {msg.type === 'confirmation' && pendingTransaction && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={handleConfirmTransaction}>
                        ✓ Sim
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setPendingTransaction(null);
                          setMessages(prev => [...prev, {
                            role: 'assistant',
                            type: 'message',
                            content: 'Ok, cancelado. Descreva novamente se preferir.',
                            timestamp: new Date().toISOString()
                          }]);
                        }}
                      >
                        ✗ Não
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted px-4 py-2 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              type="text"
              placeholder="Ex: Gastei R$45 em comida"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" disabled={loading}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
