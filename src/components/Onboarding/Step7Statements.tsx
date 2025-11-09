import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { parseCSV, parsePDF, parseOFX, Transaction } from '@/lib/statementParser';
import { analyzeStatement } from '@/lib/statementAnalyzer';
import { ensureMonthExists } from '@/lib/monthHelper';
import { cn } from '@/lib/utils';

interface OnboardingStep7StatementsProps {
  user: any;
  data: any;
  onDataChange: (data: any) => void;
}

export default function OnboardingStep7Statements({
  user,
  data,
  onDataChange,
}: OnboardingStep7StatementsProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<Transaction[] | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !user) return;

    setFile(selectedFile);
    setParsing(true);
    setAnalysis(null);

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
        throw new Error('Formato não suportado. Use PDF, CSV ou OFX.');
      }

      if (transactions.length === 0) {
        throw new Error('Nenhuma transação encontrada no arquivo.');
      }

      setPreview(transactions);
      toast({
        title: 'Extrato carregado!',
        description: `${transactions.length} transações encontradas. Analise-as antes de importar.`,
      });
    } catch (error: any) {
      console.error('Erro ao parsear extrato:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao ler arquivo',
        description: error.message,
      });
      setFile(null);
      setPreview(null);
    } finally {
      setParsing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!preview || preview.length === 0) return;
    setAnalyzing(true);

    try {
      const result = await analyzeStatement(preview);
      setAnalysis(result);
      toast({
        title: 'Análise concluída!',
        description: 'Revise o resumo antes de importar suas transações.',
      });
    } catch (error: any) {
      console.error('Erro ao analisar extrato:', error);
      toast({
        variant: 'destructive',
        title: 'Erro na análise',
        description: error.message,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImport = async () => {
    if (!analysis || !analysis.transactions || !user) {
      toast({
        variant: 'destructive',
        title: 'Dados insuficientes',
        description: 'Analise o extrato antes de importar.',
      });
      return;
    }

    setImporting(true);

    try {
      const { month } = await ensureMonthExists(user.id);
      const mesId = month.id;

      const { data: categoriasExistentes } = await supabase
        .from('categorias_saidas')
        .select('id, nome')
        .eq('user_id', user.id);

      const categoriaMap: Record<string, string> = {};
      categoriasExistentes?.forEach((categoria) => {
        categoriaMap[categoria.nome] = categoria.id;
      });

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
        throw new Error('Não foi possível identificar uma conta bancária para salvar as transações.');
      }

      let importados = 0;
      let erros = 0;

      for (const trans of analysis.transactions) {
        try {
          let categoriaId = categoriaMap[trans.categoria];

          if (!categoriaId) {
            const { data: novaCategoria } = await supabase
              .from('categorias_saidas')
              .insert({
                user_id: user.id,
                nome: trans.categoria,
                icone: '📌',
                cor: '#3b82f6',
                tipo: trans.tipo === 'entrada' ? 'fixa' : 'variavel',
                padrao: false,
              })
              .select()
              .single();

            if (novaCategoria) {
              categoriaId = novaCategoria.id;
              categoriaMap[trans.categoria] = novaCategoria.id;
            }
          }

          await supabase.from('transacoes').insert({
            user_id: user.id,
            mes_financeiro_id: mesId,
            categoria_id: categoriaId || null,
            banco_conta_id: contaId,
            tipo: trans.tipo,
            descricao: trans.descricao,
            valor_original: trans.valor,
            moeda_original: 'BRL',
            dia: trans.data?.getDate() || 1,
            editado_manualmente: false,
          });

          importados++;
        } catch (error) {
          console.error('Erro ao importar transação:', error);
          erros++;
        }
      }

      toast({
        title: 'Extrato importado!',
        description: `${importados} transações adicionadas automaticamente${erros > 0 ? `, ${erros} com erro` : ''}.`,
      });
      onDataChange({ extratos_importados: true });
      setImporting(false);
      setFile(null);
      setPreview(null);
      setAnalysis(null);
    } catch (error: any) {
      console.error('Erro na importação inicial:', error);
      toast({
        variant: 'destructive',
        title: 'Erro na importação',
        description: error.message,
      });
      setImporting(false);
    }
  };

  const totalIncome = analysis?.totalIncome ?? 0;
  const totalExpenses = analysis?.totalExpenses ?? 0;
  const saldoProjetado = totalIncome - totalExpenses;
  const mainInsight = analysis?.insights?.[0] ?? null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Importe seus extratos</CardTitle>
          <CardDescription>
            Suba um arquivo agora ou pule este passo para importar mais tarde nas configurações.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
            <Upload className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Formatos aceitos: PDF, CSV ou OFX.
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
                    'Selecionar arquivo'
                  )}
                </span>
              </Button>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.csv,.ofx"
                onChange={handleFileSelect}
                disabled={parsing}
              />
            </label>
            {file && (
              <p className="mt-3 text-sm text-muted-foreground">
                Arquivo selecionado: <span className="font-medium text-foreground">{file.name}</span>
              </p>
            )}
          </div>

          <div className="rounded-lg bg-muted/40 p-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <p>
                Se preferir, você pode pular este passo agora e importar extratos mais tarde em{' '}
                <span className="font-medium">Configurações &gt; Financeiro</span>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>Pré-visualização</CardTitle>
            <CardDescription>Confira as primeiras transações antes de importar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto rounded-md border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/70">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Data</th>
                    <th className="px-4 py-2 text-left font-medium">Descrição</th>
                    <th className="px-4 py-2 text-left font-medium">Tipo</th>
                    <th className="px-4 py-2 text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((t, idx) => (
                    <tr key={idx} className="border-b border-border/60">
                      <td className="px-4 py-2">
                        {t.data?.toLocaleDateString('pt-BR') || '—'}
                      </td>
                      <td className="px-4 py-2">{t.descricao}</td>
                      <td className="px-4 py-2">
                        <span
                          className={cn(
                            'rounded px-2 py-1 text-xs uppercase',
                            t.tipo === 'entrada'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          )}
                        >
                          {t.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-medium">
                        {t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  'Analisar automaticamente'
                )}
              </Button>
              {mainInsight && (
                <p className="text-sm text-muted-foreground">
                  Insight inicial: <span className="font-semibold text-foreground">{mainInsight}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo da análise</CardTitle>
            <CardDescription>
              Importaremos as transações com as categorias sugeridas automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">Entradas</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">Saídas</p>
                <p className="text-2xl font-bold text-red-600">
                  {totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">Saldo projetado</p>
                <p
                  className={cn(
                    'text-2xl font-bold',
                    saldoProjetado >= 0 ? 'text-emerald-600' : 'text-red-600'
                  )}
                >
                  {saldoProjetado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="font-semibold">Pronto para importar</span>
              </div>
              <p className="mt-2 text-muted-foreground">
                As transações serão associadas às categorias detectadas. Você poderá ajustar depois.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button onClick={handleImport} disabled={importing} className="gap-2">
                  {importing ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    'Importar agora'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setAnalysis(null);
                    setPreview(null);
                    setFile(null);
                  }}
                >
                  Escolher outro arquivo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {data.extratos_importados && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          ✅ Extratos importados com sucesso. Você pode avançar para o próximo passo.
        </div>
      )}
    </div>
  );
}

