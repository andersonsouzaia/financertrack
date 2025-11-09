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
  const setSessionTitleState = useCallback((title) => {
    const finalTitle = title || 'Nova conversa';
    setSessionTitle(finalTitle);
    setTitleDraft(finalTitle);
    sessionTitleRef.current = finalTitle;
  }, []);
  useEffect(() => {
    const loadLatestSession = async () => {
      if (!user || externalSessionId || hasLoadedInitialSession.current) return;
      hasLoadedInitialSession.current = true;
      try {
        setLoadingHistory(true);
        const { data, error } = await supabase
          .from('chat_historico_completo')
          .select('id, mensagens, titulo')
          .eq('user_id', user.id)
          .order('data_atualizacao', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (data?.id) {
          sessionIdRef.current = data.id;
          setChatSessionId(data.id);
          if (Array.isArray(data.mensagens) && data.mensagens.length > 0) {
            setMessages(data.mensagens);
            setSessionTitleState(data.titulo || deriveTitle(data.mensagens));
          }
        }
      } catch (error) {
        console.error('Erro ao buscar última conversa:', error);
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

      if (error) throw error;

      const map = new Map(
        (data || []).map((categoria) => [categoria.nome.toLowerCase(), categoria])
      );

      categoriesMapRef.current = map;
      setCategoriesMap(map);
      return map;
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      return categoriesMapRef.current;
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
    if (!user) return;
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
        const { data, error } = await supabase
          .from('chat_historico_completo')
          .select('mensagens, titulo')
          .eq('id', sessionToLoad)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (Array.isArray(data?.mensagens) && data.mensagens.length) {
          setMessages(data.mensagens);
          setSessionTitleState(data?.titulo || deriveTitle(data.mensagens));
        } else {
          setMessages([INITIAL_MESSAGE]);
          setSessionTitleState('Nova conversa');
      }
    } catch (error) {
        console.error('Erro ao carregar histórico do chat:', error);
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
          .select(
            'renda_mensal, tone_ia, estilo_usuario, agressividade_sugestoes, reserva_emergencia_meta, reserva_emergencia_atual'
          )
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

  const commitBulkFinancialLog = async (bulkData) => {
    if (!user) {
      throw new Error('Usuário não autenticado.');
    }

    const { preparedTransactions, parsed } = bulkData;

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

    for (const entry of preparedTransactions) {
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
      if (!user) return;
      if (!messagesToPersist.some((message) => message.role === 'user')) return;

      const currentSessionId = sessionIdRef.current;
      const generatedTitle =
        typeof options.title === 'function' ? options.title(messagesToPersist) : options.title;

      if (!currentSessionId) {
        const title = generatedTitle || deriveTitle(messagesToPersist);
        try {
          const timestamp = new Date().toISOString();
          const { data, error } = await supabase
            .from('chat_historico_completo')
            .insert({
              user_id: user.id,
              topico: 'chat-dashboard',
              mensagens: messagesToPersist,
              titulo: title,
              data_atualizacao: timestamp,
            })
            .select('id, titulo, data_atualizacao')
            .single();

          if (error) throw error;

          sessionIdRef.current = data.id;
          setChatSessionId(data.id);
          setSessionTitleState(data.titulo || title);

          onSessionCreated?.({
            id: data.id,
            titulo: data.titulo || title,
            data_atualizacao: data.data_atualizacao || timestamp,
          });
        } catch (error) {
          console.error('Erro ao criar conversa:', error);
        }
      } else {
        try {
          const timestamp = new Date().toISOString();
          const title =
            generatedTitle || sessionTitleRef.current || deriveTitle(messagesToPersist);

          const { error } = await supabase
            .from('chat_historico_completo')
            .update({
              mensagens: messagesToPersist,
              titulo: title,
              data_atualizacao: timestamp,
            })
            .eq('id', currentSessionId);

          if (error) throw error;

          if (title !== sessionTitleRef.current) {
            setSessionTitleState(title);
          }
          onSessionTitleChange?.(currentSessionId, title);
        } catch (error) {
          console.error('Erro ao atualizar conversa:', error);
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
      const result = await commitBulkFinancialLog(pendingBulkImport);
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
        const linhasResumo = [];

        linhasResumo.push('Resumo da importação');
        linhasResumo.push(`Transações identificadas: ${totalTransacoes}`);
        linhasResumo.push(`Entradas previstas: ${formatCurrency(preview.totalEntradas || 0)}`);
        linhasResumo.push(`Saídas previstas: ${formatCurrency(preview.totalSaidas || 0)}`);

        if (preview.snapshotAntes?.saldoAtual !== undefined && preview.snapshotAntes?.saldoAtual !== null) {
          linhasResumo.push(`Saldo atual estimado no sistema: ${formatCurrency(preview.snapshotAntes.saldoAtual)}`);
        }

        if (preview.saldoInformado !== null && preview.saldoInformado !== undefined) {
          linhasResumo.push(`Saldo informado no texto: ${formatCurrency(preview.saldoInformado)}`);
        }

        const saldoComparativo =
          preview.saldoInformado !== null &&
          preview.saldoInformado !== undefined &&
          preview.snapshotAntes?.saldoAtual !== undefined &&
          preview.snapshotAntes?.saldoAtual !== null
            ? preview.snapshotAntes.saldoAtual - preview.saldoInformado
            : null;

        if (saldoComparativo !== null) {
          linhasResumo.push(
            `Diferença entre saldo informado e estimado: ${formatCurrency(saldoComparativo)}`
          );
        }

        if (preview.categoriasNovas.length > 0) {
          linhasResumo.push(
            `Novas categorias sugeridas: ${preview.categoriasNovas.join(', ')}`
          );
        }

        const maxPreview = 10;
        const linhasTransacoes = preview.preparedTransactions.slice(0, maxPreview).map((item, index) => {
          const tipoLabel =
            item.tipo === 'entrada'
              ? 'Entrada'
              : item.tipo === 'diario'
              ? 'Gasto diário'
              : 'Saída';

          return `${index + 1}. ${tipoLabel} | ${formatCurrency(item.valor)} | ${item.descricao} | Categoria: ${item.categoria}`;
        });

        if (linhasTransacoes.length === 0) {
          linhasTransacoes.push('(Não foi possível gerar uma prévia humanizada das transações.)');
        } else if (totalTransacoes > maxPreview) {
          linhasTransacoes.push(
            `(+ ${totalTransacoes - maxPreview} transações adicionais que também serão importadas)`
          );
        }

        const resumoImportacao = [
          ...linhasResumo,
          '',
          'Prévia das transações:',
          ...linhasTransacoes,
          '',
          'Posso importar todas essas transações agora?'
        ].join('\n');

        const assistantResponse = {
          role: 'assistant',
          type: 'bulk-confirmation',
          content: resumoImportacao,
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
    if (!sessionIdRef.current) return;
    const newTitle = titleDraft.trim() || deriveTitle(messages);
    try {
      const { error } = await supabase
        .from('chat_historico_completo')
        .update({
          titulo: newTitle,
          data_atualizacao: new Date().toISOString(),
        })
        .eq('id', sessionIdRef.current);

      if (error) throw error;
      setSessionTitleState(newTitle);
      setIsRenaming(false);
      onSessionTitleChange?.(sessionIdRef.current, newTitle);
      toast({
        title: 'Conversa renomeada',
        description: 'O título foi atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao renomear conversa:', error);
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
            {sessionIdRef.current && (
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
                  <p className="text-sm">{msg.content}</p>
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
                    {msg.type === 'bulk-confirmation' &&
                      pendingBulkImport &&
                      msg.pendingData?.pendingId === pendingBulkImport.id && (
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" onClick={handleConfirmBulkImport} disabled={loading}>
                            ✓ Sim
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelBulkImport}
                            disabled={loading}
                          >
                            ✗ Não
                          </Button>
                        </div>
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
