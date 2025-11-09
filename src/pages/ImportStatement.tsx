import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, AlertCircle, CheckCircle, Loader, ArrowLeft } from 'lucide-react';
import { parseCSV, parsePDF, parseOFX, Transaction } from '@/lib/statementParser';
import { analyzeStatement, StatementAnalysis } from '@/lib/statementAnalyzer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ImportStatement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<Transaction[] | null>(null);
  const [analysis, setAnalysis] = useState<StatementAnalysis | null>(null);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState(1); // 1: upload, 2: preview, 3: análise, 4: importar

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsing(true);

    try {
      let transactions: Transaction[] = [];
      const fileType = selectedFile.type;
      const fileName = selectedFile.name.toLowerCase();

      if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
        const text = await selectedFile.text();
        transactions = parseCSV(text);
      } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        const arrayBuffer = await selectedFile.arrayBuffer();
        transactions = await parsePDF(arrayBuffer);
      } else if (fileName.endsWith('.ofx')) {
        const text = await selectedFile.text();
        transactions = parseOFX(text);
      } else {
        throw new Error('Formato não suportado. Use PDF, CSV ou OFX');
      }

      if (transactions.length === 0) {
        throw new Error('Nenhuma transação encontrada no arquivo');
      }

      setPreview(transactions);
      setStep(2);

      toast({
        title: "Arquivo lido!",
        description: `${transactions.length} transações encontradas`
      });

      // Ir para análise automaticamente
      setTimeout(() => handleAnalyze(transactions), 500);
    } catch (error) {
      console.error('Erro ao parsear:', error);
      toast({
        variant: "destructive",
        title: "Erro ao ler arquivo",
        description: (error as Error).message
      });
      setFile(null);
    } finally {
      setParsing(false);
    }
  };

  const handleAnalyze = async (transactions: Transaction[] | null = null) => {
    const transToAnalyze = transactions || preview;
    if (!transToAnalyze) return;

    setAnalyzing(true);

    try {
      const analysisResult = await analyzeStatement(transToAnalyze);

      setAnalysis(analysisResult);
      setStep(3);

      toast({
        title: "Análise concluída!",
        description: "Seu perfil financeiro foi identificado"
      });
    } catch (error) {
      console.error('Erro ao analisar:', error);
      toast({
        variant: "destructive",
        title: "Erro na análise",
        description: (error as Error).message
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImport = async () => {
    if (!analysis || !analysis.transactions || !user) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nenhuma transação para importar"
      });
      return;
    }

    setImporting(true);

    try {
      // Garantir que mês existe
      const hoje = new Date();
      const mes = hoje.getMonth() + 1;
      const ano = hoje.getFullYear();

      const { data: mesData, error: mesError } = await supabase
        .from('meses_financeiros')
        .select('id')
        .eq('user_id', user.id)
        .eq('mes', mes)
        .eq('ano', ano)
        .maybeSingle();

      if (mesError || !mesData) {
        // Criar mês se não existir
        const { data: novoMes, error: criarMesError } = await supabase
          .from('meses_financeiros')
          .insert({
            user_id: user.id,
            mes,
            ano,
            status: 'aberto',
            saldo_inicial: 0
          })
          .select()
          .single();

        if (criarMesError) throw new Error('Erro ao criar mês financeiro');
        
        var mesId = novoMes.id;
      } else {
        var mesId = mesData.id;
      }

      // Buscar ou criar categorias
      const { data: categorias } = await supabase
        .from('categorias_saidas')
        .select('id, nome')
        .eq('user_id', user.id);

      const categoriaMap: Record<string, string> = {};
      categorias?.forEach(c => {
        categoriaMap[c.nome] = c.id;
      });

      // Buscar conta principal
      const { data: conta } = await supabase
        .from('bancos_contas')
        .select('id')
        .eq('user_id', user.id)
        .eq('principal', true)
        .maybeSingle();

      let contaId = conta?.id;

      // Criar conta se não existir
      if (!contaId) {
        const { data: novaConta } = await supabase
          .from('bancos_contas')
          .insert({
            user_id: user.id,
            nome_banco: 'Conta Principal',
            tipo_conta: 'corrente',
            saldo_atual: 0,
            principal: true
          })
          .select()
          .single();

        contaId = novaConta?.id;
      }

      if (!contaId) throw new Error('Erro ao obter conta bancária');

      // Importar transações
      let importados = 0;
      let erros = 0;

      for (const trans of analysis.transactions) {
        try {
          let categoriaId = categoriaMap[trans.categoria];

          // Criar categoria se não existir
          if (!categoriaId) {
            const { data: newCat } = await supabase
              .from('categorias_saidas')
              .insert({
                user_id: user.id,
                nome: trans.categoria,
                icone: '📌',
                cor: '#3b82f6',
                tipo: 'variavel',
                padrao: false
              })
              .select()
              .single();

            if (newCat) {
              categoriaId = newCat.id;
              categoriaMap[trans.categoria] = newCat.id;
            }
          }

          // Inserir transação
          await supabase
            .from('transacoes')
            .insert({
              user_id: user.id,
              mes_financeiro_id: mesId,
              categoria_id: categoriaId || null,
              banco_conta_id: contaId,
              tipo: trans.tipo,
              descricao: trans.descricao,
              valor_original: trans.valor,
              moeda_original: 'BRL',
              dia: trans.data?.getDate() || 1,
              editado_manualmente: false
            });

          importados++;
        } catch (error) {
          console.error('Erro ao importar transação:', error);
          erros++;
        }
      }

      toast({
        title: "Importação concluída!",
        description: `${importados} transações importadas${erros > 0 ? `, ${erros} erros` : ''}`
      });

      setStep(4);

      // Redirecionar
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      console.error('Erro ao importar:', error);
      toast({
        variant: "destructive",
        title: "Erro na importação",
        description: (error as Error).message
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Importar Extrato Bancário
          </h1>
          <p className="text-muted-foreground">
            Suba um arquivo do seu banco para análise automática com IA
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-colors ${
                  s <= step
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`flex-1 h-1 rounded transition-colors ${
                  s < step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Selecione seu extrato bancário
                </h2>
                <p className="text-muted-foreground mb-6">
                  Formatos suportados: PDF, CSV, OFX
                </p>
                <label className="inline-block">
                  <Button disabled={parsing} asChild>
                    <span className="cursor-pointer">
                      {parsing ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        'Escolher arquivo'
                      )}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".pdf,.csv,.ofx"
                    onChange={handleFileSelect}
                    disabled={parsing}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                      Privacidade Garantida
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      Seu extrato é processado com segurança. Apenas transações relevantes são salvas no banco de dados.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Preview */}
        {step === 2 && preview && (
          <Card>
            <CardHeader>
              <CardTitle>Preview das Transações</CardTitle>
              <CardDescription>
                {analyzing ? 'Analisando com IA...' : `${preview.length} transações encontradas`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyzing ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Analisando transações...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left">Data</th>
                        <th className="px-4 py-2 text-left">Descrição</th>
                        <th className="px-4 py-2 text-left">Tipo</th>
                        <th className="px-4 py-2 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 10).map((t, idx) => (
                        <tr key={idx} className="border-b border-border">
                          <td className="px-4 py-2">
                            {t.data?.toLocaleDateString('pt-BR') || '-'}
                          </td>
                          <td className="px-4 py-2">{t.descricao.substring(0, 50)}</td>
                          <td className="px-4 py-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              t.tipo === 'entrada'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {t.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            R$ {t.valor.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Análise */}
        {step === 3 && analysis && (
          <div className="space-y-6">
            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Renda Total</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    R$ {analysis.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Gastos Total</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    R$ {analysis.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Transações</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {analysis.totalTransactions}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Insights da IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.insights.map((insight, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-muted rounded-lg">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-foreground">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Categorias */}
            <Card>
              <CardHeader>
                <CardTitle>Categorias Detectadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analysis.topCategories)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, valor]) => (
                      <div key={cat} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="font-medium">{cat}</span>
                        <span className="font-semibold text-foreground">
                          R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Perfil Comportamental */}
            <Card>
              <CardHeader>
                <CardTitle>Perfil Comportamental</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Frequência de Gastos</p>
                    <p className="text-xl font-bold text-foreground">
                      {analysis.behaviorProfile.frequenciaGastos} transações
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Gasto Diário Médio</p>
                    <p className="text-xl font-bold text-foreground">
                      R$ {analysis.behaviorProfile.gastaoDiaria?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing}
                className="flex-1"
              >
                {importing ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  'Importar para o App'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Sucesso */}
        {step === 4 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Extrato Importado com Sucesso!
              </h2>
              <p className="text-muted-foreground mb-6">
                Todas as transações foram adicionadas à sua conta e categorizadas automaticamente.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Ir para Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
