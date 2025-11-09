import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ChatIA } from '@/components/Dashboard/ChatIA';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCcw, MessageSquarePlus } from 'lucide-react';

interface SessionSummary {
  id: string;
  titulo: string | null;
  data_atualizacao: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setLoadingSessions(true);
    try {
      const { data, error } = await supabase
        .from('chat_historico_completo')
        .select('id, titulo, data_atualizacao')
        .eq('user_id', user.id)
        .order('data_atualizacao', { ascending: false });

      if (error) throw error;
      setSessions(data || []);

      if (!activeSessionId && data && data.length > 0) {
        setActiveSessionId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoadingSessions(false);
      setRefreshing(false);
    }
  }, [user, activeSessionId]);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user, fetchSessions]);

  useEffect(() => {
    const state = location.state as { sessionId?: string } | null;
    if (state?.sessionId) {
      setActiveSessionId(state.sessionId);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  const handleSessionCreated = (session: SessionSummary) => {
    setSessions(prev => {
      const existing = prev.find(item => item.id === session.id);
      if (existing) {
        return prev.map(item => (item.id === session.id ? session : item));
      }
      return [session, ...prev];
    });
    setActiveSessionId(session.id);
  };

  const handleSessionTitleChange = (id: string, title: string) => {
    setSessions(prev =>
      prev.map(session =>
        session.id === id
          ? { ...session, titulo: title, data_atualizacao: new Date().toISOString() }
          : session
      )
    );
  };

  const handleStartNewConversation = () => {
    setActiveSessionId(null);
  };

  const handleRefreshSessions = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await fetchSessions();
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <AppLayout
      title="Central de Conversas"
      description="Gerencie todo o histórico das interações com o assistente financeiro."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
            Voltar ao dashboard
          </Button>
          <Button size="sm" onClick={handleStartNewConversation} className="gap-2">
            <MessageSquarePlus className="h-4 w-4" />
            Nova conversa
          </Button>
        </div>
      }
      contentClassName="flex h-full gap-6"
    >
      <aside className="w-full max-w-xs rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Histórico
            </p>
            <h2 className="text-lg font-semibold text-foreground">Conversas salvas</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefreshSessions}
            disabled={refreshing}
            className="h-8 w-8"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-14rem)] pr-2">
          {loadingSessions ? (
            <div className="flex items-center gap-2 rounded border border-dashed border-border p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando conversas...
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded border border-dashed border-border p-4 text-sm text-muted-foreground">
              Você ainda não possui conversas salvas. Inicie uma nova conversa no painel ao lado.
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <button
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                      isActive
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/60 hover:bg-muted'
                    }`}
                  >
                    <p className="line-clamp-2 text-sm font-semibold">
                      {session.titulo || 'Conversa sem título'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(session.data_atualizacao).toLocaleString('pt-BR')}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </aside>

      <section className="flex-1 overflow-hidden rounded-lg border border-border bg-card p-4">
        <Badge variant="outline" className="mb-3">
          Assistente financeiro
        </Badge>
        <ChatIA
          sessionId={activeSessionId}
          embedded={false}
          allowSessionReset
          onSessionCreated={handleSessionCreated}
          onSessionTitleChange={handleSessionTitleChange}
        />
      </section>
    </AppLayout>
  );
}

