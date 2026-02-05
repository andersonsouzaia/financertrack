# 📋 O QUE FALTA IMPLEMENTAR - FinanceTrack

**Data:** Fevereiro 2026  
**Baseado em:** DOCUMENTACAO_COMPLETA_JULIANO.md

---

## 🔴 PRIORIDADE ALTA - Funcionalidades Novas (⭐ NOVO)

### 1. 💳 Sistema de Cartões de Crédito/Débito

#### 📊 Banco de Dados:
- ❌ **Tabela `cartoes`** - Não existe
- ❌ **Tabela `faturas_cartoes`** - Não existe
- ❌ **Campo `cartao_id`** na tabela `transacoes` - Não existe

#### 🎨 Frontend:
- ❌ **Página de Cartões** (`/cards` ou `/cartoes`)
  - Listagem de cartões cadastrados
  - Formulário de cadastro (nome, tipo, bandeira, limite, dias fechamento/vencimento)
  - Edição e exclusão
  - Visualização de faturas por cartão
  - Gráfico de gastos por cartão

#### ⚙️ Funcionalidades:
- ❌ Cadastro de cartões
- ❌ Seleção de cartão ao criar transação
- ❌ Cálculo automático de faturas mensais
- ❌ Alertas de vencimento de fatura
- ❌ Marcação de fatura como paga
- ❌ Filtro de transações por cartão

---

### 2. 🎯 Sistema de Metas Mensais

#### 📊 Banco de Dados:
- ❌ **Tabela `metas_mensais`** - Não existe

#### 🎨 Frontend:
- ❌ **Página de Metas Mensais** (`/monthly-goals` ou `/metas-mensais`)
  - Listagem de metas do mês atual
  - Formulário de criação (tipo: financeira, pessoal, gasto)
  - Barra de progresso visual
  - Alertas quando próximo do limite
  - Marcação como concluída

#### ⚙️ Funcionalidades:
- ❌ Criação de metas mensais
- ❌ Cálculo automático de progresso
- ❌ Atualização automática baseada em transações
- ❌ Notificações quando meta é alcançada
- ❌ Integração com dashboard (card de metas)

---

### 3. 🏆 Sistema de Metas Financeiras de Longo Prazo

#### 📊 Banco de Dados:
- ❌ **Tabela `metas_financeiras`** - Não existe
- ❌ **Tabela `contribuicoes_metas`** - Não existe

#### 🎨 Frontend:
- ❌ **Página de Metas Financeiras** (`/financial-goals` ou `/metas-financeiras`)
  - Listagem de metas de longo prazo
  - Formulário de criação (nome, tipo, valor, data limite)
  - Cálculo automático de valor mensal sugerido
  - Gráfico de progresso
  - Histórico de contribuições
  - Formulário para adicionar contribuição

#### ⚙️ Funcionalidades:
- ❌ Criação de metas de longo prazo
- ❌ Cálculo de valor mensal necessário
- ❌ Registro de contribuições
- ❌ Acompanhamento visual de progresso
- ❌ Integração com transações (opcional)

---

### 4. 🧮 Calculadora de Juros Compostos

#### 🎨 Frontend:
- ❌ **Página de Calculadora** (`/compound-interest` ou `/calculadora-juros`)
  - Formulário: valor inicial, aporte mensal, taxa, tempo
  - Cálculo em tempo real
  - Gráfico de evolução mês a mês
  - Comparação de cenários (ex: CDB vs Poupança)
  - Tabela detalhada mês a mês

#### ⚙️ Funcionalidades:
- ❌ Fórmula de juros compostos implementada
- ❌ Cálculo de montante final
- ❌ Projeção mês a mês
- ❌ Comparação de múltiplos cenários
- ❌ Exportação de resultados

---

### 5. 📊 Resumo Anual Completo

#### 🎨 Frontend:
- ❌ **Página de Resumo Anual** (`/annual-summary` ou `/resumo-anual`)
  - Total de entradas no ano
  - Total de saídas no ano
  - Saldo final do ano
  - Total investido
  - Maior e menor gasto
  - Top 5 categorias do ano
  - Gráfico de evolução mês a mês
  - Comparação com ano anterior
  - Exportação em PDF

#### ⚙️ Funcionalidades:
- ❌ Agregação de dados anuais
- ❌ Comparação ano a ano
- ❌ Gráficos interativos
- ❌ Exportação de relatório PDF

---

### 6. 📈 Resumo Mensal Detalhado

#### 🎨 Frontend:
- ❌ **Página de Resumo Mensal** (`/monthly-summary` ou `/resumo-mensal`)
  - Métricas detalhadas do mês
  - Comparação com mês anterior
  - Top categorias do mês
  - Padrões detectados pela IA
  - Gráficos interativos
  - Exportação em PDF

#### ⚙️ Funcionalidades:
- ❌ Análise detalhada do mês
- ❌ Comparação mês a mês
- ❌ Detecção de padrões
- ❌ Exportação de relatório

---

### 7. 🎥 Sistema de Tutoriais em Vídeo

#### 🎨 Frontend:
- ❌ **Página de Tutoriais** (`/tutorials` ou `/tutoriais`)
  - Listagem de vídeos tutoriais
  - Player de vídeo integrado
  - Categorização por nível (Básico, Intermediário, Avançado)
  - Busca e filtros
  - Marcação de vídeos assistidos

#### ⚙️ Funcionalidades:
- ❌ Integração com player de vídeo (YouTube/Vimeo)
- ❌ Tracking de progresso (vídeos assistidos)
- ❌ Sistema de busca
- ❌ Categorização

---

## 🟡 PRIORIDADE MÉDIA - Melhorias e Integrações

### 8. 🔗 Integração de Cartões nas Transações

#### ⚙️ Funcionalidades:
- ❌ Campo de seleção de cartão no formulário de transação
- ❌ Atualização automática de faturas quando transação é criada/editada
- ❌ Validação: não permitir cartão de débito para transações futuras
- ❌ Filtro de transações por cartão

---

### 9. 📊 Melhorias no Painel de Investimentos

#### ⚙️ Funcionalidades:
- ❌ Comparação com benchmarks
- ❌ Recomendações de diversificação
- ❌ Análise de performance individual
- ❌ Gráficos de evolução mais detalhados

---

### 10. 🎯 Integração de Metas no Dashboard

#### ⚙️ Funcionalidades:
- ❌ Card de metas mensais no dashboard
- ❌ Card de metas de longo prazo no dashboard
- ❌ Alertas visuais quando próximo de alcançar meta
- ❌ Quick actions para adicionar contribuição

---

## 🟢 PRIORIDADE BAIXA - Funcionalidades Adicionais

### 11. 📱 Notificações Push

#### ⚙️ Funcionalidades:
- ❌ Notificações de vencimento de fatura
- ❌ Notificações de meta alcançada
- ❌ Notificações de alertas financeiros

---

### 12. 📄 Exportação de Relatórios

#### ⚙️ Funcionalidades:
- ❌ Exportação de resumo anual em PDF
- ❌ Exportação de resumo mensal em PDF
- ❌ Exportação de transações em Excel/CSV
- ❌ Exportação de faturas em PDF

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Banco de Dados (1-2 semanas)
- [ ] Criar migration para tabela `cartoes`
- [ ] Criar migration para tabela `faturas_cartoes`
- [ ] Adicionar campo `cartao_id` na tabela `transacoes`
- [ ] Criar migration para tabela `metas_mensais`
- [ ] Criar migration para tabela `metas_financeiras`
- [ ] Criar migration para tabela `contribuicoes_metas`
- [ ] Criar índices necessários
- [ ] Criar triggers para cálculo automático de faturas
- [ ] Criar políticas RLS para todas as novas tabelas
- [ ] Atualizar tipos TypeScript (`types.ts`)

### Fase 2: Backend/Funções (1 semana)
- [ ] Função para calcular fatura do cartão
- [ ] Função para atualizar progresso de metas mensais
- [ ] Função para calcular valor mensal sugerido de metas
- [ ] Função para calcular juros compostos
- [ ] Edge Function para processar faturas mensais

### Fase 3: Frontend - Cartões (2 semanas)
- [ ] Página de listagem de cartões
- [ ] Formulário de cadastro/edição
- [ ] Página de detalhes do cartão (com faturas)
- [ ] Integração no formulário de transações
- [ ] Filtro de transações por cartão
- [ ] Gráfico de gastos por cartão

### Fase 4: Frontend - Metas (2 semanas)
- [ ] Página de metas mensais
- [ ] Página de metas financeiras
- [ ] Formulários de criação/edição
- [ ] Componentes de progresso visual
- [ ] Integração no dashboard
- [ ] Sistema de notificações

### Fase 5: Frontend - Calculadora e Resumos (2 semanas)
- [ ] Página de calculadora de juros compostos
- [ ] Página de resumo anual
- [ ] Página de resumo mensal
- [ ] Componentes de gráficos
- [ ] Sistema de exportação PDF

### Fase 6: Frontend - Tutoriais (1 semana)
- [ ] Página de tutoriais
- [ ] Integração com player de vídeo
- [ ] Sistema de tracking
- [ ] Busca e filtros

### Fase 7: Testes e Ajustes (1 semana)
- [ ] Testes de integração
- [ ] Testes de UI/UX
- [ ] Correção de bugs
- [ ] Otimizações

---

## 📊 ESTIMATIVA TOTAL

**Tempo estimado:** 10-12 semanas (~2.5-3 meses)

**Dividido em:**
- Banco de Dados: 1-2 semanas
- Backend/Funções: 1 semana
- Frontend: 7-8 semanas
- Testes: 1 semana

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

1. **Começar pelo Banco de Dados**
   - Criar todas as migrations necessárias
   - Testar relacionamentos e constraints
   - Atualizar tipos TypeScript

2. **Implementar Cartões primeiro**
   - É uma funcionalidade completa e independente
   - Serve como base para outras funcionalidades
   - Tem impacto visual grande

3. **Depois Metas**
   - Usa conceitos similares aos cartões
   - Adiciona valor ao dashboard
   - Motivação para usuários

4. **Calculadora e Resumos por último**
   - São funcionalidades complementares
   - Podem ser desenvolvidas em paralelo
   - Melhoram a experiência geral

---

**Última atualização:** Fevereiro 2026
