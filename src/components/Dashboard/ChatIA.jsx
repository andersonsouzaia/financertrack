import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { classifyTransaction } from '@/lib/claude';
import { useToast } from '@/hooks/use-toast';

export function ChatIA() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! 👋 Eu sou o assistente financeiro. Descreva seus gastos e eu ajudo a registrá-los!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleConfirmTransaction = async () => {
    if (!pendingTransaction || !user) return;

    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      // Get current month
      const { data: monthData } = await supabase
        .from('meses_financeiros')
        .select('id')
        .eq('user_id', user.id)
        .eq('mes', month)
        .eq('ano', year)
        .single();

      if (!monthData) {
        throw new Error('Mês financeiro não encontrado');
      }

      // Get category ID
      const { data: category } = await supabase
        .from('categorias_saidas')
        .select('id')
        .eq('user_id', user.id)
        .eq('nome', pendingTransaction.categoria)
        .single();

      // Insert transaction
      await supabase
        .from('transacoes')
        .insert({
          user_id: user.id,
          mes_financeiro_id: monthData.id,
          categoria_id: category?.id,
          tipo: pendingTransaction.tipo,
          valor_original: pendingTransaction.valor,
          moeda_original: 'BRL',
          descricao: pendingTransaction.descricao,
          dia: day
        });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '✅ Transação registrada com sucesso!'
      }]);

      toast({
        title: "Sucesso!",
        description: "Transação registrada"
      });

      setPendingTransaction(null);
    } catch (error) {
      console.error('Error confirming transaction:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível registrar a transação"
      });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await classifyTransaction(input);

      if (response.tipo && response.valor) {
        setPendingTransaction(response);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.confirmacao || `Confirmar: ${response.tipo} de R$${response.valor} em ${response.categoria}?`,
          type: 'confirmation'
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.message || 'Não entendi. Pode reformular?'
        }]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, houve um erro. Tente novamente.'
      }]);
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
                    : 'bg-muted text-foreground'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                  {msg.type === 'confirmation' && pendingTransaction && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={handleConfirmTransaction}>
                        Sim
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setPendingTransaction(null)}>
                        Não
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
