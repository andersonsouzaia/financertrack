# 📘 FinanceTrack - Documentação Técnica Completa
## Sistema de Gestão Financeira Pessoal

**Cliente:** Juliano
**Data:** Fevereiro 2026
**Versão:** 1.0

---

> 💡 **Esta documentação foi criada para ser compreendida tanto por profissionais técnicos quanto por pessoas sem conhecimento técnico. Todas as explicações técnicas são acompanhadas de exemplos práticos e linguagem simples.**

---

## 📋 Índice

1. [Visão Geral - O que é o FinanceTrack?](#1-visão-geral)
2. [Por que o FinanceTrack é a Solução Ideal](#2-por-que-o-financetrack)
3. [Como Funciona - Arquitetura Simplificada](#3-como-funciona)
4. [Banco de Dados - Entendendo a Estrutura](#4-banco-de-dados)
5. [Funcionalidades Detalhadas](#5-funcionalidades)
6. [Infraestrutura e Custos](#6-infraestrutura-e-custos)
7. [Cronograma de Desenvolvimento](#7-cronograma)
8. [Tutoriais e Suporte](#8-tutoriais)
9. [Anexos Técnicos](#9-anexos)


---

## 1. Visão Geral - O que é o FinanceTrack?

### 1.1 O Problema que Resolvemos

Imagine que você precisa saber:
- ✅ Quanto você gastou este mês?
- ✅ Em que categorias você mais gasta?
- ✅ Você está conseguindo guardar dinheiro?
- ✅ Quanto você tem investido?
- ✅ Qual cartão de crédito você mais usa?

**A maioria das pessoas não consegue responder essas perguntas rapidamente.** É aí que o FinanceTrack entra em ação!

### 1.2 A Solução: FinanceTrack

O **FinanceTrack** é como ter um **assistente financeiro pessoal** disponível 24 horas por dia, que:

🎯 **Organiza suas finanças automaticamente**
- Você só precisa informar suas receitas e despesas (ou importar do banco)
- O sistema organiza tudo por categorias, meses e tipos

🤖 **Usa Inteligência Artificial para ajudar**
- Classifica automaticamente seus gastos
- Aprende seus padrões de consumo
- Dá recomendações personalizadas

📊 **Mostra tudo de forma visual**
- Gráficos fáceis de entender
- Resumos claros do seu mês e ano
- Alertas quando você está gastando demais

💳 **Controla seus cartões**
- Acompanha faturas automaticamente
- Mostra quanto você gastou em cada cartão
- Avisa quando está próximo do limite

🎯 **Ajuda você a alcançar suas metas**
- Metas mensais (ex: "Guardar R$ 500")
- Metas de longo prazo (ex: "Viagem para Europa")
- Acompanhamento visual do progresso

### 1.3 Para Quem é o FinanceTrack?

O FinanceTrack é perfeito para:

- 👤 **Você que quer ter controle financeiro** mas não sabe por onde começar
- 💼 **Freelancers e autônomos** que precisam organizar receitas variáveis
- 👨‍👩‍👧‍👦 **Famílias** que querem planejar o futuro juntos
- 💰 **Investidores iniciantes** que querem acompanhar seus investimentos
- 📱 **Pessoas modernas** que preferem tecnologia a planilhas antigas

---

## 2. Por que o FinanceTrack é a Solução Ideal

### 2.1 Diferenciais que Fazem a Diferença

#### 🤖 Inteligência Artificial Integrada
**O que é:** O sistema usa tecnologia de ponta (OpenAI GPT-4) para entender suas transações.

**Como funciona na prática:**
- Você escreve: "Gastei 50 reais no supermercado"
- A IA entende: É uma despesa de "Alimentação" no valor de R$ 50,00
- O sistema salva automaticamente na categoria certa

**Benefício para você:** Menos trabalho manual, mais precisão!

#### 📄 Importação Inteligente de Extratos
**O que é:** Você pode importar seus extratos bancários diretamente.

**Como funciona na prática:**
1. Você baixa o extrato do seu banco (PDF ou CSV)
2. Faz upload no FinanceTrack
3. O sistema lê tudo automaticamente
4. Você só confirma e pronto!

**Benefício para você:** Não precisa digitar transação por transação!

#### 🧠 Análise Comportamental
**O que é:** O sistema analisa seus padrões de gasto e te ajuda a entender seu comportamento financeiro.

**Como funciona na prática:**
- Identifica que você gasta mais aos finais de semana
- Mostra quais categorias consomem mais sua renda
- Sugere formas de economizar baseado no seu perfil

**Benefício para você:** Autoconhecimento financeiro = melhores decisões!

#### 🔒 Segurança de Dados
**O que é:** Seus dados são protegidos com tecnologia de ponta.

**Como funciona na prática:**
- Cada usuário só vê seus próprios dados
- Tudo é criptografado
- Conformidade com LGPD (Lei Geral de Proteção de Dados)

**Benefício para você:** Seus dados financeiros estão seguros!

---

## 3. Como Funciona - Arquitetura Simplificada

### 3.1 Entendendo a Tecnologia (de Forma Simples)

Vamos explicar como o sistema funciona usando uma analogia:

**Imagine uma casa:**

🏠 **Frontend (Fachada da Casa)**
- É o que você vê e interage
- Botões, gráficos, formulários
- Feito com React (tecnologia moderna da web)

🏗️ **Backend (Estrutura da Casa)**
- É o que acontece "por trás dos panos"
- Processa suas informações
- Feito com Supabase (plataforma profissional)

🗄️ **Banco de Dados (Armário de Arquivos)**
- Onde todas as informações são guardadas
- Organizado e seguro
- Feito com PostgreSQL (banco de dados profissional)

🤖 **Inteligência Artificial (Assistente Inteligente)**
- Ajuda a classificar e entender seus dados
- Feito com OpenAI (mesma tecnologia do ChatGPT)

### 3.2 Fluxo de Funcionamento

Vamos ver como funciona quando você adiciona uma transação:

```
1. Você preenche o formulário
   ↓
2. Sistema valida os dados (confere se está tudo certo)
   ↓
3. Dados são salvos no banco de dados
   ↓
4. Sistema atualiza os gráficos automaticamente
   ↓
5. Você vê o resultado atualizado na tela
```

**Tempo total:** Menos de 1 segundo! ⚡

### 3.3 Tecnologias Utilizadas (Para Técnicos)

#### Frontend
- **React 18+** - Framework moderno para interfaces
- **TypeScript** - JavaScript com tipos (mais seguro)
- **Tailwind CSS** - Estilização rápida e responsiva
- **Recharts** - Gráficos interativos

#### Backend
- **Supabase** - Plataforma completa (banco + autenticação)
- **PostgreSQL** - Banco de dados relacional robusto
- **Edge Functions** - Processamento serverless

#### IA
- **OpenAI GPT-4o-mini** - Classificação inteligente de transações

---

## 4. Banco de Dados - Entendendo a Estrutura

### 4.1 O que é um Banco de Dados? (Explicação Simples)

**Analogia:** Imagine um arquivo físico gigante, mas super organizado:

- 📁 **Pastas** = Tabelas (cada pasta guarda um tipo de informação)
- 📄 **Documentos** = Registros (cada documento é uma informação específica)
- 🏷️ **Etiquetas** = Campos (cada etiqueta identifica uma característica)

**No FinanceTrack:**
- Temos uma "pasta" para usuários
- Temos uma "pasta" para transações
- Temos uma "pasta" para categorias
- E assim por diante...

### 4.2 Estrutura Geral do Banco

O banco de dados do FinanceTrack terá **25 tabelas** organizadas assim:

```
📦 FinanceTrack Database
├── 👤 Usuários (1 tabela)
│   └── Informações dos usuários do sistema
│
├── 💰 Transações e Categorias (4 tabelas)
│   ├── Transações financeiras
│   ├── Categorias de gastos
│   ├── Contas bancárias
│   └── Observações sobre gastos
│
├── ⚙️ Configurações (3 tabelas)
│   ├── Configurações do usuário
│   ├── Dados do onboarding
│   └── Configurações de saldo
│
├── 📈 Investimentos e Metas (4 tabelas)
│   ├── Investimentos cadastrados
│   ├── Metas de gastos
│   ├── Projeções financeiras
│   └── Transações recorrentes
│
├── 🧠 Análises e Insights (3 tabelas)
│   ├── Insights diários
│   ├── Análise comportamental
│   └── Observações de gastos
│
├── 💬 Comunicação (2 tabelas)
│   ├── Histórico de chat com IA
│   └── Notificações
│
├── 👨‍👩‍👧 Renda Compartilhada (2 tabelas)
│   ├── Grupos de renda compartilhada
│   └── Membros dos grupos
│
└── 🔧 Sistema e Logs (6 tabelas)
    ├── Preferências do usuário
    ├── Dispositivos
    ├── Feedback
    ├── Eventos de ads
    ├── Cotações históricas
    └── Logs do sistema
```

### 4.3 Tabelas Principais Explicadas (Técnico + Simples)

#### 4.3.1 Tabela `users` - Usuários do Sistema

**📋 O que guarda:** Informações de cada pessoa que usa o sistema

**🔧 Estrutura Técnica:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,                    -- Identificador único
  email TEXT UNIQUE NOT NULL,             -- Email (usado para login)
  nome_completo TEXT NOT NULL,            -- Nome completo
  password_hash TEXT,                     -- Senha criptografada
  foto_perfil TEXT,                       -- URL da foto
  data_nascimento DATE,                   -- Data de nascimento
  pais TEXT,                              -- País
  timezone TEXT,                          -- Fuso horário
  email_verificado BOOLEAN DEFAULT false, -- Email confirmado?
  google_id TEXT,                         -- ID do Google (se login social)
  apple_id TEXT,                          -- ID da Apple (se login social)
  microsoft_id TEXT,                      -- ID da Microsoft (se login social)
  ativo BOOLEAN DEFAULT true,            -- Conta ativa?
  aceita_lgpd BOOLEAN DEFAULT false,      -- Aceitou termos LGPD?
  data_criacao TIMESTAMPTZ DEFAULT NOW(), -- Quando foi criado
  data_atualizacao TIMESTAMPTZ DEFAULT NOW() -- Última atualização
);
```

**💡 Explicação Simples:**
Esta tabela guarda informações básicas de cada usuário. É como uma ficha cadastral digital.

**📝 Exemplo Prático:**
```
Usuário: João Silva
Email: joao@email.com
Criado em: 01/02/2026
Email verificado: Sim ✅
```

**🎯 Por que é importante:** É a base de tudo! Sem usuários, não há sistema. Cada pessoa que usa o FinanceTrack tem um registro aqui.

#### 4.3.2 Tabela `meses_financeiros` - Períodos Mensais

**📋 O que guarda:** Informações financeiras de cada mês

**🔧 Estrutura Técnica:**
```sql
CREATE TABLE meses_financeiros (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
  saldo_inicial NUMERIC(15,2),           -- Quanto tinha no início
  saldo_final NUMERIC(15,2),             -- Quanto tinha no final
  total_entradas NUMERIC(15,2) DEFAULT 0, -- Total recebido
  total_saidas NUMERIC(15,2) DEFAULT 0,   -- Total gasto
  total_diario NUMERIC(15,2) DEFAULT 0,   -- Gasto diário médio
  patrimonio_total NUMERIC(15,2),         -- Patrimônio total
  data_abertura TIMESTAMPTZ DEFAULT NOW(),
  data_fechamento TIMESTAMPTZ,
  UNIQUE(user_id, mes, ano)              -- Um mês por usuário
);
```

**💡 Explicação Simples:**
Esta tabela organiza suas finanças por mês. É como ter uma pasta para cada mês do ano.

**📝 Exemplo Prático:**
```
Mês: Fevereiro/2026
Saldo inicial: R$ 1.000,00
Total recebido: R$ 3.000,00
Total gasto: R$ 2.500,00
Saldo final: R$ 1.500,00
Status: Aberto (ainda estamos em fevereiro)
```

**🎯 Por que é importante:** Organiza suas finanças por período, facilitando análises mensais e anuais. Você pode comparar "quanto gastei em janeiro vs fevereiro".

#### 4.3.3 Tabela `transacoes` - Transações Financeiras

**📋 O que guarda:** Cada receita ou despesa que você registra

**🔧 Estrutura Técnica:**
```sql
CREATE TABLE transacoes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  mes_financeiro_id UUID NOT NULL REFERENCES meses_financeiros(id),
  banco_conta_id UUID REFERENCES bancos_contas(id),
  categoria_id UUID REFERENCES categorias_saidas(id),
  cartao_id UUID REFERENCES cartoes(id),  -- ⭐ NOVO
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida_fixa', 'diario')),
  descricao TEXT NOT NULL,
  valor_original NUMERIC(15,2) NOT NULL,
  valor_convertido NUMERIC(15,2),         -- Se for moeda diferente
  moeda_original TEXT,
  moeda_base TEXT DEFAULT 'BRL',
  taxa_conversao NUMERIC(15,6),
  dia INTEGER NOT NULL CHECK (dia >= 1 AND dia <= 31),
  recorrente BOOLEAN DEFAULT false,
  editado_manualmente BOOLEAN DEFAULT false,
  deletado BOOLEAN DEFAULT false,
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ DEFAULT NOW()
);
```

**💡 Explicação Simples:**
Esta é a tabela mais importante! Guarda cada gasto ou receita que você tem. É como um livro-caixa digital.

**📝 Exemplo Prático:**
```
Descrição: Supermercado Extra
Tipo: Saída (despesa)
Valor: R$ 150,00
Categoria: Alimentação
Conta: Nubank
Cartão: Nubank Roxinho ⭐ NOVO
Dia: 5
Data: 05/02/2026
```

**🎯 Por que é importante:** É o coração do sistema! Todas as análises, gráficos e resumos são calculados a partir das transações que estão aqui.

**🔗 Relacionamentos:**
- Pertence a um usuário
- Pertence a um mês financeiro
- Tem uma categoria
- Pode ter uma conta bancária
- Pode ter um cartão ⭐ NOVO

#### 4.3.4 Tabela `categorias_saidas` - Categorias de Gastos

**📋 O que guarda:** As categorias que você usa para organizar seus gastos

**🔧 Estrutura Técnica:**
```sql
CREATE TABLE categorias_saidas (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  nome TEXT NOT NULL,                     -- Ex: "Alimentação"
  tipo TEXT NOT NULL CHECK (tipo IN ('fixa', 'variavel')),
  descricao TEXT,
  icone TEXT,                             -- Emoji ou código de ícone
  cor TEXT,                               -- Código de cor (#FF5733)
  valor_esperado NUMERIC(15,2),          -- Quanto espera gastar/mês
  padrao BOOLEAN DEFAULT false,          -- É categoria padrão?
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ DEFAULT NOW()
);
```

**💡 Explicação Simples:**
Esta tabela guarda as "gavetas" onde você organiza seus gastos. É como ter pastas coloridas para diferentes tipos de despesa.

**📝 Exemplo Prático:**
```
Nome: Alimentação
Tipo: Variável (gasto que muda todo mês)
Ícone: 🍔
Cor: Verde (#22C55E)
Valor esperado: R$ 500,00/mês
```

**🎯 Por que é importante:** Organiza seus gastos de forma que você entenda onde seu dinheiro vai. Você pode ver "gastei R$ 500 em Alimentação este mês".

**🔗 Relacionamentos:**
- Pertence a um usuário
- Muitas transações podem usar esta categoria

#### 4.3.5 Tabela `bancos_contas` - Contas Bancárias

**📋 O que guarda:** Informações das suas contas bancárias

**🔧 Estrutura Técnica:**
```sql
CREATE TABLE bancos_contas (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  nome_banco TEXT NOT NULL,               -- Ex: "Nubank", "Itaú"
  tipo_conta TEXT NOT NULL,               -- "Corrente", "Poupança", etc.
  numero_conta TEXT,
  agencia TEXT,
  saldo_atual NUMERIC(15,2) NOT NULL DEFAULT 0,
  saldo_inicial NUMERIC(15,2),
  moeda TEXT DEFAULT 'BRL',
  principal BOOLEAN DEFAULT false,        -- É a conta principal?
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ DEFAULT NOW()
);
```

**💡 Explicação Simples:**
Guarda informações de cada conta bancária que você tem. É como ter um caderninho com os dados de cada banco.

**📝 Exemplo Prático:**
```
Banco: Nubank
Tipo: Conta Corrente
Saldo atual: R$ 2.500,00
Principal: Sim (esta é minha conta principal)
```

**🎯 Por que é importante:** Permite acompanhar múltiplas contas em um só lugar. Você vê o saldo total de todas as contas no dashboard.

#### 4.3.6 Tabela `cartoes` ⭐ NOVO - Cartões de Crédito/Débito

**📋 O que guarda:** Informações dos seus cartões

**🔧 Estrutura Técnica:**
```sql
CREATE TABLE cartoes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  nome TEXT NOT NULL,                     -- Ex: "Nubank", "Inter"
  tipo TEXT NOT NULL CHECK (tipo IN ('credito', 'debito', 'ambos')),
  bandeira TEXT,                          -- "Visa", "Mastercard", "Elo"
  limite NUMERIC(15,2),                   -- Limite do cartão (crédito)
  dia_fechamento INTEGER CHECK (dia_fechamento >= 1 AND dia_fechamento <= 31),
  dia_vencimento INTEGER CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  banco_conta_id UUID REFERENCES bancos_contas(id), -- Conta vinculada
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ DEFAULT NOW()
);
```

**💡 Explicação Simples:**
Guarda informações de cada cartão que você tem. É como ter um caderninho com os dados de cada cartão.

**📝 Exemplo Prático:**
```
Nome: Nubank Roxinho
Tipo: Crédito
Bandeira: Mastercard
Limite: R$ 5.000,00
Fecha: Dia 10 de cada mês
Vence: Dia 15 de cada mês
Conta vinculada: Nubank Conta Corrente
```

**🎯 Por que é importante:** Permite acompanhar faturas automaticamente e controlar gastos por cartão. Você sempre sabe quanto deve em cada cartão.

**🔗 Relacionamentos:**
- Pertence a um usuário
- Pode estar vinculado a uma conta bancária
- Muitas transações podem usar este cartão

#### 4.3.7 Tabela `faturas_cartoes` ⭐ NOVO - Faturas dos Cartões

**📋 O que guarda:** Histórico de faturas de cada cartão

**🔧 Estrutura Técnica:**
```sql
CREATE TABLE faturas_cartoes (
  id UUID PRIMARY KEY,
  cartao_id UUID NOT NULL REFERENCES cartoes(id),
  mes_referencia TEXT NOT NULL,           -- "2026-02"
  valor_total NUMERIC(15,2) NOT NULL,     -- Valor da fatura
  data_fechamento DATE,                   -- Quando fechou
  data_vencimento DATE,                   -- Quando vence
  pago BOOLEAN DEFAULT false,             -- Já foi pago?
  data_pagamento DATE,                    -- Quando foi pago
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cartao_id, mes_referencia)      -- Uma fatura por mês por cartão
);
```

**💡 Explicação Simples:**
Guarda o histórico de faturas de cada cartão. É como ter um arquivo com todas as faturas que você já recebeu.

**📝 Exemplo Prático:**
```
Cartão: Nubank Roxinho
Mês: Fevereiro/2026
Valor: R$ 1.200,00
Fecha: 10/02/2026
Vence: 15/02/2026
Pago: Sim ✅
Data pagamento: 12/02/2026
```

**🎯 Por que é importante:** Você sempre sabe quanto deve em cada cartão e quando vence. Nunca mais esquece de pagar uma fatura!

**🔗 Relacionamentos:**
- Pertence a um cartão
- É calculada automaticamente somando todas as transações daquele cartão no mês

**⚙️ Como funciona tecnicamente:**
- Quando você marca uma transação com um cartão, ela automaticamente entra na fatura daquele mês
- No final do mês, o sistema calcula o total
- Você marca como pago quando pagar

#### 4.3.8 Tabela `metas_mensais` ⭐ NOVO - Metas do Mês

**📋 O que guarda:** Metas que você quer alcançar no mês

**🔧 Estrutura Técnica:**
```sql
CREATE TABLE metas_mensais (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  mes_ano TEXT NOT NULL,                  -- "2026-02"
  tipo TEXT NOT NULL CHECK (tipo IN ('financeira', 'pessoal', 'gasto')),
  titulo TEXT NOT NULL,                   -- "Guardar R$ 500"
  descricao TEXT,
  valor_meta NUMERIC(15,2),              -- Valor da meta (se financeira)
  valor_atual NUMERIC(15,2) DEFAULT 0,   -- Quanto já alcançou
  categoria_id UUID REFERENCES categorias_saidas(id), -- Para metas de gasto
  data_limite DATE,
  concluida BOOLEAN DEFAULT false,
  prioridade INTEGER DEFAULT 5 CHECK (prioridade >= 1 AND prioridade <= 10),
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ DEFAULT NOW()
);
```

**💡 Explicação Simples:**
Guarda as metas que você quer alcançar no mês. É como ter uma lista de objetivos mensais.

**📝 Exemplo Prático:**
```
Título: Guardar R$ 500 este mês
Tipo: Financeira
Valor meta: R$ 500,00
Valor atual: R$ 300,00
Concluída: Não (60% completo) 🎯
Prioridade: Alta (8/10)
```

**🎯 Por que é importante:** Metas visuais motivam e ajudam a alcançar objetivos. Você vê o progresso em tempo real!

**🔗 Relacionamentos:**
- Pertence a um usuário
- Pode estar vinculada a uma categoria (se for meta de gasto)
- Progresso é atualizado automaticamente conforme você adiciona transações

#### 4.3.9 Tabela `metas_financeiras` ⭐ NOVO - Metas de Longo Prazo

**📋 O que guarda:** Metas financeiras maiores (ex: viagem, casa)

**🔧 Estrutura Técnica:**
```sql
CREATE TABLE metas_financeiras (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  nome TEXT NOT NULL,                     -- "Viagem para Europa"
  descricao TEXT,
  valor_meta NUMERIC(15,2) NOT NULL,     -- Valor total necessário
  valor_atual NUMERIC(15,2) DEFAULT 0,   -- Quanto já guardou
  tipo TEXT NOT NULL CHECK (tipo IN ('emergencia', 'viagem', 'imovel', 'aposentadoria', 'educacao', 'outro')),
  data_limite DATE,                       -- Quando quer alcançar
  valor_mensal_sugerido NUMERIC(15,2),   -- Quanto precisa guardar/mês
  prioridade INTEGER DEFAULT 5,
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ DEFAULT NOW()
);
```

**💡 Explicação Simples:**
Guarda metas financeiras grandes que levam meses ou anos para alcançar. É como ter um cofrinho digital para cada grande objetivo.

**📝 Exemplo Prático:**
```
Nome: Viagem para Europa
Tipo: Viagem
Valor meta: R$ 10.000,00
Valor atual: R$ 3.500,00
Data limite: 31/12/2026
Progresso: 35% 🎯
Valor mensal sugerido: R$ 542,00
```

**🎯 Por que é importante:** Metas grandes parecem mais alcançáveis quando você vê o progresso. O sistema calcula automaticamente quanto você precisa guardar por mês!

**🔗 Relacionamentos:**
- Pertence a um usuário
- Pode ter várias contribuições (tabela `contribuicoes_metas`)

#### 4.3.10 Tabela `contribuicoes_metas` ⭐ NOVO - Contribuições para Metas

**📋 O que guarda:** Cada vez que você contribui para uma meta

**🔧 Estrutura Técnica:**
```sql
CREATE TABLE contribuicoes_metas (
  id UUID PRIMARY KEY,
  meta_id UUID NOT NULL REFERENCES metas_financeiras(id),
  transacao_id UUID REFERENCES transacoes(id), -- Opcional
  valor NUMERIC(15,2) NOT NULL,
  data_contribuicao DATE NOT NULL,
  observacao TEXT,
  data_criacao TIMESTAMPTZ DEFAULT NOW()
);
```

**💡 Explicação Simples:**
Guarda cada "depósito" que você faz na sua meta. É como ter um histórico de todas as vezes que você colocou dinheiro no cofrinho.

**📝 Exemplo Prático:**
```
Meta: Viagem para Europa
Valor contribuído: R$ 500,00
Data: 05/02/2026
Observação: "Economia do mês"
```

**🎯 Por que é importante:** Você vê o histórico de como está alcançando sua meta. Motivação extra!

### 4.4 Como as Tabelas se Relacionam (Explicação Simples)

**Analogia:** Imagine uma família:

- 👨 **Usuário** = O chefe da família
- 📅 **Mês Financeiro** = Um mês específico na vida da família
- 💸 **Transações** = Cada gasto ou receita que aconteceu
- 📁 **Categorias** = Os tipos de gasto (comida, transporte, etc.)
- 🏦 **Contas Bancárias** = Onde o dinheiro está guardado
- 💳 **Cartões** = Formas de pagamento ⭐ NOVO
- 🎯 **Metas** = Objetivos que a família quer alcançar ⭐ NOVO

**Relacionamento Visual:**
```
Usuário (João)
  │
  ├── Mês: Fevereiro/2026
  │   ├── Transação 1: Supermercado
  │   │   ├── Categoria: Alimentação
  │   │   ├── Conta: Nubank
  │   │   └── Cartão: Nubank Roxinho ⭐ NOVO
  │   │
  │   ├── Transação 2: Salário
  │   │   ├── Categoria: Entrada
  │   │   └── Conta: Nubank
  │   │
  │   └── Transação 3: Uber
  │       ├── Categoria: Transporte
  │       └── Cartão: Inter ⭐ NOVO
  │
  ├── Cartões ⭐ NOVO
  │   ├── Nubank Roxinho
  │   │   └── Fatura Fevereiro: R$ 1.200,00
  │   └── Inter
  │       └── Fatura Fevereiro: R$ 350,00
  │
  └── Metas ⭐ NOVO
      ├── Meta Mensal: Guardar R$ 500 (60% completo)
      └── Meta Longo Prazo: Viagem Europa (35% completo)
```

**🔗 Relacionamentos Técnicos:**

```
users (1) ──→ (N) meses_financeiros
users (1) ──→ (N) transacoes
users (1) ──→ (N) categorias_saidas
users (1) ──→ (N) bancos_contas
users (1) ──→ (N) cartoes ⭐ NOVO
users (1) ──→ (N) metas_mensais ⭐ NOVO
users (1) ──→ (N) metas_financeiras ⭐ NOVO

meses_financeiros (1) ──→ (N) transacoes
categorias_saidas (1) ──→ (N) transacoes
bancos_contas (1) ──→ (N) transacoes
cartoes (1) ──→ (N) transacoes ⭐ NOVO
cartoes (1) ──→ (N) faturas_cartoes ⭐ NOVO
metas_financeiras (1) ──→ (N) contribuicoes_metas ⭐ NOVO
```

**💡 O que isso significa na prática:**
- Um usuário pode ter vários meses financeiros
- Um mês pode ter várias transações
- Uma transação pertence a uma categoria
- Uma transação pode usar um cartão
- Um cartão pode ter várias faturas (uma por mês)
- Uma meta pode ter várias contribuições

### 4.5 Segurança dos Dados (Row Level Security)

**🔒 O que é:** Um sistema de segurança que garante que cada usuário só vê seus próprios dados.

**💡 Como funciona na prática:**
- João faz login → Vê apenas os dados de João
- Maria faz login → Vê apenas os dados de Maria
- João nunca vê os dados de Maria (e vice-versa)

**🎯 Por que é importante:** Sua privacidade e segurança financeira estão protegidas!

**🔧 Tecnicamente:** Cada tabela tem "políticas de segurança" que verificam automaticamente se o usuário tem permissão para ver/editar aqueles dados.

**Exemplo de Política RLS:**
```sql
-- Política que permite usuários verem apenas suas próprias transações
CREATE POLICY "Usuários podem ver suas transações"
  ON transacoes FOR SELECT
  USING (auth.uid() = user_id);
```

**O que isso faz:**
- `auth.uid()` = Pega o ID do usuário logado
- `user_id` = ID do dono da transação
- Se forem iguais → Permite ver
- Se forem diferentes → Bloqueia

**✅ Benefício:** Segurança automática! Você não precisa se preocupar com isso, o sistema cuida sozinho.

---

## 5. Funcionalidades Detalhadas

### 5.1 Autenticação e Perfil

#### 🎯 O que você pode fazer:
- ✅ Criar sua conta com email e senha
- ✅ Fazer login de forma segura
- ✅ Recuperar sua senha se esquecer
- ✅ Editar seu perfil pessoal
- ✅ Adicionar foto de perfil

#### 🔧 Como funciona tecnicamente:
- Sistema usa autenticação JWT (tokens seguros)
- Senhas são criptografadas (nunca armazenadas em texto puro)
- Email é verificado via código OTP (6 dígitos)

**💡 Benefício para você:** Conta segura e fácil de usar!

### 5.2 Onboarding - Seus Primeiros Passos

#### 🎯 O que acontece:
Quando você cria sua conta, o sistema te guia em **7 passos simples**:

1. **Boas-vindas** - Te explica o que é o sistema
2. **Perfil** - Coleta seus dados básicos
3. **Renda** - Você informa quanto ganha por mês
4. **Bancos** - Você cadastra suas contas
5. **Categorias** - Você escolhe como quer organizar gastos
6. **Estilo** - Você escolhe cores e preferências
7. **Extratos** - Opcional: você pode importar extratos antigos

**⏱️ Tempo total:** 5-10 minutos

**💡 Benefício para você:** Sistema já configurado e pronto para usar!

### 5.3 Dashboard - Visão Geral do Seu Dinheiro

#### 🎯 O que você vê:
- 💰 **Saldo Atual** - Quanto você tem agora (todas as contas somadas)
- 📈 **Total de Entradas** - Quanto você recebeu este mês
- 📉 **Total de Saídas** - Quanto você gastou este mês
- 🏦 **Fundo de Emergência** - Status da sua reserva
- 🚦 **Status do Mês** - Indicador visual:
  - 🟢 Verde = Tudo sob controle
  - 🟡 Amarelo = Atenção
  - 🔴 Vermelho = Gastando demais

#### 📊 Gráficos visuais:
- 📊 Linha: Entradas vs Saídas ao longo do mês
- 🥧 Pizza: Distribuição de gastos por categoria
- 📊 Barras: Top 5 categorias que você mais gasta

**💡 Benefício para você:** Você vê sua situação financeira em segundos!

### 5.4 Transações - Registrando Receitas e Despesas

#### 🎯 Como adicionar uma transação:

**Formulário simples:**
1. Escolhe o tipo: Entrada (receita) ou Saída (despesa)
2. Escreve a descrição: "Supermercado", "Salário", etc.
3. Informa o valor: R$ 150,00
4. Escolhe a categoria: Alimentação, Transporte, etc.
5. Escolhe a conta: Nubank, Itaú, etc.
6. Escolhe o cartão (se aplicável): Nubank Roxinho ⭐ NOVO
7. Informa a data
8. Salva!

**⏱️ Tempo:** Menos de 30 segundos!

#### 📋 Visualizações disponíveis:
- 📋 **Tabela tradicional** - Como uma planilha
- 📊 **Planilha interativa** - Mais visual
- 🎴 **Cards** - Mais visual ainda

#### 🔍 Filtros poderosos:
- Por mês/ano
- Por tipo (entrada/saída)
- Por categoria
- Por conta bancária
- Por cartão ⭐ NOVO
- Busca por texto

**💡 Benefício para você:** Controle total sobre suas transações!

### 5.5 Importação de Extratos - Automatize Tudo!

#### 📄 Formatos suportados:
- 📄 **PDF** - Extratos bancários em PDF
- 📊 **CSV** - Planilhas Excel/Google Sheets
- 📋 **OFX** - Formato padrão bancário

#### 🎯 Como funciona:
1. Você baixa o extrato do seu banco
2. Faz upload no FinanceTrack
3. Sistema lê tudo automaticamente
4. IA classifica cada transação
5. Você revisa e confirma
6. Pronto! Tudo importado!

**⏱️ Tempo:** 2-5 minutos para importar um mês inteiro!

**💡 Benefício para você:** Não precisa digitar nada manualmente!

### 5.6 Categorias - Organize Seus Gastos

#### 📁 Categorias padrão incluídas:
- 🍔 Alimentação
- 🚗 Transporte
- 🏠 Moradia
- 💊 Saúde/Beleza
- 📚 Educação
- 🎮 Lazer
- 📱 Assinaturas
- 📦 Outros

#### ✨ Você também pode criar suas próprias:
- Escolhe o nome
- Escolhe um ícone
- Escolhe uma cor
- Define valor esperado por mês

**💡 Benefício para você:** Organização que faz sentido para VOCÊ!

### 5.7 Contas Bancárias - Todas em Um Lugar

#### 🎯 O que você pode fazer:
- Cadastrar múltiplas contas
- Ver saldo de cada uma
- Marcar conta principal
- Atualizar saldos manualmente

**💡 Benefício para você:** Visão consolidada de todas suas contas!

### 5.8 Cartões de Crédito ⭐ NOVO - Controle Total

#### 🎯 O que você pode fazer:
- Cadastrar todos os seus cartões
- Ver fatura de cada um automaticamente
- Acompanhar quando fecha e vence
- Ver gráfico de gastos por cartão
- Receber alertas de vencimento

#### 🔧 Como funciona tecnicamente:
- Você cadastra o cartão uma vez na tabela `cartoes`
- Toda transação que você marca com aquele cartão
- Automaticamente vai para a fatura dele (tabela `faturas_cartoes`)
- No final do mês, o sistema calcula o total
- Você marca como pago quando pagar

**📝 Exemplo prático:**
```
Cartão: Nubank Roxinho
Fatura de Fevereiro: R$ 1.200,00
Fecha: 10/02
Vence: 15/02
Status: Pago ✅
```

**💡 Benefício para você:** Nunca mais esquece de pagar uma fatura!

### 5.9 Metas do Mês ⭐ NOVO - Alcance Seus Objetivos

#### 🎯 Tipos de metas que você pode criar:

**💰 Metas Financeiras:**
- "Guardar R$ 500 este mês"
- "Investir R$ 300 este mês"

**📝 Metas Pessoais:**
- "Ler um livro"
- "Fazer exercícios 3x por semana"

**🚫 Metas de Gastos:**
- "Não gastar mais de R$ 200 em delivery"
- "Gastar menos de R$ 100 em roupas"

#### 📊 Acompanhamento visual:
- Barra de progresso
- Porcentagem completa
- Alertas quando próximo do limite
- Notificação quando alcançar!

**💡 Benefício para você:** Metas visuais = mais motivação = mais sucesso!

### 5.10 Metas Financeiras de Longo Prazo ⭐ NOVO

#### 🎯 Tipos de metas:
- 🏦 **Reserva de Emergência** - Ex: R$ 10.000
- ✈️ **Viagem** - Ex: R$ 5.000 para Europa
- 🏠 **Casa** - Ex: R$ 50.000 de entrada
- 👴 **Aposentadoria** - Planejamento futuro
- 📚 **Educação** - Curso, faculdade, etc.

#### 🔧 Como funciona:
1. Você cria a meta (ex: "Viagem para Europa - R$ 10.000")
2. Define quando quer alcançar
3. Sistema calcula quanto precisa guardar por mês
4. Você vai contribuindo
5. Acompanha o progresso visualmente

**📝 Exemplo prático:**
```
Meta: Viagem para Europa
Valor necessário: R$ 10.000,00
Valor guardado: R$ 3.500,00
Progresso: 35% 🎯
Falta: R$ 6.500,00
Prazo: 12 meses
Valor mensal sugerido: R$ 542,00
```

**💡 Benefício para você:** Metas grandes ficam alcançáveis quando você vê o progresso!

### 5.11 Calculadora de Juros Compostos ⭐ NOVO

#### 🎯 O que você pode fazer:
- Simular investimentos
- Ver quanto seu dinheiro vai render
- Comparar diferentes investimentos
- Ver projeção mês a mês

#### 📊 Exemplo prático:

**Cenário 1: CDB**
- Valor inicial: R$ 1.000
- Aporte mensal: R$ 500
- Taxa: 1% ao mês
- Tempo: 24 meses
- **Resultado:** R$ 15.234,56

**Cenário 2: Poupança**
- Valor inicial: R$ 1.000
- Aporte mensal: R$ 500
- Taxa: 0,5% ao mês
- Tempo: 24 meses
- **Resultado:** R$ 13.456,78

**Comparação:** CDB rende R$ 1.777,78 a mais! 💰

**💡 Benefício para você:** Tome decisões de investimento informadas!

#### 🔧 Fórmula Técnica:
```
Montante = P × (1 + i)^n + PMT × [((1 + i)^n - 1) / i]

Onde:
- P = Valor inicial
- PMT = Aporte mensal
- i = Taxa de juros mensal (em decimal, ex: 0.01 para 1%)
- n = Número de meses
```

### 5.12 Painel de Investimentos ⭐ NOVO

#### 🎯 O que você vê:
- 💰 Valor total investido
- 📈 Rendimento acumulado
- 📊 Performance por tipo
- 🥧 Distribuição da carteira (gráfico pizza)

#### 📊 Análises disponíveis:
- Performance individual de cada investimento
- Comparação com benchmarks
- Gráficos de evolução ao longo do tempo
- Recomendações de diversificação

**💡 Benefício para você:** Acompanhe seus investimentos como um profissional!

### 5.13 Resumo Anual ⭐ NOVO - Seu Ano em Números

#### 🎯 O que você vê:
- 📊 Total de entradas no ano
- 📉 Total de saídas no ano
- 💰 Saldo final do ano
- 📈 Total investido
- 🏆 Maior e menor gasto
- 📊 Top 5 categorias do ano
- 📈 Gráfico de evolução mês a mês
- 🔍 Comparação com ano anterior

**💡 Benefício para você:** Entenda seus padrões anuais e planeje melhor!

### 5.14 Resumo Mensal ⭐ NOVO - Detalhes do Mês

#### 🎯 O que você vê:
- 📊 Métricas do mês
- 📈 Comparação com mês anterior
- 📊 Top categorias do mês
- 🔍 Padrões detectados
- 📈 Gráficos interativos

**💡 Benefício para você:** Análise detalhada de cada mês!

### 5.15 Chat com IA - Seu Assistente Financeiro

#### 🎯 O que você pode fazer:
- Fazer perguntas em linguagem natural
- Classificar transações via chat
- Pedir recomendações
- Entender melhor suas finanças

**📝 Exemplos de uso:**
- "Quanto gastei com comida este mês?"
- "Classifique: gastei 50 reais no supermercado"
- "Me dê dicas para economizar"
- "Estou gastando demais?"

**💡 Benefício para você:** Tenha um assistente financeiro disponível 24/7!

---

## 6. Infraestrutura e Custos

### 6.1 Onde o Sistema Vai "Morar"? (Infraestrutura)

**Analogia simples:** Imagine que você precisa de uma casa para morar:

🏠 **Frontend (A Casa que Você Vê)**
- Hospedado em: Vercel / Netlify
- É como alugar um apartamento mobiliado
- Custo: R$ 0-100/mês (dependendo do plano)

🏗️ **Backend e Banco de Dados (A Estrutura)**
- Hospedado em: Supabase Cloud
- É como ter um cofre seguro profissional
- Custo: R$ 125/mês (plano Pro)

🤖 **Inteligência Artificial (O Assistente)**
- Serviço: OpenAI
- É como contratar um assistente inteligente
- Custo: R$ 50-150/mês (dependendo do uso)

🌐 **Domínio (O Endereço)**
- Exemplo: financetrack.com.br
- É como ter um endereço próprio
- Custo: R$ 4/mês

### 6.2 Custos Mensais Estimados

#### Cenário 1: Produção Básica (Recomendado para Começar)
```
🏗️ Supabase Pro:          R$ 125,00
🏠 Hospedagem Frontend:    R$   0,00 (plano gratuito)
🤖 OpenAI API:            R$  50,00 (uso moderado)
🌐 Domínio (.com.br):     R$   4,00
─────────────────────────────────────
💰 TOTAL MENSAL:          R$ 179,00
```

**Ideal para:** Começar o projeto, até ~100 usuários

#### Cenário 2: Produção Completa (Para Crescimento)
```
🏗️ Supabase Pro:          R$ 125,00
🏠 Hospedagem Frontend:   R$ 100,00 (plano profissional)
🤖 OpenAI API:            R$ 150,00 (alto uso)
🌐 Domínio (.com.br):     R$   4,00
💻 VPS (opcional):        R$  30,00
─────────────────────────────────────
💰 TOTAL MENSAL:          R$ 409,00
```

**Ideal para:** Projeto em crescimento, 100-1000 usuários

### 6.3 Custos Anuais

**Produção Básica:**
- Mensal: R$ 179,00
- Anual: R$ 2.148,00
- Domínio: R$ 48,00/ano
- **TOTAL ANUAL: R$ 2.196,00**

**Produção Completa:**
- Mensal: R$ 409,00
- Anual: R$ 4.908,00
- Domínio: R$ 48,00/ano
- **TOTAL ANUAL: R$ 4.956,00**

### 6.4 Como os Custos Crescem com Usuários

**100 usuários ativos/mês:**
- Custo estimado: ~R$ 200/mês
- Sistema funciona perfeitamente

**1.000 usuários ativos/mês:**
- Custo estimado: ~R$ 400-600/mês
- Pode precisar upgrade de hospedagem

**10.000 usuários ativos/mês:**
- Custo estimado: ~R$ 2.000-3.000/mês
- Precisa de upgrades significativos

**💡 Dica:** Os custos crescem gradualmente, não de forma abrupta!

### 6.5 Otimizações para Reduzir Custos

1. **Cache Inteligente**
   - Evita processar a mesma coisa várias vezes
   - Reduz custos de IA em até 70%

2. **Uso Eficiente do Banco**
   - Queries otimizadas
   - Índices bem criados
   - Reduz custos de processamento

3. **CDN e Cache**
   - Assets estáticos em CDN
   - Reduz custos de bandwidth

---

## 7. Cronograma de Desenvolvimento

### 7.1 Visão Geral

**Tempo total estimado:** 20 semanas (~5 meses)

**Dividido em 5 fases:**
1. Setup e Infraestrutura (2 semanas)
2. Funcionalidades Core (4 semanas)
3. Funcionalidades Avançadas (4 semanas)
4. Novas Funcionalidades (8 semanas)
5. Testes e Ajustes (2 semanas)

### 7.2 Fase 1: Setup e Infraestrutura (2 semanas)

**O que será feito:**
- Configurar o projeto React
- Configurar Supabase
- Criar estrutura básica do banco
- Configurar autenticação

**Resultado:** Base sólida para construir tudo em cima

### 7.3 Fase 2: Funcionalidades Core (4 semanas)

**O que será feito:**
- Sistema de autenticação completo
- Onboarding (7 passos)
- Dashboard básico
- CRUD de transações
- Sistema de categorias
- Gestão de contas bancárias

**Resultado:** Sistema funcional básico, já pode ser usado!

### 7.4 Fase 3: Funcionalidades Avançadas (4 semanas)

**O que será feito:**
- Importação de extratos
- Integração com OpenAI
- Classificação automática
- Chat com IA
- Projeções financeiras
- Painel de investimentos básico

**Resultado:** Sistema completo com IA integrada!

### 7.5 Fase 4: Novas Funcionalidades (8 semanas)

**Sprint 1 (2 semanas):**
- Sistema de metas do mês
- Cadastro de cartões
- Acompanhamento de faturas

**Sprint 2 (2 semanas):**
- Calculadora de juros compostos
- Metas financeiras de longo prazo
- Melhorias no painel de investimentos

**Sprint 3 (2 semanas):**
- Resumo anual completo
- Resumo mensal detalhado
- Exportação de relatórios (PDF)

**Sprint 4 (2 semanas):**
- Sistema de tutoriais
- Gravação de vídeos tutoriais
- Documentação interativa
- FAQ completo

**Resultado:** Sistema completo com todas as funcionalidades!

### 7.6 Fase 5: Testes e Ajustes (2 semanas)

**O que será feito:**
- Testes completos do sistema
- Correção de bugs
- Otimizações de performance
- Ajustes de UX/UI
- Preparação para produção

**Resultado:** Sistema pronto para produção!

---

## 8. Tutoriais e Suporte

### 8.1 Tutoriais em Vídeo (14 vídeos planejados)

#### 📚 Nível Básico (4 vídeos - ~38 minutos)

1. **Tour Completo do Sistema** (10 min)
   - Visão geral de todas as funcionalidades
   - Como navegar pelo sistema
   - Onde encontrar cada coisa

2. **Como Criar sua Conta** (5 min)
   - Passo a passo do cadastro
   - Verificação de email
   - Primeiro login

3. **Onboarding Completo** (15 min)
   - Todos os 7 passos explicados
   - Dicas e truques
   - O que fazer em cada etapa

4. **Adicionando sua Primeira Transação** (8 min)
   - Como usar o formulário
   - Escolhendo categorias
   - Dicas de boas práticas

#### 🎓 Nível Intermediário (4 vídeos - ~40 minutos)

5. **Importando Extratos Bancários** (12 min)
   - Formatos suportados
   - Como fazer upload
   - Revisando transações importadas
   - Resolvendo problemas comuns

6. **Configurando Categorias** (10 min)
   - Categorias padrão
   - Criando categorias personalizadas
   - Organizando por tipo

7. **Gerenciando Contas Bancárias** (8 min)
   - Adicionando contas
   - Atualizando saldos
   - Conta principal

8. **Usando o Dashboard** (10 min)
   - Entendendo os cards
   - Interpretando gráficos
   - Insights automáticos

#### 🚀 Nível Avançado (6 vídeos - ~69 minutos)

9. **Criando Metas Financeiras** (12 min)
   - Metas mensais
   - Metas de longo prazo
   - Acompanhando progresso

10. **Cadastrando Cartões de Crédito** (10 min)
    - Adicionando cartões
    - Configurando faturas
    - Acompanhamento automático

11. **Usando a Calculadora de Juros** (15 min)
    - Simulando investimentos
    - Comparando cenários
    - Entendendo os resultados

12. **Painel de Investimentos** (12 min)
    - Cadastrando investimentos
    - Acompanhando performance
    - Análises e recomendações

13. **Chat com IA** (10 min)
    - Fazendo perguntas
    - Classificando transações
    - Obtendo recomendações

14. **Resumos Anuais e Mensais** (10 min)
    - Acessando relatórios
    - Interpretando dados
    - Exportando informações

**Total de conteúdo:** ~2 horas e 27 minutos de vídeos tutoriais!

### 8.2 Documentação Escrita

- ✅ FAQ completo (perguntas frequentes)
- ✅ Guia de solução de problemas
- ✅ Dicas e truques
- ✅ Boas práticas financeiras
- ✅ Artigos explicativos

### 8.3 Suporte ao Cliente

#### Canais Disponíveis:
- 📧 **Email:** suporte@financetrack.com.br
- 💬 **Chat:** Integrado no sistema (futuro)
- 📱 **WhatsApp:** (11) 95777-8621
- ❓ **FAQ:** Na plataforma

#### Tempo de Resposta:
- 🔴 **Crítico:** 2-4 horas
- 🟠 **Alto:** 4-8 horas
- 🟡 **Médio:** 24 horas
- 🟢 **Baixo:** 48 horas

---

## 9. Anexos Técnicos

### 9.1 Estrutura de Arquivos do Projeto

```
financertrack/
├── src/                      # Código fonte
│   ├── components/          # Componentes React reutilizáveis
│   │   ├── Dashboard/      # Componentes do dashboard
│   │   ├── Onboarding/     # Componentes do onboarding
│   │   ├── Settings/       # Componentes de configurações
│   │   └── ui/             # Componentes UI básicos
│   ├── pages/              # Páginas principais
│   ├── contexts/           # Contextos React (Auth, etc.)
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilitários e helpers
│   ├── integrations/      # Integrações externas
│   │   └── supabase/      # Cliente Supabase
│   └── data/              # Dados estáticos
├── supabase/              # Configuração Supabase
│   ├── migrations/        # Migrações do banco
│   └── functions/         # Edge Functions
├── public/                # Arquivos estáticos
└── docs/                  # Documentação
```

### 9.2 Variáveis de Ambiente Necessárias

```env
# Supabase (Backend e Banco de Dados)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui

# OpenAI (Para Inteligência Artificial)
OPENAI_API_KEY=sk-sua-chave-openai-aqui

# Domínio da Aplicação
VITE_APP_URL=https://financetrack.com.br
```

**💡 O que são:** Configurações que o sistema precisa para funcionar. São como "chaves" que abrem acesso aos serviços.

### 9.3 Scripts de Desenvolvimento

```json
{
  "dev": "vite",           // Inicia servidor de desenvolvimento
  "build": "vite build",   // Cria versão para produção
  "preview": "vite preview", // Visualiza versão de produção
  "lint": "eslint ."       // Verifica qualidade do código
}
```

**💡 O que fazem:**
- `dev`: Roda o sistema localmente para testar
- `build`: Prepara o sistema para colocar no ar
- `preview`: Testa a versão que vai para produção
- `lint`: Verifica se o código está bem escrito

---

## 10. Considerações Finais

### 10.1 Por que Escolher o FinanceTrack?

✅ **Tecnologia Moderna**
- Usa as melhores ferramentas disponíveis
- Sistema rápido e responsivo
- Funciona em qualquer dispositivo

✅ **Segurança em Primeiro Lugar**
- Seus dados estão protegidos
- Conformidade com LGPD
- Autenticação robusta

✅ **Fácil de Usar**
- Interface intuitiva
- Tutoriais completos
- Suporte sempre disponível

✅ **Crescimento Contínuo**
- Sistema preparado para escalar
- Novas funcionalidades regularmente
- Melhorias baseadas em feedback

### 10.2 Próximos Passos

1. ✅ **Aprovação desta proposta**
2. ✅ **Definição de cronograma detalhado**
3. ✅ **Setup inicial do projeto**
4. ✅ **Desenvolvimento iterativo**
5. ✅ **Testes e ajustes**
6. ✅ **Deploy em produção**
7. ✅ **Lançamento! 🚀**

---

## 11. Contato

**Cliente:** Juliano  
**Projeto:** FinanceTrack
**Tipo:** Proposta de Desenvolvimento Completo  
**Data:** Fevereiro 2026

*Esta documentação foi criada para ser compreendida tanto por profissionais técnicos quanto por pessoas sem conhecimento técnico. Todas as explicações técnicas são acompanhadas de exemplos práticos e linguagem simples.*