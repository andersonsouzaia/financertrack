/**
 * Statement Parser - Parsing de extratos bancários
 * Suporta: CSV, PDF e OFX
 */

export interface Transaction {
  data: Date | null;
  descricao: string;
  tipo: 'entrada' | 'saida_fixa' | 'diario';
  valor: number;
  saldo?: number;
}

/**
 * Parse CSV bancário
 */
export function parseCSV(csvText: string): Transaction[] {
  try {
    const lines = csvText.trim().split('\n');
    const transactions: Transaction[] = [];

    // Detectar formato do CSV (diferentes bancos têm formatos diferentes)
    const headers = lines[0].split(',').map(h => h.toLowerCase().trim());

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
      
      // Mapear colunas
      const transaction: Transaction = {
        data: parseDate(values[0]),
        descricao: values[1] || '',
        tipo: detectType(values[1], values[2]),
        valor: Math.abs(parseFloat(values[2].replace(/[^\d.,-]/g, '').replace(',', '.')) || 0),
        saldo: parseFloat(values[3]?.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0
      };

      if (transaction.data && transaction.descricao) {
        transactions.push(transaction);
      }
    }

    return transactions;
  } catch (error) {
    console.error('Erro ao parsear CSV:', error);
    throw new Error('Erro ao processar arquivo CSV: ' + (error as Error).message);
  }
}

/**
 * Parse PDF bancário usando text extraction
 */
export async function parsePDF(pdfFile: ArrayBuffer): Promise<Transaction[]> {
  try {
    // Importar pdfjs-dist dinamicamente
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configurar worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    const pdf = await pdfjsLib.getDocument({ data: pdfFile }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return parseTransactionsFromText(fullText);
  } catch (error) {
    console.error('Erro ao parsear PDF:', error);
    throw new Error('Erro ao processar arquivo PDF: ' + (error as Error).message);
  }
}

/**
 * Parse OFX (Open Financial Exchange)
 */
export function parseOFX(ofxText: string): Transaction[] {
  try {
    const transactions: Transaction[] = [];
    
    // Regex para extrair transações OFX
    const stmtLines = ofxText.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/g) || [];

    stmtLines.forEach(line => {
      const data = extractOFXField(line, 'DTPOSTED');
      const descricao = extractOFXField(line, 'MEMO') || extractOFXField(line, 'NAME');
      const valor = parseFloat(extractOFXField(line, 'TRNAMT')) || 0;

      if (data && descricao) {
        transactions.push({
          data: parseDate(data),
          descricao: descricao,
          tipo: valor > 0 ? 'entrada' : 'saida_fixa',
          valor: Math.abs(valor),
          saldo: 0
        });
      }
    });

    return transactions;
  } catch (error) {
    console.error('Erro ao parsear OFX:', error);
    throw new Error('Erro ao processar arquivo OFX: ' + (error as Error).message);
  }
}

/**
 * Extrair campo OFX
 */
function extractOFXField(text: string, fieldName: string): string {
  const regex = new RegExp(`<${fieldName}>([^<]+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Parse transações de texto (para PDF)
 */
function parseTransactionsFromText(text: string): Transaction[] {
  const transactions: Transaction[] = [];
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Procurar por padrão de data (DD/MM/YYYY ou DD/MM/YY)
    const dateMatch = line.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    
    if (dateMatch) {
      // Procurar por valor na mesma linha ou próximas
      const searchText = lines.slice(i, i + 3).join(' ');
      const valorMatch = searchText.match(/R\$?\s*([\d.,]+)/i);
      
      if (valorMatch) {
        const descricao = line
          .substring(dateMatch[0].length)
          .replace(/R\$?\s*[\d.,]+/gi, '')
          .trim();

        if (descricao.length > 0) {
          const valor = parseFloat(valorMatch[1].replace(/\./g, '').replace(',', '.'));
          
          transactions.push({
            data: parseDate(dateMatch[0]),
            descricao: descricao.substring(0, 100),
            tipo: line.toLowerCase().includes('entrada') || line.toLowerCase().includes('crédito') 
              ? 'entrada' 
              : 'saida_fixa',
            valor: Math.abs(valor),
            saldo: 0
          });
        }
      }
    }
  }

  return transactions;
}

/**
 * Parse data de string
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Tentar formatos: DD/MM/YYYY, YYYY-MM-DD, YYYYMMDD, DDMMYYYY
  const formats = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,  // 01/01/2025
    /(\d{4})[\/\-](\d{2})[\/\-](\d{2})/,      // 2025-01-01
    /(\d{8})/,                                 // 20250101 ou 01012025
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/   // 01/01/25
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      let day: string, month: string, year: string;
      
      if (format === formats[0]) {
        [, day, month, year] = match;
      } else if (format === formats[1]) {
        [, year, month, day] = match;
      } else if (format === formats[2]) {
        const digits = match[1];
        if (digits.startsWith('20')) {
          // YYYYMMDD
          year = digits.substring(0, 4);
          month = digits.substring(4, 6);
          day = digits.substring(6, 8);
        } else {
          // DDMMYYYY
          day = digits.substring(0, 2);
          month = digits.substring(2, 4);
          year = digits.substring(4, 8);
        }
      } else {
        // DD/MM/YY
        [, day, month, year] = match;
        year = '20' + year; // Assumir 2000+
      }
      
      const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  return null;
}

/**
 * Detectar tipo de transação
 */
function detectType(descricao: string, valor: string): 'entrada' | 'saida_fixa' | 'diario' {
  const desc = (descricao || '').toLowerCase();
  const val = parseFloat((valor || '0').replace(/[^\d.,-]/g, '').replace(',', '.'));

  if (val > 0) return 'entrada';
  
  // Padrões para diferentes tipos
  if (desc.includes('salário') || desc.includes('salario') || desc.includes('pagamento')) return 'entrada';
  if (desc.includes('aluguel') || desc.includes('luz') || desc.includes('água') || desc.includes('internet')) return 'saida_fixa';
  if (desc.includes('pix') || desc.includes('transferência') || desc.includes('transferencia')) return 'saida_fixa';
  if (desc.includes('débito') || desc.includes('debito') || desc.includes('compra')) return 'diario';
  
  return 'saida_fixa';
}
