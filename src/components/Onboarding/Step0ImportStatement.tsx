import { useState } from 'react';
import { Upload, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseCSV, parsePDF, parseOFX, Transaction } from '@/lib/statementParser';
import { useToast } from '@/hooks/use-toast';

interface Step0Props {
  onNext: (transactions?: Transaction[]) => void;
  onSkip: () => void;
}

export default function OnboardingStep0({ onNext, onSkip }: Step0Props) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setProcessing(true);

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

      toast({
        title: "Arquivo processado!",
        description: `${transactions.length} transações encontradas`
      });

      // Passar transações para o próximo step
      onNext(transactions);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        variant: "destructive",
        title: "Erro ao processar arquivo",
        description: (error as Error).message
      });
      setFile(null);
      setProcessing(false);
    }
  };

  return (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4">📤</div>
      
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Importe seu Extrato Bancário
        </h1>
        <p className="text-muted-foreground text-lg">
          Deixe-nos analisar seus gastos anteriores para categorização automática
        </p>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-lg text-left space-y-3 border border-emerald-200 dark:border-emerald-800">
        <p className="font-semibold text-foreground">Benefícios:</p>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>Categorização automática de transações com IA</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>Identificação de padrões de gasto</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>Recomendações personalizadas</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>Dashboard pré-populado com dados históricos</span>
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <label className="inline-block">
          <Button disabled={processing} size="lg" asChild>
            <span className="cursor-pointer">
              {processing ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar Arquivo (PDF, CSV ou OFX)
                </>
              )}
            </span>
          </Button>
          <input
            type="file"
            accept=".pdf,.csv,.ofx"
            onChange={handleImport}
            disabled={processing}
            className="hidden"
          />
        </label>

        <p className="text-sm text-muted-foreground">
          ou{' '}
          <button
            onClick={onSkip}
            disabled={processing}
            className="text-primary hover:underline font-medium"
          >
            pular por enquanto
          </button>
        </p>
      </div>

      <div className="mt-8 bg-muted/50 p-4 rounded-lg border border-border">
        <p className="text-xs text-muted-foreground text-center">
          🔒 Seus dados são processados com segurança e privacidade total
        </p>
      </div>
    </div>
  );
}
