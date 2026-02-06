import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Loader2,
  Trash2,
  Settings,
  ExternalLink,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { classifyTransaction } from '@/lib/openai';
import { useToast } from '@/hooks/use-toast';
import { ensureMonthExists, getMonthName } from '@/lib/monthHelper';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ProfileTab } from '@/components/Settings/ProfileTab';
import { FinancialTab } from '@/components/Settings/FinancialTab';
import { PreferencesTab } from '@/components/Settings/PreferencesTab';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content:
    'Olá! 👋 Eu sou o assistente financeiro. Descreva seus gastos e eu ajudo a registrá-los!',
  timestamp: new Date().toISOString(),
};

const deriveTitle = (messages) => {
  const firstUserMessage = messages.find((msg) => msg.role === 'user');
  if (!firstUserMessage) return 'Nova conversa';
  const cleaned = firstUserMessage.content.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Nova conversa';
  return cleaned.length > 48 ? `${cleaned.substring(0, 48)}…` : cleaned;
};

export function ChatIA({
  sessionId: externalSessionId = null,
  embedded = true,
  allowSessionReset = true,
  onSessionCreated,
  onSessionTitleChange,
  onRequestOpenChatPage,
}) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [pendingBulkImport, setPendingBulkImport] = useState(null);
  const [pendingBulkEdits, setPendingBulkEdits] = useState(new Map());
  const [pendingDeletion, setPendingDeletion] = useState(null);
  const [categoriesMap, setCategoriesMap] = useState(new Map());
  const [chatSessionId, setChatSessionId] = useState(externalSessionId);
  const [sessionTitle, setSessionTitle] = useState('Nova conversa');
  const [isRenaming, setIsRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState('Nova conversa');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = useRef(null);
  const sessionIdRef = useRef(externalSessionId);
  const sessionTitleRef = useRef('Nova conversa');
  const hasLoadedInitialSession = useRef(false);
  const categoriesMapRef = useRef(new Map());
  const supportsTituloRef = useRef(true);
  const tableAvailableRef = useRef(true); // Flag para verificar se a tabela está disponível
  const [supportsTitulo, setSupportsTitulo] = useState(true);

  // Função auxiliar para verificar se é erro "PRO FEATURE ONLY"
  const isProFeatureError = useCallback((error) => {
    if (!error) return false;
    
    // Verificar status primeiro (pode ser 400 ou 200)
    const status = error?.status;
    
    // Verificar response diretamente
    const response = error?.response;
    if (response === 'PRO FEATURE ONLY') {
      return true;
    }
    if (typeof response === 'string' && response.includes('PRO FEATURE')) {
      return true;
    }
    
    // Se status é 400 ou 200 e response contém "PRO FEATURE", é erro
    if ((status === 400 || status === 200) && response && typeof response === 'string' && response.includes('PRO FEATURE')) {
      return true;
    }
    
    // Verificar message
    const message = error?.message || '';
    if (message.includes('PRO FEATURE') || message.includes('PRO FEATURE ONLY')) {
      return true;
    }
    
    // Verificar se há dados no erro que indiquem "PRO FEATURE ONLY"
    try {
      const errorString = JSON.stringify(error);
      if (errorString.includes('PRO FEATURE')) {
        return true;
      }
    } catch (e) {
      // Ignorar erros de stringify
    }
    
    return false;
  }, []);
  const setSessionTitleState = useCallback((title) => {
    const finalTitle = title || 'Nova conversa';
    setSessionTitle(finalTitle);
    setTitleDraft(finalTitle);
    sessionTitleRef.current = finalTitle;
  }, []);
  useEffect(() => {
    const loadLatestSession = async () => {
      if (!user || externalSessionId || hasLoadedInitialSession.current || !tableAvailableRef.current) return;
      hasLoadedInitialSession.current = true;
      try {
        setLoadingHistory(true);
        const selectColumns = supportsTituloRef.current ? 'id, mensagens, titulo' : 'id, mensagens';
        let { data, error } = await supabase
          .from('chat_historico_completo')
          .select(selectColumns)
          .eq('user_id', user.id)
          .order('data_atualizacao', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Verificar se é erro de "PRO FEATURE ONLY"
        if (isProFeatureError(error)) {
          tableAvailableRef.current = false;
          supportsTituloRef.current = false;
          setSupportsTitulo(false);
          setLoadingHistory(false);
          return; // Não tentar mais acessar a tabela
        }

        if ((error?.code === 'PGRST204' || error?.code === '42703' || error?.status === 400) && supportsTituloRef.current && !isProFeatureError(error)) {
          supportsTituloRef.current = false;
          setSupportsTitulo(false);
          ({ data, error } = await supabase
            .from('chat_historico_completo')
            .select('id, mensagens')
            .eq('user_id', user.id)
            .order('data_atualizacao', { ascending: false })
            .limit(1)
            .maybeSingle());
          
          // Verificar novamente se é "PRO FEATURE ONLY"
          if (isProFeatureError(error)) {
            tableAvailableRef.current = false;
            setLoadingHistory(false);
            return;
          }
        }

        if (error && !isProFeatureError(error) && error?.code !== 'PGRST204' && error?.code !== '42703' && error?.status !== 400) throw error;
        if (data?.id) {
          sessionIdRef.current = data.id;
          setChatSessionId(data.id);
          if (Array.isArray(data.mensagens) && data.mensagens.length > 0) {
            const trimmed = data.mensagens.slice(-20);
            setMessages(trimmed);
            const resolvedTitle =
              typeof data?.titulo === 'string' && data.titulo.trim()
                ? data.titulo
                : deriveTitle(trimmed);
            setSessionTitleState(resolvedTitle);
          }
        }
      } catch (error) {
        // Verificar se é erro de "PRO FEATURE ONLY"
        if (isProFeatureError(error)) {
          tableAvailableRef.current = false;
          supportsTituloRef.current = false;
          setSupportsTitulo(false);
        } else {
          console.error('Erro ao buscar última conversa:', error);
          tableAvailableRef.current = false;
        }
      } finally {
        setLoadingHistory(false);
      }
    };

    loadLatestSession();
  }, [user, externalSessionId]);


  const loadCategories = useCallback(async () => {
    if (!user) {
      categoriesMapRef.current = new Map();
      setCategoriesMap(new Map());
      return new Map();
    }

    try {
      const { data, error } = await supabase
        .from('categorias_saidas')
        .select('id, nome, icone, cor, tipo')
        .eq('user_id', user.id);

      // Verificar se é erro de "PRO FEATURE ONLY"
      if (isProFeatureError(error)) {
        // Se não houver categorias em cache, usar categorias padrão
        if (!categoriesMapRef.current || categoriesMapRef.current.size === 0) {
          const defaultCategories = new Map([
            ['alimentação', { nome: 'Alimentação', icone: '🍔', cor: '#ef4444', tipo: 'variavel' }],
            ['transporte', { nome: 'Transporte', icone: '🚗', cor: '#3b82f6', tipo: 'variavel' }],
            ['moradia', { nome: 'Moradia', icone: '🏠', cor: '#10b981', tipo: 'fixa' }],
            ['diversão', { nome: 'Diversão', icone: '🎮', cor: '#f59e0b', tipo: 'variavel' }],
            ['saúde/beleza', { nome: 'Saúde/Beleza', icone: '💊', cor: '#ec4899', tipo: 'variavel' }],
            ['outro', { nome: 'Outro', icone: '📌', cor: '#6b7280', tipo: 'variavel' }],
          ]);
          categoriesMapRef.current = defaultCategories;
          setCategoriesMap(defaultCategories);
          return defaultCategories;
        }
        return categoriesMapRef.current;
      }

      if (error) throw error;

      const map = new Map(
        (data || []).map((categoria) => [categoria.nome.toLowerCase(), categoria])
      );

      categoriesMapRef.current = map;
      setCategoriesMap(map);
      return map;
    } catch (error) {
      // Silenciar erros de "PRO FEATURE ONLY"
      if (!isProFeatureError(error)) {
        console.error('Erro ao carregar categorias:', error);
      }
      // Retornar cache se disponível, senão categorias padrão
      if (categoriesMapRef.current && categoriesMapRef.current.size > 0) {
        return categoriesMapRef.current;
      }
      const defaultCategories = new Map([
        ['alimentação', { nome: 'Alimentação', icone: '🍔', cor: '#ef4444', tipo: 'variavel' }],
        ['transporte', { nome: 'Transporte', icone: '🚗', cor: '#3b82f6', tipo: 'variavel' }],
        ['moradia', { nome: 'Moradia', icone: '🏠', cor: '#10b981', tipo: 'fixa' }],
        ['diversão', { nome: 'Diversão', icone: '🎮', cor: '#f59e0b', tipo: 'variavel' }],
        ['saúde/beleza', { nome: 'Saúde/Beleza', icone: '💊', cor: '#ec4899', tipo: 'variavel' }],
        ['outro', { nome: 'Outro', icone: '📌', cor: '#6b7280', tipo: 'variavel' }],
      ]);
      categoriesMapRef.current = defaultCategories;
      setCategoriesMap(defaultCategories);
      return defaultCategories;
      }
  }, [user?.id]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const getCategoriesMap = useCallback(async () => {
    if (!categoriesMapRef.current || categoriesMapRef.current.size === 0) {
      return loadCategories();
    }
    return new Map(categoriesMapRef.current);
  }, [loadCategories]);


  useEffect(() => {
    sessionIdRef.current = externalSessionId;
    setChatSessionId(externalSessionId);
  }, [externalSessionId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const loadHistory = async () => {
    if (!user || !tableAvailableRef.current) return;
      const sessionToLoad = sessionIdRef.current;
      if (!sessionToLoad) {
        setMessages([INITIAL_MESSAGE]);
        setSessionTitleState('Nova conversa');
        setPendingTransaction(null);
        setPendingBulkImport(null);
        setPendingDeletion(null);
        return;
      }

      setLoadingHistory(true);
      try {
        const selectColumns = supportsTituloRef.current ? 'mensagens, titulo' : 'mensagens';
        let { data, error } = await supabase
          .from('chat_historico_completo')
          .select(selectColumns)
          .eq('id', sessionToLoad)
          .eq('user_id', user.id)
          .maybeSingle();

        // Verificar se é erro de "PRO FEATURE ONLY"
        if (isProFeatureError(error)) {
          tableAvailableRef.current = false;
          supportsTituloRef.current = false;
          setSupportsTitulo(false);
          setMessages([INITIAL_MESSAGE]);
          setSessionTitleState('Nova conversa');
          setLoadingHistory(false);
          return;
        }

        if ((error?.code === 'PGRST204' || error?.code === '42703') && supportsTituloRef.current && !isProFeatureError(error)) {
          supportsTituloRef.current = false;
          setSupportsTitulo(false);
          ({ data, error } = await supabase
            .from('chat_historico_completo')
            .select('mensagens')
            .eq('id', sessionToLoad)
            .eq('user_id', user.id)
            .maybeSingle());
          
          // Verificar novamente se é "PRO FEATURE ONLY"
          if (isProFeatureError(error)) {
            tableAvailableRef.current = false;
            setMessages([INITIAL_MESSAGE]);
            setSessionTitleState('Nova conversa');
            setLoadingHistory(false);
            return;
          }
        }

        if (error && !isProFeatureError(error)) throw error;
        if (Array.isArray(data?.mensagens) && data.mensagens.length) {
          const trimmed = data.mensagens.slice(-20);
          setMessages(trimmed);
          const resolvedTitle =
            typeof data?.titulo === 'string' && data.titulo.trim()
              ? data.titulo
              : deriveTitle(trimmed);
          setSessionTitleState(resolvedTitle);
        } else {
          setMessages([INITIAL_MESSAGE]);
          setSessionTitleState('Nova conversa');
      }
    } catch (error) {
        // Verificar se é erro de "PRO FEATURE ONLY"
        if (isProFeatureError(error)) {
          tableAvailableRef.current = false;
          supportsTituloRef.current = false;
          setSupportsTitulo(false);
        } else {
          console.error('Erro ao carregar histórico do chat:', error);
        }
        setMessages([INITIAL_MESSAGE]);
        setSessionTitleState('Nova conversa');
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [user, chatSessionId, externalSessionId, setSessionTitleState]);

  const formatCurrency = (value) =>
    `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const normalizeNumber = (value) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const clean = value
      .toString()
      .replace(/[^\d,+-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const parsed = Number.parseFloat(clean);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const normalizeContent = (value) => {
    if (!value) return '';
    return value
      .replace(/\r/g, '\n')
      .replace(/[\u2028\u2029]/g, '\n')
      .replace(/\u00a0/g, ' ');
  };

  const applyTone = (message, tone = 'amigavel') => {
    const suffixByTone = {
      amigavel: ' Vamos seguir juntos nessa decisão, combinado? 😊',
      profissional: ' Recomendo registrar esse cenário no seu planejamento mensal antes de decidir.',
      direto: ' Ajuste o orçamento e confirme a compra apenas se ainda fizer sentido.',
      motivacional: ' Você está no comando: aproveite o insight e mantenha o foco nas metas!',
    };
    return `${message}${suffixByTone[tone] || ''}`;
  };

  const buildProfilesPerspective = (context) => {
    const {
      valor,
      saldoAtual,
      saldoProjetado,
      gastosAtuais,
      gastosProjetados,
      rendaMensal,
      percentualAtual,
      percentualProjetado,
      reservaAtual,
      reservaMeta,
      tipo,
      estiloUsuario,
    } = context;

    const formatPercent = (value) =>
      Number.isFinite(value) ? `${value.toFixed(1)}%` : 'sem referência';

    const reserveGap = reservaMeta ? reservaMeta - reservaAtual : null;
    const profiles = [
      {
        id: 'conservador',
        titulo: 'Visão conservadora',
        mensagem: () => {
          if (tipo === 'entrada') {
            const gapMessage =
              reserveGap !== null && reserveGap > 0
                ? `Use parte dessa entrada para aproximar sua reserva da meta (faltam ${formatCurrency(
                    reserveGap
                  )}).`
                : 'Sua reserva segue alinhada — aproveite para reforçar investimentos de baixo risco.';
            return `${gapMessage} O saldo subiria para ${formatCurrency(
              saldoProjetado
            )} e as despesas ficariam em ${formatCurrency(
              gastosProjetados
            )} (${formatPercent(percentualProjetado)} da renda).`;
          }

          const reserveWarning =
            reservaMeta && saldoProjetado < reservaMeta
              ? `Essa compra deixaria seu saldo (${formatCurrency(
                  saldoProjetado
                )}) abaixo da meta da reserva (${formatCurrency(reservaMeta)}).`
              : 'A reserva permanece dentro da meta após o gasto.';
          return `${reserveWarning} As despesas mensais seriam ${formatCurrency(
            gastosProjetados
          )}, comprometendo ${formatPercent(percentualProjetado)} da renda.`;
        },
      },
      {
        id: 'balanceado',
        titulo: 'Visão balanceada',
        mensagem: () => {
          if (tipo === 'entrada') {
            return `O saldo mensal saltaria para ${formatCurrency(
              saldoProjetado
            )}, abrindo espaço para metas de médio prazo. Considere destinar uma parte para prioridades já definidas.`;
          }
          const alert =
            percentualProjetado > 80
              ? 'Esse gasto leva as despesas acima do limite confortável de 80% da renda.'
              : 'O orçamento ainda permanece sob controle.';
          return `${alert} Saldo após o gasto: ${formatCurrency(
            saldoProjetado
          )}. Reserve parte do caixa para compromissos do fim do mês.`;
        },
      },
      {
        id: 'agressivo',
        titulo: 'Visão agressiva',
        mensagem: () => {
          if (tipo === 'entrada') {
            return `Entrada recebida! O saldo iria para ${formatCurrency(
              saldoProjetado
            )}. Avalie aumentar alocações de maior retorno conforme seus objetivos.`;
          }
          const warning =
            saldoProjetado < 0
              ? 'Atenção: o saldo ficaria negativo — seria necessário cobrir com crédito ou outra fonte.'
              : 'O caixa continua positivo; monitore apenas se surgirem novas oportunidades de investimento.';
          return `${warning} Despesas projetadas: ${formatCurrency(
            gastosProjetados
          )} (${formatPercent(percentualProjetado)} da renda).`;
        },
      },
    ];

    const activeProfile = estiloUsuario || 'balanceado';

    return profiles
      .map((profile) => {
        const prefix = profile.id === activeProfile ? '⭐ ' : '';
        return `${prefix}${profile.titulo}:\n${profile.mensagem()}`;
      })
      .join('\n\n');
  };

  const isBulkFinancialLog = (content) => {
    if (!content) return false;
    const sanitized = normalizeContent(content);
    const lower = sanitized.toLowerCase();
    const lines = sanitized
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const hasSaldoInicial = lower.includes('saldo inicial');
    const hasSaldoFinalOuAtual = lower.includes('saldo final') || lower.includes('saldo atual');
    const hasResumoDiario = lower.includes('saidas do dia') || lower.includes('entradas do dia');
    const hasMarcadores = lower.includes('✅') || lower.includes('cartão') || lower.includes('pix');
    const linhasNumericas = lines.filter((line) => /\d/.test(line)).length;

    if (!hasSaldoInicial) return false;

    const possuiIndicadoresComplementares =
      hasSaldoFinalOuAtual || hasResumoDiario || hasMarcadores || linhasNumericas >= 6;

    return possuiIndicadoresComplementares;
  };

  const monthNameToNumber = (name) => {
    const normalized = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    const map = {
      janeiro: 1,
      fevereiro: 2,
      marco: 3,
      abril: 4,
      maio: 5,
      junho: 6,
      julho: 7,
      agosto: 8,
      setembro: 9,
      outubro: 10,
      novembro: 11,
      dezembro: 12,
    };

    return map[normalized] || null;
  };

  const parseDeleteMonthCommand = (content) => {
    if (!content) return null;
    const sanitized = normalizeContent(content).toLowerCase();

    if (!sanitized.includes('apague') && !sanitized.includes('apagar')) return null;
    if (!(sanitized.includes('registros') || sanitized.includes('transacoes'))) return null;

    const monthMatch = sanitized.match(
      /(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/
    );

    let monthNumber = null;
    if (monthMatch) {
      monthNumber = monthNameToNumber(monthMatch[0]);
    } else {
      const numMatch = sanitized.match(/mes\s+(\d{1,2})/);
      if (numMatch) {
        const num = Number.parseInt(numMatch[1], 10);
        if (num >= 1 && num <= 12) {
          monthNumber = num;
        }
      }
    }

    if (!monthNumber) return null;

    const yearMatch = sanitized.match(/20\d{2}/);
    const currentYear = new Date().getFullYear();
    const year = yearMatch ? Number.parseInt(yearMatch[0], 10) : currentYear;

    return { month: monthNumber, year };
  };

  const extractAmounts = (segment) => {
    const matches = segment.match(/[+-]?\d{1,3}(?:\.\d{3})*,\d{2}|[+-]?\d+(?:,\d{2})?/g);
    if (!matches) return [];
    return matches
      .map((raw) => normalizeNumber(raw))
      .filter((value) => Number.isFinite(value) && Math.abs(value) > 0);
  };

  const inferTransactionType = (description) => {
    const lower = description.toLowerCase();
    const incomeKeywords = [
      'receb',
      'entrada',
      'bonus',
      'salário',
      'credito',
      'pix crédito',
      'pix credito',
      'transferência',
      'transferencia',
      'reembolso',
    ];
    return incomeKeywords.some((keyword) => lower.includes(keyword)) ? 'entrada' : 'saida_fixa';
  };

  const parseFinancialLog = (content) => {
    const sanitized = normalizeContent(content);

    const lines = sanitized
      .split('\n')
      .map((raw) => ({
        raw,
        indent: raw.match(/^\s+/)?.[0]?.length || 0,
        text: raw.trim(),
      }))
      .filter((line) => line.text.length > 0);

    const result = {
      saldoInicial: null,
      saldoFinal: null,
      transacoes: [],
    };

    let currentParent = null;

    for (let i = 0; i < lines.length; i++) {
      const { text, indent } = lines[i];
      const lower = text.toLowerCase();

      if (lower.startsWith('saldo inicial')) {
        const amounts = extractAmounts(text);
        if (amounts.length > 0) {
          result.saldoInicial = amounts[0];
        }
        continue;
      }

      if (lower.startsWith('saldo atual') || lower.startsWith('saldo final')) {
        const amounts = extractAmounts(text);
        if (amounts.length > 0) {
          result.saldoFinal = amounts[0];
        }
        continue;
      }

      const colonIndex = text.indexOf(':');
      let description = colonIndex >= 0 ? text.slice(0, colonIndex).trim() : text;
      const amountSegment = colonIndex >= 0 ? text.slice(colonIndex + 1) : text;
      const amounts = extractAmounts(amountSegment);
      if (amounts.length === 0) continue;

      const nextIndent = lines[i + 1]?.indent ?? 0;
      const hasChildren = nextIndent > indent;

      if (indent === 0) {
        currentParent = hasChildren ? description : null;
      }

      if (hasChildren) {
        continue;
      }

      const finalDescription =
        indent > 0 && currentParent
          ? `${currentParent} · ${description.trim().replace(/✅/g, '')}`
          : description.trim().replace(/✅/g, '');

      amounts.forEach((value, index) => {
        const isMultiple = amounts.length > 1;
        const entryDescription = isMultiple ? `${finalDescription} #${index + 1}` : finalDescription;
        result.transacoes.push({
          descricao: entryDescription,
          valor: value,
          tipo: inferTransactionType(entryDescription),
        });
      });
    }

    return result;
  };

  const fetchFinancialSnapshot = async () => {
    if (!user) return null;

    try {
      const { month } = await ensureMonthExists(user.id);

      const [accountsRes, configRes, transactionsRes] = await Promise.all([
        supabase
          .from('bancos_contas')
          .select('saldo_atual')
          .eq('user_id', user.id),
        supabase
          .from('configuracao_usuario')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
        .from('transacoes')
          .select('tipo, valor_original')
        .eq('mes_financeiro_id', month.id)
          .eq('deletado', false),
      ]);

      const saldoAtual =
        accountsRes.data?.reduce((sum, conta) => sum + Number(conta.saldo_atual || 0), 0) || 0;
      const rendaMensal = Number(configRes.data?.renda_mensal || 0);

      let totalEntradas = 0;
      let totalSaidas = 0;
      let totalDiario = 0;

      transactionsRes.data?.forEach((transacao) => {
          const valor = Number(transacao.valor_original || 0);
        if (transacao.tipo === 'entrada') {
          totalEntradas += valor;
        } else if (transacao.tipo === 'saida_fixa') {
          totalSaidas += valor;
        } else if (transacao.tipo === 'diario') {
          totalDiario += valor;
        }
      });

      return {
        monthId: month.id,
        saldoAtual,
        rendaMensal,
        totalEntradas,
        totalSaidas,
        totalDiario,
        toneIa: configRes.data?.tone_ia || 'amigavel',
        estiloUsuario: configRes.data?.estilo_usuario || 'balanceado',
        agressividadeSugestoes: configRes.data?.agressividade_sugestoes || 5,
        reservaMeta: Number(configRes.data?.reserva_emergencia_meta || 0),
        reservaAtual: Number(configRes.data?.reserva_emergencia_atual || 0),
      };
    } catch (error) {
      console.error('Erro ao obter panorama financeiro:', error);
      return null;
    }
  };

  const buildAdviceMessage = (transactionIntent, snapshot) => {
    const valor = Math.abs(Number(transactionIntent.valor || 0));
    const tipo = transactionIntent.tipo;
    const categoria = transactionIntent.categoria || 'Categoria';

    if (!snapshot) {
      return applyTone(
        `Você quer registrar ${formatCurrency(valor)} em ${categoria}. Não consegui acessar seus dados agora, mas posso lançar mesmo assim. Confirmo?`
      );
    }

    const {
      rendaMensal,
      saldoAtual,
      totalDiario,
      totalSaidas,
      toneIa,
      estiloUsuario,
      agressividadeSugestoes,
      reservaMeta,
      reservaAtual,
    } = snapshot;

    const gastosAtuais = totalSaidas + totalDiario;
    const deltaSaldo = tipo === 'entrada' ? valor : -valor;
    const saldoProjetado = saldoAtual + deltaSaldo;

    let gastosProjetados = gastosAtuais;
    if (tipo !== 'entrada') {
      gastosProjetados += valor;
    }

    const percentualAtual =
      rendaMensal > 0 ? Number((gastosAtuais / rendaMensal) * 100) : null;
    const percentualProjetado =
      rendaMensal > 0 ? Number((gastosProjetados / rendaMensal) * 100) : null;

    const resumoAtual = [
      `• Saldo estimado: ${formatCurrency(saldoAtual)}`,
      `• Despesas do mês: ${formatCurrency(gastosAtuais)}${
        percentualAtual !== null ? ` (${percentualAtual.toFixed(1)}% da renda)` : ''
      }`,
      reservaMeta > 0
        ? `• Reserva de emergência: ${formatCurrency(reservaAtual)} de ${formatCurrency(
            reservaMeta
          )}`
          : null,
    ]
      .filter(Boolean)
      .join('\n');

    const resumoDepois = [
      tipo === 'entrada'
        ? `Saldo após a entrada: ${formatCurrency(saldoProjetado)}`
        : `Saldo após a despesa: ${formatCurrency(saldoProjetado)}`,
      tipo === 'entrada'
        ? null
        : `Despesas projetadas: ${formatCurrency(gastosProjetados)}${
            percentualProjetado !== null ? ` (${percentualProjetado.toFixed(1)}% da renda)` : ''
          }`,
    ]
      .filter(Boolean)
      .join('\n');

    const agressividadeNota =
      agressividadeSugestoes >= 8
        ? 'Seu nível de alerta está alto; revise rapidamente se outros compromissos já estão cobertos antes de avançar.'
        : agressividadeSugestoes <= 3
        ? 'Seu nível de alerta está suave; ainda assim vale acompanhar o fluxo de caixa dos próximos dias.'
        : 'Ajuste equilibrado: acompanhe o orçamento para garantir que demais metas sigam no plano.';

    const profilesInsight = buildProfilesPerspective({
      valor,
      saldoAtual,
      saldoProjetado,
      gastosAtuais,
      gastosProjetados,
          rendaMensal,
      percentualAtual,
      percentualProjetado,
      reservaAtual,
      reservaMeta,
      tipo,
      estiloUsuario,
    });

    const header = `Entendi! Você está avaliando ${formatCurrency(valor)} em ${categoria} (${
      tipo === 'entrada' ? 'entrada' : 'despesa'
    }).`;

    const mensagem = `${header}

Resumo atual:
${resumoAtual}

Após essa movimentação:
${resumoDepois}

Perspectiva por perfil:
${profilesInsight}

${agressividadeNota}`;

    return applyTone(mensagem, toneIa);
  };

  const buildSuccessMessage = (transactionIntent) => {
    if (!transactionIntent?.snapshot) {
      return `✅ Transação registrada! R$ ${transactionIntent.valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
      })} em ${transactionIntent.categoria}`;
    }

    const snapshot = transactionIntent.snapshot;
    const valor = Number(transactionIntent.valor || 0);
    const tipo = transactionIntent.tipo;

    const deltaSaldo = tipo === 'entrada' ? valor : -valor;
    const saldoAtualizado = snapshot.saldoAtual + deltaSaldo;

    let totalEntradas = snapshot.totalEntradas;
    let totalSaidas = snapshot.totalSaidas;
    let totalDiario = snapshot.totalDiario;

    if (tipo === 'entrada') {
      totalEntradas += valor;
    } else if (tipo === 'saida_fixa') {
      totalSaidas += valor;
    } else if (tipo === 'diario') {
      totalDiario += valor;
    }

    const gastosAtualizados = totalSaidas + totalDiario;
    const percentualGastos = snapshot.rendaMensal > 0
      ? ((gastosAtualizados / snapshot.rendaMensal) * 100).toFixed(1)
      : null;

    const gastosMensagem =
      snapshot.rendaMensal > 0
        ? `Despesas do mês: ${formatCurrency(gastosAtualizados)} (${percentualGastos}% da renda).`
        : `Despesas do mês: ${formatCurrency(gastosAtualizados)}. Configure sua renda para acompanhar percentuais.`;

    return `✅ Transação registrada! Saldo estimado agora: ${formatCurrency(saldoAtualizado)}. ${gastosMensagem}`;
  };

  const prepareBulkFinancialLog = async (rawContent) => {
    if (!user) {
      throw new Error('Usuário não autenticado.');
    }

    const parsed = parseFinancialLog(rawContent);
    if (!parsed || parsed.transacoes.length === 0) {
      throw new Error('Não encontrei transações válidas na mensagem. Verifique o formato.');
    }

    const categoriasExistentesMap = await getCategoriesMap();
    const categoriasConhecidas = new Set(Array.from(categoriasExistentesMap.keys()));
    const categoriasDisponiveis = Array.from(categoriasExistentesMap.values()).map(
      (categoria) => categoria?.nome
    );
    const categoriasNovas = new Set();
    const preparedTransactions = [];

    for (const entry of parsed.transacoes) {
      const valorNumerico = Math.abs(Number(entry.valor) || 0);
      let tipo = entry.tipo;
      let categoriaNome = null;

      try {
        const classificationPrompt =
          tipo === 'entrada'
            ? `Recebi R$ ${valorNumerico.toFixed(2)} referente a ${entry.descricao}.`
            : `Gastei R$ ${valorNumerico.toFixed(2)} com ${entry.descricao}.`;
        const augmentedPrompt =
          categoriasDisponiveis.length > 0
            ? `${classificationPrompt}\n\nCategorias disponíveis: ${categoriasDisponiveis.join(
                ', '
              )}.`
            : classificationPrompt;

        const classification = await classifyTransaction(augmentedPrompt);

        if (classification?.tipo) {
          tipo = classification.tipo;
        }
        if (classification?.categoria) {
          categoriaNome = classification.categoria;
        }
      } catch (classificationError) {
        console.warn('Falha ao classificar transação via IA:', classificationError);
      }

      if (!categoriaNome) {
        categoriaNome = tipo === 'entrada' ? 'Receitas diversas' : 'Outros';
      }

      if (!categoriasConhecidas.has(categoriaNome.toLowerCase())) {
        categoriasNovas.add(categoriaNome);
      }

      preparedTransactions.push({
        descricao: entry.descricao,
        valor: valorNumerico,
        tipo,
        categoria: categoriaNome,
      });
    }

    const snapshot = await fetchFinancialSnapshot();

    return {
      id: Date.now(),
      parsed,
      preparedTransactions,
      snapshotAntes: snapshot,
      totalEntradas: preparedTransactions
        .filter((item) => item.tipo === 'entrada')
        .reduce((sum, item) => sum + Number(item.valor || 0), 0),
      totalSaidas: preparedTransactions
        .filter((item) => item.tipo !== 'entrada')
        .reduce((sum, item) => sum + Number(item.valor || 0), 0),
      categoriasNovas: Array.from(categoriasNovas),
      saldoInformado: parsed.saldoFinal,
    };
  };

  const commitBulkFinancialLog = async (bulkData, overrides = new Map()) => {
    if (!user) {
      throw new Error('Usuário não autenticado.');
    }

    const { preparedTransactions, parsed } = bulkData;

    const effectiveTransactions = [];

    preparedTransactions.forEach((item, index) => {
      const override = overrides.get(index);
      if (override?.['_removed']) return;

      const merged = {
        ...item,
        ...(override?.descricao !== undefined ? { descricao: override.descricao } : {}),
        ...(override?.valor !== undefined ? { valor: override.valor } : {}),
        ...(override?.tipo ? { tipo: override.tipo } : {}),
        ...(override?.categoria ? { categoria: override.categoria } : {}),
      };

      effectiveTransactions.push(merged);
    });

    overrides.forEach((value, key) => {
      const index = Number(key);
      if (!Number.isInteger(index) || index < preparedTransactions.length) return;

      if (value?._removed) return;

      effectiveTransactions.push({
        descricao: value.descricao ?? 'Nova transação',
        valor: Number.isFinite(value.valor) ? value.valor : 0,
        tipo: value.tipo || 'saida_fixa',
        categoria: value.categoria || 'Outro',
      });
    });

      const { month } = await ensureMonthExists(user.id);
    const mesId = month.id;

    let categoriaMap = await getCategoriesMap();

    const { data: contaPrincipal } = await supabase
      .from('bancos_contas')
      .select('id')
        .eq('user_id', user.id)
      .eq('principal', true)
      .maybeSingle();

    let contaId = contaPrincipal?.id;

    if (!contaId) {
      const { data: novaConta } = await supabase
        .from('bancos_contas')
        .insert({
          user_id: user.id,
          nome_banco: 'Conta Principal',
          tipo_conta: 'corrente',
          saldo_atual: 0,
          finalidade: 'gastos',
          principal: true,
        })
        .select()
        .single();

      contaId = novaConta?.id;
    }

    if (!contaId) {
      throw new Error('Não foi possível localizar ou criar uma conta principal para lançar as transações.');
    }

    const importedTransactions = [];
    const errors = [];

    for (const entry of effectiveTransactions) {
      const valor = Math.abs(Number(entry.valor) || 0);
      const tipo = entry.tipo;
      const descricao = entry.descricao;
      const categoriaNome = entry.categoria || (tipo === 'entrada' ? 'Receitas diversas' : 'Outros');
      const categoriaNomeLower = categoriaNome.toLowerCase();

      let categoriaEntry = categoriaMap.get(categoriaNomeLower);
      let categoriaId = categoriaEntry?.id;

      if (!categoriaId) {
        const { data: categoriaExistente, error: categoriaBuscaError } = await supabase
          .from('categorias_saidas')
          .select('id, nome, icone, cor, tipo, padrao')
          .eq('user_id', user.id)
          .eq('nome', categoriaNome)
          .maybeSingle();

        if (categoriaBuscaError) {
          errors.push({ descricao, motivo: categoriaBuscaError.message });
          continue;
        }

        if (categoriaExistente) {
          categoriaEntry = categoriaExistente;
          categoriaId = categoriaExistente.id;
          const updatedMap = new Map(categoriaMap);
          updatedMap.set(categoriaNomeLower, categoriaExistente);
          categoriaMap = updatedMap;
          categoriesMapRef.current = updatedMap;
          setCategoriesMap(updatedMap);
        }
      }

      if (!categoriaId) {
        const { data: novaCategoria, error: categoriaError } = await supabase
          .from('categorias_saidas')
          .insert({
            user_id: user.id,
            nome: categoriaNome,
            icone: '📌',
            cor: '#3b82f6',
            tipo: tipo === 'entrada' ? 'fixa' : 'variavel',
            padrao: false,
          })
          .select()
          .single();

        if (categoriaError) {
          errors.push({ descricao, motivo: categoriaError.message });
          continue;
        }

        if (novaCategoria) {
          categoriaEntry = novaCategoria;
          categoriaId = novaCategoria.id;
          const updatedMap = new Map(categoriaMap);
          updatedMap.set(categoriaNomeLower, novaCategoria);
          categoriaMap = updatedMap;
          categoriesMapRef.current = updatedMap;
          setCategoriesMap(updatedMap);
        }
      }

      try {
        await supabase
          .from('transacoes')
          .insert({
            user_id: user.id,
            mes_financeiro_id: mesId,
            categoria_id: categoriaId || null,
            banco_conta_id: contaId,
            tipo,
            descricao,
            valor_original: valor,
            moeda_original: 'BRL',
            dia: new Date().getDate(),
            editado_manualmente: false,
          });

        importedTransactions.push({
          descricao,
          valor,
          tipo,
          categoria: categoriaNome,
        });
      } catch (insertError) {
        console.error('Erro ao salvar transação em lote:', insertError);
        errors.push({ descricao, motivo: insertError.message });
      }
    }

    const snapshotDepois = await fetchFinancialSnapshot();

    return {
      importedTransactions,
      errors,
      snapshotDepois,
      saldoInformado: parsed.saldoFinal,
    };
  };

  const persistConversation = useCallback(
    async (messagesToPersist, options = {}) => {
      if (!user || !tableAvailableRef.current) return;
      if (!messagesToPersist.some((message) => message.role === 'user')) return;

      const currentSessionId = sessionIdRef.current;
      const generatedTitle =
        typeof options.title === 'function' ? options.title(messagesToPersist) : options.title;

      if (!currentSessionId) {
        const title = generatedTitle || deriveTitle(messagesToPersist);
        try {
          const timestamp = new Date().toISOString();
          const insertPayload = {
            user_id: user.id,
            topico: 'chat-dashboard',
            mensagens: messagesToPersist,
            data_atualizacao: timestamp,
          };
          if (supportsTituloRef.current) {
            insertPayload.titulo = title;
          }

          let query = supabase
            .from('chat_historico_completo')
            .insert(insertPayload)
            .select(
              supportsTituloRef.current ? 'id, titulo, data_atualizacao' : 'id, data_atualizacao'
            )
            .single();

          let { data, error } = await query;

          // Verificar se é erro de "PRO FEATURE ONLY"
          if (isProFeatureError(error)) {
            tableAvailableRef.current = false;
            supportsTituloRef.current = false;
            setSupportsTitulo(false);
            return; // Não tentar mais salvar
          }

          if ((error?.code === 'PGRST204' || error?.code === '42703') && supportsTituloRef.current) {
            supportsTituloRef.current = false;
            setSupportsTitulo(false);
            const fallbackPayload = { ...insertPayload };
            delete fallbackPayload.titulo;
            ({ data, error } = await supabase
              .from('chat_historico_completo')
              .insert(fallbackPayload)
              .select('id, data_atualizacao')
              .single());
            
            // Verificar novamente se é "PRO FEATURE ONLY"
            if (isProFeatureError(error)) {
              tableAvailableRef.current = false;
              return;
            }
          }

          if (error) throw error;

          sessionIdRef.current = data.id;
          setChatSessionId(data.id);
          const resolvedTitle =
            supportsTituloRef.current && data?.titulo ? data.titulo : title;
          setSessionTitleState(resolvedTitle);

          onSessionCreated?.({
            id: data.id,
            titulo: resolvedTitle,
            data_atualizacao: data?.data_atualizacao || timestamp,
          });
        } catch (error) {
          // Silenciar erros de "PRO FEATURE ONLY"
          if (!isProFeatureError(error)) {
            console.error('Erro ao criar conversa:', error);
          }
          tableAvailableRef.current = false;
        }
      } else {
        try {
          const timestamp = new Date().toISOString();
          const title =
            generatedTitle || sessionTitleRef.current || deriveTitle(messagesToPersist);

          const updatePayload = {
            mensagens: messagesToPersist,
            data_atualizacao: timestamp,
          };
          if (supportsTituloRef.current) {
            updatePayload.titulo = title;
          }

          let { error } = await supabase
            .from('chat_historico_completo')
            .update(updatePayload)
            .eq('id', currentSessionId);

          // Verificar se é erro de "PRO FEATURE ONLY"
          if (isProFeatureError(error)) {
            tableAvailableRef.current = false;
            supportsTituloRef.current = false;
            setSupportsTitulo(false);
            return; // Não tentar mais atualizar
          }

          if ((error?.code === 'PGRST204' || error?.code === '42703') && supportsTituloRef.current) {
            supportsTituloRef.current = false;
            setSupportsTitulo(false);
            const fallbackPayload = {
              mensagens: messagesToPersist,
              data_atualizacao: timestamp,
            };
            ({ error } = await supabase
              .from('chat_historico_completo')
              .update(fallbackPayload)
              .eq('id', currentSessionId));
            
            // Verificar novamente se é "PRO FEATURE ONLY"
            if (isProFeatureError(error)) {
              tableAvailableRef.current = false;
              return;
            }
          }

          if (error) throw error;

          if (title !== sessionTitleRef.current) {
            setSessionTitleState(title);
          }
          onSessionTitleChange?.(currentSessionId, title);
        } catch (error) {
          // Silenciar erros de "PRO FEATURE ONLY"
          if (!isProFeatureError(error)) {
            console.error('Erro ao atualizar conversa:', error);
          }
          tableAvailableRef.current = false;
        }
      }
    },
    [user, onSessionCreated, onSessionTitleChange, setSessionTitleState]
  );

  const updateMessages = useCallback(
    (producer, options = {}) => {
      setMessages((prev) => {
        const next = producer(prev);
        persistConversation(next, options);
        return next;
      });
    },
    [persistConversation]
  );

  const handleStartNewConversation = useCallback(() => {
    hasLoadedInitialSession.current = true;
    sessionIdRef.current = null;
    setChatSessionId(null);
    setSessionTitleState('Nova conversa');
    setMessages([INITIAL_MESSAGE]);
    setPendingTransaction(null);
    setPendingBulkImport(null);
    setPendingBulkEdits(new Map());
    setPendingDeletion(null);
    setIsRenaming(false);
  }, [setSessionTitleState]);

  const handleCancelPendingTransaction = useCallback(() => {
    if (!pendingTransaction) return;
    setPendingTransaction(null);
    updateMessages(
      (prev) => [
        ...prev,
        {
          role: 'assistant',
          type: 'message',
          content: 'Ok, cancelado. Descreva novamente se preferir.',
          timestamp: new Date().toISOString(),
        },
      ],
      { title: sessionIdRef.current ? undefined : deriveTitle }
    );
  }, [pendingTransaction, updateMessages]);

  const BulkPreviewEditor = ({
    resumo,
    transacoes,
    pendingEdits,
    setPendingEdits,
    onConfirm,
    onCancel,
    categoriesMap,
    loading,
    onCreateCategory,
  }) => {
    const { toast: toastBulk } = useToast();
    const handleUpdate = (index, field, value) => {
      setPendingEdits((prev) => {
        const next = new Map(prev);
        const base = index < transacoes.length ? transacoes[index] : null;
        const current = next.get(index) || (!base ? { _added: true } : {});
        let normalizedValue = value;
        if (field === 'valor') {
          const numeric = Number(value);
          normalizedValue = Number.isFinite(numeric) ? numeric : 0;
        }
        if (field === 'categoria') {
          normalizedValue = normalizedValue || (base?.categoria ?? 'Outro');
        }
        next.set(index, {
          ...current,
          [field]: normalizedValue,
        });
        return next;
      });
    };

    const handleRemove = (index) => {
      setPendingEdits((prev) => {
        const next = new Map(prev);
        const base = index < transacoes.length ? transacoes[index] : null;
        if (!base) {
          next.delete(index);
          return next;
        }
        next.set(index, { ...(next.get(index) || {}), _removed: true });
        return next;
      });
    };

    const handleRestore = (index) => {
      setPendingEdits((prev) => {
        const next = new Map(prev);
        const existing = next.get(index);
        if (existing) {
          const { _removed, ...rest } = existing;
          if (Object.keys(rest).length === 0) {
            next.delete(index);
          } else {
            next.set(index, rest);
          }
        }
        return next;
      });
    };

    const handleToggleTipo = (index, currentTipo) => {
      const nextTipo =
        currentTipo === 'entrada'
          ? 'saida_fixa'
          : currentTipo === 'diario'
          ? 'saida_fixa'
          : 'entrada';
      handleUpdate(index, 'tipo', nextTipo);
    };

    const allCategories = Array.from(categoriesMap.values()).map((cat) => cat?.nome).filter(Boolean);

    const combinedTransactions = [...transacoes];
    const additionalEntries = [];

    pendingEdits.forEach((value, key) => {
      const baseIndex = Number(key);
      if (Number.isInteger(baseIndex)) {
        if (baseIndex < combinedTransactions.length) {
          const base = combinedTransactions[baseIndex];
          const { _removed, _added, ...rest } = value;
          combinedTransactions[baseIndex] = {
            ...base,
            ...rest,
            index: baseIndex,
            removed: Boolean(_removed),
            added: Boolean(_added),
          };
        } else {
          const { _removed, _added, ...rest } = value;
          additionalEntries.push({
            descricao: rest.descricao ?? 'Nova transação',
            valor: Number.isFinite(rest.valor) ? rest.valor : 0,
            tipo: rest.tipo || 'saida_fixa',
            categoria: rest.categoria || 'Outro',
            index: baseIndex,
            removed: Boolean(_removed),
            added: true,
          });
        }
      }
    });

    const effectiveTransactions = [
      ...combinedTransactions.map((item, index) => {
        const original = transacoes[index];
        const override = pendingEdits.get(index);
        if (!override) {
      return {
            ...item,
            index,
            removed: false,
            added: false,
          };
        }
        const { _removed, _added, ...rest } = override;
        return {
          ...original,
          ...rest,
          index,
          removed: Boolean(_removed),
          added: Boolean(_added),
        };
      }),
      ...additionalEntries.sort((a, b) => a.index - b.index),
    ];

    const totais = effectiveTransactions.reduce(
      (acc, item) => {
        if (item.removed) return acc;
        const valorNumerico = Number(item.valor) || 0;
        if (item.tipo === 'entrada') {
          acc.entradas += valorNumerico;
        } else {
          acc.saidas += valorNumerico;
        }
        acc.total += valorNumerico;
        return acc;
      },
      { entradas: 0, saidas: 0, total: 0 }
    );

    const totalExibir = effectiveTransactions.filter((item) => !item.removed).length;
    const totalRemovidas = effectiveTransactions.length - totalExibir;

    const handleConfirmClick = () => {
      onConfirm();
    };

    const handleAddTransaction = () => {
      let nextIndex = transacoes.length;
      while (pendingEdits.has(nextIndex) || nextIndex < transacoes.length) {
        nextIndex += 1;
      }
      const novaTransacao = {
        descricao: 'Nova transação',
        valor: 0,
        tipo: 'saida_fixa',
        categoria: 'Outro',
        _added: true,
      };
      setPendingEdits((prev) => {
        const next = new Map(prev);
        next.set(nextIndex, novaTransacao);
        return next;
      });
    };

    const handleCategoriaChange = async (index, value) => {
      if (value === '__create__') {
        const nome = window.prompt('Nome da nova categoria:');
        if (!nome) return;
        try {
          const nova = await onCreateCategory(nome);
          if (nova?.nome) {
            handleUpdate(index, 'categoria', nova.nome);
          }
    } catch (error) {
          console.error('Erro ao criar categoria:', error);
          toastBulk({
            variant: 'destructive',
            title: 'Erro ao criar categoria',
            description: error.message || 'Não foi possível criar a categoria.',
          });
        }
        return;
      }
      handleUpdate(index, 'categoria', value);
    };

    return (
      <div className="mt-4 space-y-4">
        <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
          <p className="font-semibold text-foreground">Resumo da importação</p>
          <div className="mt-2 grid gap-y-1 sm:grid-cols-3">
            <span>Transações identificadas: {resumo.totalTransacoes}</span>
            <span>Entradas previstas: {formatCurrency(resumo.totalEntradas)}</span>
            <span>Saídas previstas: {formatCurrency(resumo.totalSaidas)}</span>
            <span>Entradas após ajustes: {formatCurrency(totais.entradas)}</span>
            <span>Saídas após ajustes: {formatCurrency(totais.saidas)}</span>
            {resumo.saldoSistema !== null && (
              <span>Saldo estimado no sistema: {formatCurrency(resumo.saldoSistema)}</span>
            )}
            {resumo.saldoInformado !== null && (
              <span>Saldo informado no texto: {formatCurrency(resumo.saldoInformado)}</span>
            )}
            {resumo.categoriasNovas?.length > 0 && (
              <span>Novas categorias sugeridas: {resumo.categoriasNovas.join(', ')}</span>
            )}
            {totalRemovidas > 0 && (
              <span className="text-destructive">
                {totalRemovidas} transações foram marcadas para não importar.
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm text-muted-foreground">
              Revise, edite ou remova as transações antes de confirmar. Clique em “Salvar” para importar.
            </p>
            <Button variant="outline" size="sm" onClick={handleAddTransaction}>
              Adicionar linha
            </Button>
          </div>

          <div className="grid gap-3">
            {effectiveTransactions.map((transacao) => {
              const isRemoved = transacao.removed;
              const editKey = transacao.index;
              const editEntry = pendingEdits.get(editKey);
              const valorDisplay = editEntry?.valor ?? transacao.valor;
              const tipoDisplay = editEntry?.tipo ?? transacao.tipo;
              const categoriaDisplay = editEntry?.categoria ?? transacao.categoria;
              const descricaoDisplay = editEntry?.descricao ?? transacao.descricao;

              return (
                <div
                  key={editKey}
                  className={`rounded-md border border-border p-4 transition ${
                    isRemoved ? 'bg-muted/40 opacity-60' : 'bg-background'
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Descrição
                      </Label>
                      <Input
                        value={descricaoDisplay}
                        onChange={(e) => handleUpdate(editKey, 'descricao', e.target.value)}
                        disabled={isRemoved}
                      />
                    </div>

                    <div className="w-full max-w-[140px] space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Valor
                      </Label>
                      <Input
                        type="number"
                        value={valorDisplay}
                        onChange={(e) => handleUpdate(editKey, 'valor', Number(e.target.value))}
                        disabled={isRemoved}
                      />
                    </div>

                    <div className="w-full max-w-[160px] space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Tipo
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleToggleTipo(editKey, tipoDisplay || transacao.tipo)}
                        disabled={isRemoved}
                      >
                        {(tipoDisplay || transacao.tipo) === 'entrada' ? 'Entrada' : 'Saída'}
                      </Button>
                    </div>

                    <div className="w-full max-w-[220px] space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Categoria
                      </Label>
                      <Select
                        value={categoriaDisplay}
                        onValueChange={(value) => handleCategoriaChange(editKey, value)}
                        disabled={isRemoved}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {allCategories.map((nome) => (
                            <SelectItem key={nome} value={nome}>
                              {nome}
                            </SelectItem>
                          ))}
                          <SelectItem value="__create__">Criar nova categoria…</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                      {isRemoved ? (
                        <Button variant="outline" size="sm" onClick={() => handleRestore(editKey)}>
                          Restaurar
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemove(editKey)}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmClick} disabled={loading}>
            Salvar e importar tudo
          </Button>
        </div>
      </div>
    );
  };
  const normalizeDecisionText = (value) =>
    normalizeContent(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[!?.]/g, '')
      .trim();

  const matchesKeyword = (value, keywords) => {
    if (!value) return false;
    const sanitized = normalizeDecisionText(value);
    if (!sanitized) return false;

    const words = sanitized.split(/\s+/).filter(Boolean);
    return keywords.some((keyword) => {
      const normalizedKeyword = keyword
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

      if (!normalizedKeyword) return false;

      if (normalizedKeyword.includes(' ')) {
        return sanitized.includes(normalizedKeyword);
      }

      return words.includes(normalizedKeyword);
    });
  };

  const isAffirmativeResponse = (value) =>
    matchesKeyword(value, [
      'sim',
      'claro',
      'ok',
      'pode',
      'pode sim',
      'pode continuar',
      'pode registrar',
      'confirmo',
      'confirmar',
      'continua',
      'continuar',
      'segue',
      'seguir',
      'continue',
      'pode seguir',
      'tudo certo',
      'importa',
      'importar',
      'registre',
      'pode lançar',
      'lançar',
      'vamos lá',
    ]);

  const isNegativeResponse = (value) =>
    matchesKeyword(value, [
      'nao',
      'não',
      'n',
      'negativo',
      'cancela',
      'cancelar',
      'pare',
      'parar',
      'stop',
      'segura',
      'espera',
      'aguarde',
      'deixa quieto',
      'desconsidera',
      'não quero',
      'nao quero',
      'nao pode',
      'não pode',
    ]);

  const handleConfirmTransaction = async () => {
    if (!pendingTransaction || !user) return;

    try {
      const today = new Date();
      const day = today.getDate();

      // Garantir que o mês existe
      const { month: monthData } = await ensureMonthExists(user.id);

      const categoriaNomeBase =
        pendingTransaction.categoria ||
        (pendingTransaction.tipo === 'entrada' ? 'Receitas diversas' : 'Outros');
      const categoriaNomeLower = categoriaNomeBase.toLowerCase();

      let categoriaMap = categoriesMapRef.current.size
        ? new Map(categoriesMapRef.current)
        : await loadCategories();

      let categoriaEntry = categoriaMap.get(categoriaNomeLower);
      let categoryId = categoriaEntry?.id;

      if (!categoryId) {
        const { data: categoriaExistente, error: categoriaBuscaError } = await supabase
        .from('categorias_saidas')
          .select('id, nome, icone, cor, tipo, padrao')
        .eq('user_id', user.id)
          .eq('nome', categoriaNomeBase)
        .maybeSingle();

        if (categoriaBuscaError) throw categoriaBuscaError;

        if (categoriaExistente) {
          categoriaEntry = categoriaExistente;
          categoryId = categoriaExistente.id;
          const updatedMap = new Map(categoriaMap);
          updatedMap.set(categoriaNomeLower, categoriaExistente);
          categoriaMap = updatedMap;
          categoriesMapRef.current = updatedMap;
          setCategoriesMap(updatedMap);
        }
      }

      if (!categoryId) {
        const { data: newCat, error: createCatError } = await supabase
          .from('categorias_saidas')
          .insert({
            user_id: user.id,
            nome: categoriaNomeBase,
            icone: '📌',
            cor: '#3b82f6',
            tipo: pendingTransaction.tipo === 'entrada' ? 'fixa' : 'variavel',
            padrao: false,
          })
          .select()
          .single();

        if (createCatError) throw createCatError;

        if (newCat) {
          categoriaEntry = newCat;
        categoryId = newCat.id;
          const updatedMap = new Map(categoriaMap);
          updatedMap.set(categoriaNomeLower, newCat);
          categoriaMap = updatedMap;
          categoriesMapRef.current = updatedMap;
          setCategoriesMap(updatedMap);
        }
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
      const variacao = pendingTransaction.tipo === 'entrada' ? pendingTransaction.valor : -pendingTransaction.valor;
      const novoSaldo = contaData.saldo_atual + variacao;

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
        content: buildSuccessMessage(pendingTransaction),
        timestamp: new Date().toISOString()
      };

      updateMessages(
        (prev) => {
          const withConfirmationFlag = prev.map((msg) => {
            if (
              msg.type === 'confirmation' &&
              msg.pendingData?.valor === pendingTransaction.valor &&
              msg.pendingData?.descricao === pendingTransaction.descricao
            ) {
          return {
            ...msg,
            confirmed: true,
                confirmTime: new Date().toISOString(),
          };
        }
        return msg;
      });
          return [...withConfirmationFlag, successMsg];
        },
        { title: sessionIdRef.current ? undefined : deriveTitle }
      );

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

  const handleConfirmBulkImport = async () => {
    if (!pendingBulkImport || !user || loading) return;

    setLoading(true);
    try {
      const result = await commitBulkFinancialLog(pendingBulkImport, pendingBulkEdits);
      const { importedTransactions, errors, snapshotDepois, saldoInformado } = result;

      const totalImportadas = importedTransactions.length;
      const totalEntradas = importedTransactions
        .filter((item) => item.tipo === 'entrada')
        .reduce((sum, item) => sum + Number(item.valor || 0), 0);
      const totalSaidas = importedTransactions
        .filter((item) => item.tipo !== 'entrada')
        .reduce((sum, item) => sum + Number(item.valor || 0), 0);

      const saldoAtual = snapshotDepois?.saldoAtual ?? null;
      const saldoMensagem =
        saldoInformado && saldoAtual !== null
          ? `Você informou um saldo final de ${formatCurrency(saldoInformado)}. O sistema agora registra ${formatCurrency(saldoAtual)}, diferença de ${formatCurrency(saldoAtual - saldoInformado)}.`
          : '';

      const resumoImportacao = [
        totalImportadas > 0
          ? `✅ ${totalImportadas} transações importadas com sucesso.`
          : 'Nenhuma transação foi importada.',
        totalEntradas > 0 ? `Entradas lançadas: ${formatCurrency(totalEntradas)}.` : null,
        totalSaidas > 0 ? `Saídas lançadas: ${formatCurrency(totalSaidas)}.` : null,
        saldoMensagem,
        errors.length > 0
          ? `⚠️ ${errors.length} lançamentos não puderam ser importados automaticamente.`
          : null,
      ]
        .filter(Boolean)
        .join('\n');

      const successMsg = {
        role: 'assistant',
        type: errors.length > 0 ? 'message' : 'success',
        content: resumoImportacao,
        timestamp: new Date().toISOString(),
      };

      updateMessages(
        (prev) => {
          const updated = prev.map((msg) => {
            if (
              msg.type === 'bulk-confirmation' &&
              msg.pendingData?.pendingId === pendingBulkImport.id
            ) {
              return { ...msg, confirmed: true, confirmTime: new Date().toISOString() };
            }
            return msg;
          });
          return [...updated, successMsg];
        },
        { title: sessionIdRef.current ? undefined : deriveTitle }
      );

      if (errors.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Importação concluída com avisos',
          description: 'Algumas transações não puderam ser importadas automaticamente.',
        });
      } else {
        toast({
          title: 'Importação concluída!',
          description: `${totalImportadas} transações foram registradas com sucesso.`,
        });
      }

      await loadCategories();
      setPendingBulkImport(null);
      setPendingBulkEdits(new Map());
    } catch (error) {
      console.error('Erro ao confirmar importação em lote:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao importar',
        description: error.message || 'Não foi possível concluir a importação em lote.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBulkImport = () => {
    if (!pendingBulkImport) return;

    const cancelMsg = {
      role: 'assistant',
      type: 'message',
      content: 'Ok, importação em lote cancelada. Se quiser tentar novamente, envie o extrato outra vez.',
      timestamp: new Date().toISOString(),
    };

    updateMessages(
      (prev) => {
        const updated = prev.map((msg) => {
          if (
            msg.type === 'bulk-confirmation' &&
            msg.pendingData?.pendingId === pendingBulkImport.id
          ) {
            return { ...msg, cancelled: true, cancelTime: new Date().toISOString() };
          }
          return msg;
        });
        return [...updated, cancelMsg];
      },
      { title: sessionIdRef.current ? undefined : deriveTitle }
    );

    setPendingBulkImport(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const messageText = input;

    const userMsg = { 
      role: 'user', 
      content: messageText,
      timestamp: new Date().toISOString()
    };
    
    const shouldSuggestTitle = !sessionIdRef.current;
    updateMessages(
      (prev) => [...prev, userMsg],
      shouldSuggestTitle ? { title: deriveTitle } : undefined
    );

    setInput('');

    if (pendingBulkImport) {
      if (isAffirmativeResponse(messageText)) {
        await handleConfirmBulkImport();
        return;
      }
      if (isNegativeResponse(messageText)) {
        handleCancelBulkImport();
        return;
      }
    }

    if (pendingTransaction) {
      if (isAffirmativeResponse(messageText)) {
        setLoading(true);
        await handleConfirmTransaction();
        setLoading(false);
        return;
      }
      if (isNegativeResponse(messageText)) {
        handleCancelPendingTransaction();
        setLoading(false);
        return;
      }
    }

    setLoading(true);

    try {
      const deleteRequest = parseDeleteMonthCommand(messageText);
      if (deleteRequest) {
        if (!user) throw new Error('Usuário não autenticado.');

        const { month, year } = deleteRequest;

        const { data: monthRecord, error: monthError } = await supabase
          .from('meses_financeiros')
          .select('id, mes, ano')
          .eq('user_id', user.id)
          .eq('mes', month)
          .eq('ano', year)
          .maybeSingle();

        if (monthError) throw monthError;

        if (!monthRecord) {
          const assistantResponse = {
            role: 'assistant',
            type: 'message',
            content: `Não encontrei um mês financeiro para ${month}/${year}. Nenhum registro foi alterado.`,
            timestamp: new Date().toISOString(),
          };
          updateMessages(
            (prev) => [...prev, assistantResponse],
            sessionIdRef.current ? undefined : { title: deriveTitle }
          );
          setLoading(false);
          return;
        }

        const { count, error: countError } = await supabase
          .from('transacoes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('mes_financeiro_id', monthRecord.id)
          .eq('deletado', false);

        if (countError) throw countError;

        if (!count || count === 0) {
          const assistantResponse = {
            role: 'assistant',
            type: 'message',
            content: `Não encontrei registros ativos para ${getMonthName(month, year)}.`,
            timestamp: new Date().toISOString(),
          };
          updateMessages(
            (prev) => [...prev, assistantResponse],
            sessionIdRef.current ? undefined : { title: deriveTitle }
          );
          setLoading(false);
          return;
        }

        const deleteIntent = {
          month,
          year,
          monthId: monthRecord.id,
          count,
        };
        setPendingDeletion(deleteIntent);

        const assistantResponse = {
          role: 'assistant',
          type: 'delete-confirmation',
          content: `Você quer que eu apague ${count} registro(s) do mês ${getMonthName(
            month,
            year
          )}? Essa ação não pode ser desfeita.`,
          pendingData: deleteIntent,
          timestamp: new Date().toISOString(),
        };

        updateMessages(
          (prev) => [...prev, assistantResponse],
          sessionIdRef.current ? undefined : { title: deriveTitle }
        );
        setLoading(false);
        return;
      }

      if (isBulkFinancialLog(messageText)) {
        const preview = await prepareBulkFinancialLog(messageText);
        setPendingBulkImport(preview);
        setPendingTransaction(null);

        const totalTransacoes = preview.preparedTransactions.length;

        const resumo = {
          totalTransacoes,
          totalEntradas: preview.totalEntradas || 0,
          totalSaidas: preview.totalSaidas || 0,
          saldoSistema: preview.snapshotAntes?.saldoAtual ?? null,
          saldoInformado:
            preview.saldoInformado !== null && preview.saldoInformado !== undefined
              ? preview.saldoInformado
              : null,
          categoriasNovas: preview.categoriasNovas,
        };

        setPendingBulkEdits(new Map());

        const assistantResponse = {
          role: 'assistant',
          type: 'bulk-preview',
          content: {
            resumo,
            transacoes: preview.preparedTransactions,
            pendingId: preview.id,
          },
          timestamp: new Date().toISOString(),
          pendingData: { pendingId: preview.id },
        };

        updateMessages(
          (prev) => [...prev, assistantResponse],
          sessionIdRef.current ? undefined : { title: deriveTitle }
        );
        setLoading(false);
        return;
      }

      await loadCategories();
      const availableCategories = Array.from(categoriesMapRef.current.values() || []).map(
        (categoria) => categoria?.nome
      );
      const augmentedInput =
        availableCategories.length > 0
          ? `${messageText}\n\nCategorias disponíveis: ${availableCategories.join(', ')}.`
          : messageText;

      const response = await classifyTransaction(augmentedInput);

      let assistantResponse = {
        role: 'assistant',
        timestamp: new Date().toISOString()
      };

      if (response.tipo && response.valor) {
        const snapshot = await fetchFinancialSnapshot();
        const normalizedValor = Number(response.valor);
        const enrichedIntent = {
          ...response,
          valor: Number.isFinite(normalizedValor) ? normalizedValor : response.valor,
          snapshot,
        };
        setPendingTransaction(enrichedIntent);
        const categoriesHint =
          availableCategories.length > 0
            ? `\n\nCategorias disponíveis: ${availableCategories.join(
                ', '
              )}. Se quiser usar outra, responda com o nome da categoria.`
            : '';

        const baseContent =
          response.confirmacao || buildAdviceMessage(enrichedIntent, snapshot);

        assistantResponse = {
          ...assistantResponse,
          type: 'confirmation',
          content: `${baseContent}${categoriesHint}`,
          pendingData: enrichedIntent
        };
      } else {
        assistantResponse = {
          ...assistantResponse,
          type: 'message',
          content: response.message || 'Desculpe, não entendi muito bem.'
        };
      }

      updateMessages(
        (prev) => [...prev, assistantResponse],
        sessionIdRef.current ? undefined : { title: deriveTitle }
      );
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMsg = {
        role: 'assistant',
        type: 'error',
        content: 'Desculpe, houve um erro. Tente novamente.',
        timestamp: new Date().toISOString()
      };
      updateMessages(
        (prev) => [...prev, errorMsg],
        sessionIdRef.current ? undefined : { title: deriveTitle }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (!pendingDeletion || !user || loading) return;
    setLoading(true);
    try {
      const { monthId, count, month, year } = pendingDeletion;

      const { error } = await supabase
        .from('transacoes')
        .update({ deletado: true })
        .eq('user_id', user.id)
        .eq('mes_financeiro_id', monthId)
        .eq('deletado', false);

      if (error) throw error;

      const successMsg = {
        role: 'assistant',
        type: 'success',
        content: `Registros do mês ${getMonthName(
          month,
          year
        )} foram apagados (${count} lançamentos).`,
        timestamp: new Date().toISOString(),
      };

      updateMessages(
        (prev) => {
          const updated = prev.map((msg) => {
            if (
              msg.type === 'delete-confirmation' &&
              msg.pendingData?.month === month &&
              msg.pendingData?.year === year
            ) {
              return { ...msg, confirmed: true, confirmTime: new Date().toISOString() };
            }
            return msg;
          });
          return [...updated, successMsg];
        },
        sessionIdRef.current ? undefined : { title: deriveTitle }
      );

      toast({
        title: 'Registros apagados',
        description: `Todos os lançamentos de ${getMonthName(month, year)} foram marcados como deletados.`,
      });
      setPendingDeletion(null);
    } catch (error) {
      console.error('Erro ao apagar registros:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao apagar registros',
        description: error.message || 'Não foi possível apagar os registros.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeletion = () => {
    if (!pendingDeletion) return;
    updateMessages(
      (prev) => [
        ...prev.map((msg) =>
          msg.type === 'delete-confirmation' ? { ...msg, cancelled: true } : msg
        ),
        {
          role: 'assistant',
          type: 'message',
          content: 'Ok, não removi nenhum registro. Quando quiser tentar de novo, é só pedir.',
          timestamp: new Date().toISOString(),
        },
      ],
      sessionIdRef.current ? undefined : { title: deriveTitle }
    );
    setPendingDeletion(null);
  };

  const submitRename = async () => {
    if (!sessionIdRef.current || !tableAvailableRef.current) return;
    if (!supportsTituloRef.current) {
      toast({
        variant: 'destructive',
        title: 'Recurso indisponível',
        description: 'Renomear conversas não está disponível nesta versão do banco de dados.',
      });
      setIsRenaming(false);
      return;
    }

    const newTitle = titleDraft.trim() || deriveTitle(messages);
    try {
      const { error } = await supabase
        .from('chat_historico_completo')
        .update({
          titulo: newTitle,
          data_atualizacao: new Date().toISOString(),
        })
        .eq('id', sessionIdRef.current);

      // Verificar se é erro de "PRO FEATURE ONLY"
      if (isProFeatureError(error)) {
        tableAvailableRef.current = false;
        supportsTituloRef.current = false;
        setSupportsTitulo(false);
        toast({
          variant: 'destructive',
          title: 'Recurso indisponível',
          description: 'Renomear conversas não está disponível nesta versão do banco de dados.',
        });
        setIsRenaming(false);
        return;
      }

      if (error?.code === 'PGRST204' || error?.code === '42703') {
        supportsTituloRef.current = false;
        setSupportsTitulo(false);
        toast({
          variant: 'destructive',
          title: 'Recurso indisponível',
          description:
            'Renomear conversas não está disponível nesta versão do banco de dados.',
        });
        setIsRenaming(false);
        return;
      }

      if (error) throw error;
      setSessionTitleState(newTitle);
      setIsRenaming(false);
      onSessionTitleChange?.(sessionIdRef.current, newTitle);
      toast({
        title: 'Conversa renomeada',
        description: 'O título foi atualizado com sucesso.',
      });
    } catch (error) {
      // Verificar se é erro de "PRO FEATURE ONLY"
      if (isProFeatureError(error)) {
        tableAvailableRef.current = false;
        supportsTituloRef.current = false;
        setSupportsTitulo(false);
        toast({
          variant: 'destructive',
          title: 'Recurso indisponível',
          description: 'Renomear conversas não está disponível nesta versão do banco de dados.',
        });
        setIsRenaming(false);
        return;
      }
      
      // Silenciar erros de "PRO FEATURE ONLY" para não poluir o console
      if (!isProFeatureError(error)) {
        console.error('Erro ao renomear conversa:', error);
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao renomear',
        description: 'Não foi possível atualizar o título da conversa.',
      });
    }
  };

  const cancelRename = () => {
    setTitleDraft(sessionTitleRef.current);
    setIsRenaming(false);
  };

  return (
    <Card className="h-[520px] w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
          💬 Assistente Financeiro
        </CardTitle>
            {sessionIdRef.current && supportsTitulo && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {isRenaming ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      className="h-8 w-48"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={submitRename}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={cancelRename}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium text-foreground">{sessionTitle}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        setTitleDraft(sessionTitle);
                        setIsRenaming(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Organize suas finanças conversando comigo. Posso lançar transações, importar extratos e ajustar preferências.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {embedded && (
              <Button
                variant="outline"
                size="icon"
                onClick={onRequestOpenChatPage}
                title="Abrir página completa do chat"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}

            <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4" />
            </Button>

            {allowSessionReset && (
              <Button
                variant={embedded ? 'destructive' : 'outline'}
                size="sm"
                onClick={handleStartNewConversation}
                disabled={loading}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {embedded ? 'Limpar chat' : 'Nova conversa'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-[380px] flex-col">
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-3">
            {messages.map((msg, idx) => (
                <div
                  key={`${msg.timestamp}-${idx}`}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : msg.type === 'success'
                    ? 'bg-success/20 text-success'
                    : msg.type === 'error'
                    ? 'bg-danger/20 text-danger'
                    : 'bg-muted text-foreground'
                    }`}
                  >
                  {typeof msg.content === 'string' ? (
                  <p className="text-sm">{msg.content}</p>
                  ) : null}
                  {msg.type === 'confirmation' && pendingTransaction && (
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={handleConfirmTransaction} disabled={loading}>
                        ✓ Sim
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                          onClick={handleCancelPendingTransaction}
                          disabled={loading}
                        >
                        ✗ Não
                      </Button>
                      </div>
                      {categoriesMap.size > 0 && (
                        <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                          <p className="font-medium text-foreground/80">
                            Categorias disponíveis:
                          </p>
                          <p>
                            {Array.from(categoriesMap.values())
                              .map((categoria) => categoria?.nome)
                              .filter(Boolean)
                              .slice(0, 12)
                              .join(', ')}
                            {categoriesMap.size > 12 ? '…' : ''}
                          </p>
                          <p className="mt-1">
                            Você pode responder com o nome da categoria para substituir a sugestão.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                    {msg.type === 'bulk-preview' &&
                      pendingBulkImport &&
                      msg.pendingData?.pendingId === pendingBulkImport.id && (
                        <BulkPreviewEditor
                          resumo={msg.content.resumo}
                          transacoes={msg.content.transacoes}
                          pendingEdits={pendingBulkEdits}
                          setPendingEdits={setPendingBulkEdits}
                          onConfirm={handleConfirmBulkImport}
                          onCancel={handleCancelBulkImport}
                          categoriesMap={categoriesMap}
                          loading={loading}
                          onCreateCategory={async (nome, tipo = 'variavel') => {
                            if (!user) throw new Error('Usuário não autenticado.');
                            const categoriaNomeLower = nome.toLowerCase();

                            let categoriaEntry = categoriesMapRef.current.get(categoriaNomeLower);
                            if (categoriaEntry) {
                              return categoriaEntry;
                            }

                            const { data: categoriaExistente } = await supabase
                              .from('categorias_saidas')
                              .select('id, nome, icone, cor, tipo, padrao')
                              .eq('user_id', user.id)
                              .eq('nome', nome)
                              .maybeSingle();

                            if (categoriaExistente) {
                              const updatedMap = new Map(categoriesMapRef.current);
                              updatedMap.set(categoriaNomeLower, categoriaExistente);
                              categoriesMapRef.current = updatedMap;
                              setCategoriesMap(updatedMap);
                              return categoriaExistente;
                            }

                            const { data: novaCategoria, error: createError } = await supabase
                              .from('categorias_saidas')
                              .insert({
                                user_id: user.id,
                                nome,
                                icone: '📌',
                                cor: '#3b82f6',
                                tipo,
                                padrao: false,
                              })
                              .select()
                              .single();

                            if (createError) throw createError;

                            const updatedMap = new Map(categoriesMapRef.current);
                            updatedMap.set(categoriaNomeLower, novaCategoria);
                            categoriesMapRef.current = updatedMap;
                            setCategoriesMap(updatedMap);
                            return novaCategoria;
                          }}
                        />
                      )}
                    {msg.type === 'delete-confirmation' &&
                      pendingDeletion &&
                      msg.pendingData?.month === pendingDeletion.month &&
                      msg.pendingData?.year === pendingDeletion.year && (
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" onClick={handleConfirmDeletion} disabled={loading}>
                            ✓ Sim
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelDeletion}
                            disabled={loading}
                      >
                        ✗ Não
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
              {(loading || loadingHistory) && (
              <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {loadingHistory ? 'Carregando histórico...' : 'Gerando resposta...'}
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
          </ScrollArea>

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

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="right" className="w-full border-l border-border bg-background p-0 sm:w-[480px]">
          <SheetHeader className="border-b border-border px-6 py-4">
            <SheetTitle>Configurações do assistente</SheetTitle>
            <SheetDescription>
              Ajuste seus dados financeiros, preferências e estilo de comunicação sem sair da conversa.
            </SheetDescription>
          </SheetHeader>
          <div className="flex h-full flex-col">
            <Tabs defaultValue="financial" className="flex h-full flex-col">
              <TabsList className="mx-6 mt-4 gap-2 self-start">
                <TabsTrigger value="financial">Financeiro</TabsTrigger>
                <TabsTrigger value="profile">Perfil</TabsTrigger>
                <TabsTrigger value="preferences">Preferências</TabsTrigger>
              </TabsList>
              <TabsContent value="financial" className="flex-1 overflow-y-auto px-6 pb-6">
                <FinancialTab user={user} />
              </TabsContent>
              <TabsContent value="profile" className="flex-1 overflow-y-auto px-6 pb-6">
                <ProfileTab user={user} />
              </TabsContent>
              <TabsContent value="preferences" className="flex-1 overflow-y-auto px-6 pb-6">
                <PreferencesTab user={user} />
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
