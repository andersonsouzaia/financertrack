# 📤 Guia de Importação de Extratos Bancários

## 🎯 Visão Geral

Sistema completo para importar, analisar e categorizar extratos bancários automaticamente usando IA.

## ✨ Funcionalidades

### 1. **Parsing Automático**
- ✅ Suporte para **PDF**, **CSV** e **OFX**
- ✅ Detecção automática de formato
- ✅ Extração inteligente de datas, valores e descrições
- ✅ Compatível com diferentes formatos de bancos brasileiros

### 2. **Análise com IA**
- 🤖 Classificação automática de categorias
- 📊 Identificação de padrões de comportamento
- 💡 Insights personalizados
- ⚠️ Alertas de risco financeiro
- 📈 Cálculo de métricas (gasto médio diário, frequência, etc)

### 3. **Importação Inteligente**
- 🔄 Criação automática de categorias não existentes
- 📅 Associação com mês financeiro correto
- 🏦 Vinculação com conta bancária
- ✅ Validação de duplicatas

---

## 🚀 Como Usar

### 1. **Acesso**

Existem **2 formas** de acessar:

#### Opção A: Durante o Onboarding (Novo Usuário)
1. Faça cadastro no app
2. **Step 0** (opcional): Importar Extrato
3. Faça upload do arquivo
4. IA analisa e importa automaticamente
5. Continue com onboarding normal

#### Opção B: Dashboard (Usuário Existente)
1. Faça login
2. Clique em **"Importar Extrato"** no header
3. Siga o fluxo de importação

---

### 2. **Fluxo de Importação**

```
STEP 1: Upload
├── Escolher arquivo (PDF, CSV ou OFX)
└── Sistema processa automaticamente
    ↓
STEP 2: Preview
├── Visualizar transações encontradas
└── IA começa análise automática
    ↓
STEP 3: Análise com IA
├── Resumo financeiro (renda vs gastos)
├── Insights personalizados
├── Categorias detectadas
├── Perfil comportamental
└── Alertas de risco (se houver)
    ↓
STEP 4: Importação
├── Criação automática de categorias
├── Inserção no banco de dados
└── Redirecionamento para Dashboard
    ↓
✅ Dashboard populado com dados históricos
```

---

## 📁 Formatos Suportados

### 1. **CSV (Comma-Separated Values)**

Exemplo de formato esperado:
```csv
Data,Descrição,Valor,Saldo
01/01/2025,Supermercado XYZ,-150.00,2850.00
02/01/2025,Salário,3000.00,5850.00
03/01/2025,Uber,-25.50,5824.50
```

**Requisitos:**
- Primeira linha: cabeçalhos
- Colunas: Data, Descrição, Valor
- Data: DD/MM/YYYY ou YYYY-MM-DD
- Valores negativos para débitos

---

### 2. **PDF (Portable Document Format)**

Funciona com extratos em PDF de bancos como:
- Nubank
- Bradesco
- Itaú
- Santander
- Banco do Brasil
- Inter
- Outros

**O que é extraído:**
- Datas (diversos formatos)
- Descrições de transações
- Valores (R$ ou sem símbolo)
- Identificação de tipo (débito/crédito)

---

### 3. **OFX (Open Financial Exchange)**

Formato padrão de intercâmbio financeiro.

Exemplo:
```xml
<OFX>
  <STMTTRN>
    <DTPOSTED>20250101</DTPOSTED>
    <TRNAMT>-150.00</TRNAMT>
    <MEMO>Supermercado XYZ</MEMO>
  </STMTTRN>
</OFX>
```

**Vantagens:**
- Formato estruturado
- Parsing mais preciso
- Menos erros de interpretação

---

## 🤖 Análise com IA

### Métricas Calculadas

1. **Renda Total**
   - Soma de todas entradas

2. **Gastos Total**
   - Soma de todas saídas

3. **Frequência de Gastos**
   - Número de transações de débito

4. **Gasto Diário Médio**
   - Total de gastos ÷ número de dias

5. **Categorias Predominantes**
   - Top 5 categorias por valor

---

### Insights Gerados

A IA gera automaticamente:

#### 1. **Saúde Financeira**
```
✅ "Excelente - apenas 45% da renda foi gasto"
✓ "Gastos controlados em 65% da renda"
⚠️ "Seus gastos representam 95% da renda - aperte os cintos!"
```

#### 2. **Categoria Dominante**
```
📊 "Maior gasto em Alimentação: 35% do total"
```

#### 3. **Padrões Detectados**
```
📱 "47 transações via PIX detectadas"
💡 "Muitos gastos pequenos - considere consolidar compras"
```

#### 4. **Alertas de Risco**
```
⚠️ "Gastos muito superiores à renda - possível endividamento"
```

#### 5. **Recomendações**
```
💰 "Você economizou R$ 850,00 neste período!"
💡 "Recomendação: Busque fontes adicionais de renda"
```

---

### Categorização Automática

A IA classifica cada transação em uma das categorias:

| Categoria | Exemplos |
|-----------|----------|
| 🍕 Alimentação | Supermercado, restaurante, ifood |
| 🚗 Transporte | Uber, gasolina, ônibus |
| 🏠 Moradia | Aluguel, luz, água, internet |
| 🎮 Diversão | Cinema, streaming, jogos |
| 💆 Saúde/Beleza | Farmácia, academia, salão |
| 👗 Roupas/Acessórios | Loja de roupa, calçados |
| 📚 Educação | Curso, livros, mensalidade |
| 💻 Setup/Equipamentos | Eletrônicos, móveis |
| 📱 Assinaturas | Netflix, Spotify, etc |
| ❓ Outro | Não identificado |

---

## 🔒 Segurança e Privacidade

### O que é armazenado?

✅ **SIM**
- Transações (data, descrição, valor)
- Categorias atribuídas
- Insights agregados

❌ **NÃO**
- Arquivo original
- Senhas bancárias
- Dados sensíveis do banco
- Número completo de cartões

### Privacidade

- ✅ Processamento local do arquivo
- ✅ Apenas dados relevantes são enviados ao banco
- ✅ Conformidade com LGPD
- ✅ Dados criptografados em trânsito

---

## 🛠️ Estrutura Técnica

### Arquivos Criados

```
src/lib/
├── statementParser.ts        # Parsing de PDF/CSV/OFX
└── statementAnalyzer.ts       # Análise com IA

src/pages/
└── ImportStatement.tsx        # Página principal

src/components/Onboarding/
└── Step0ImportStatement.tsx   # Step opcional
```

### Fluxo de Dados

```
1. UPLOAD
   └── Usuário seleciona arquivo
       ↓
2. PARSING
   └── statementParser.ts processa
       ├── parseCSV()
       ├── parsePDF()
       └── parseOFX()
       ↓
3. ANÁLISE
   └── statementAnalyzer.ts
       ├── Classificação IA (openai.js)
       ├── Cálculo de métricas
       └── Geração de insights
       ↓
4. IMPORTAÇÃO
   └── Inserção no Supabase
       ├── meses_financeiros
       ├── categorias_saidas
       ├── bancos_contas
       └── transacoes
       ↓
5. ✅ DASHBOARD POPULADO
```

---

## 💡 Dicas de Uso

### Para CSV

1. ✅ Exporte do app do banco
2. ✅ Mantenha cabeçalhos originais
3. ✅ Não edite manualmente
4. ⚠️ Evite símbolos especiais na descrição

### Para PDF

1. ✅ Use extrato original do banco
2. ✅ Evite PDFs escaneados (OCR é limitado)
3. ✅ Prefira extrato completo do mês
4. ⚠️ PDFs muito grandes podem demorar

### Para OFX

1. ✅ Formato mais confiável
2. ✅ Disponível em muitos bancos
3. ✅ Menor chance de erro
4. ✅ Mais rápido que PDF

---

## ❓ Troubleshooting

### "Nenhuma transação encontrada"

**Causa:** Formato do arquivo não reconhecido

**Solução:**
1. Verifique se é PDF/CSV/OFX válido
2. Tente exportar novamente do banco
3. Use formato OFX se disponível

---

### "Erro ao classificar transação"

**Causa:** Falha na API da OpenAI

**Solução:**
1. Verifique conexão com internet
2. Tente novamente em alguns segundos
3. Entre em contato com suporte

---

### Categorias incorretas

**Causa:** IA pode errar em casos ambíguos

**Solução:**
1. ✅ Transações são importadas mesmo com erro
2. ✅ Você pode editar manualmente depois
3. ✅ Sistema aprende com correções

---

## 🎯 Próximos Passos

Após importar:

1. ✅ Verifique transações no Dashboard
2. ✅ Corrija categorias se necessário
3. ✅ Adicione observações importantes
4. ✅ Configure metas de gastos
5. ✅ Aproveite insights da IA

---

## 📊 Exemplo Real

### Antes da Importação
```
Dashboard vazio
├── Saldo: R$ 0,00
├── Transações: 0
└── Categorias: Padrões apenas
```

### Depois da Importação
```
Dashboard completo
├── Saldo: R$ 2.847,50
├── Transações: 187 importadas
├── Categorias: 12 detectadas
├── Insights: 5 gerados
└── Alertas: 1 (gasto alto em Alimentação)
```

---

## 🆘 Suporte

Problemas ou dúvidas?

1. Verifique este guia
2. Consulte [documentação técnica](./README.md)
3. Abra issue no GitHub
4. Entre em contato com suporte

---

**Sistema completo de importação de extratos! 🎉**
