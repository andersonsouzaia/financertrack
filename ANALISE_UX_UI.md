# Análise Completa de UX/UI - FinanceTrack

## Data: 07/02/2026

## Objetivo do Sistema
Registrar e controlar finanças com apontamentos de IA, chamadas de atenção da IA e tudo mais. Um sistema de **simples uso, mas elegante, bonito e moderno**.

---

## 1. HIERARQUIA VISUAL E SIMPLICIDADE

### Dashboard - O que ver primeiro:

#### Prioridade 1: Informações Essenciais
1. **Saldo Líquido Atual**
   - O que tenho disponível agora
   - Cálculo: Somatório de contas - Faturas de cartão
   - **Visual**: Card grande, número destacado, fácil de ler

2. **Barra de Progresso do Mês**
   - Quanto do orçamento já gastei
   - Exemplo: "60% do limite mensal atingido"
   - **Visual**: Barra de progresso visual, cores indicativas (verde → amarelo → vermelho)

3. **Próximos Vencimentos**
   - O que vence nos próximos 3 dias
   - **Visual**: Lista compacta, cards pequenos, destaque para urgência

#### Exibição: Progressiva
- **Princípio**: O excesso de números causa ansiedade
- **Solução**: Resumo visual primeiro, ao tocar/clicar em um card, ele expande para mostrar detalhes
- **Benefício**: Interface limpa, informações sob demanda

#### Ações Principais: Máximo 2
- ✅ **"Adicionar Gasto"** (Saída)
- ✅ **"Adicionar Ganho"** (Entrada)
- ❌ Qualquer outra coisa fica escondida (em menu secundário)

---

## 2. CONTEXTO E ANTECIPAÇÃO

### Página de Transações
- **Foco**: Busca e Filtro são rainhas
- **Caso de uso**: "Onde gastei com a Estela.AI mês passado?"
- **Botão Adicionar**: Deve estar lá, mas não é o protagonista
- **Layout**: Barra de busca em destaque, filtros visíveis, lista abaixo

### Página de Cartões
- **Foco**: Limite e Fechamento
- **Informações principais**:
  - Quanto ainda posso gastar
  - Quando a fatura vence
- **Layout**: Cards de cartão com limite disponível e data de vencimento em destaque

### FAB (Floating Action Button)
- **Princípio**: Sempre adiciona algo, mas o "que" muda conforme a página
- **Home**: Adicionar transação rápida (Gasto ou Ganho)
- **Transações**: Adicionar transação
- **Cartões**: Adicionar cartão
- **Metas**: Criar meta
- **Regra de Ouro**: Se mudar muito, o usuário se perde. Manter consistência.

---

## 3. DESIGN E ELEGÂNCIA

### Estilo: Minimalista
- **Filosofia**: Finanças já são complexas; o design deve ser o "respiro"
- **Espaçamento**: Generoso
- **Elementos**: Apenas o essencial visível

### Cores: Tons Neutros com Acentos
- **Base**: Cinza e branco para a interface
- **Acentos vibrantes**:
  - 🔴 Vermelho: Gasto excessivo, alertas críticos
  - 🟢 Verde: Meta batida, saldo positivo
  - 🟡 Amarelo: Atenção, próximo vencimento
- **Uso**: Cores apenas para o que exige atenção

### Tipografia: Texto Maior, Menos Informação
- **Princípio**: Melhor fazer scroll do que precisar de lupa
- **Tamanhos**:
  - Números importantes: 24px+
  - Texto secundário: 14px+
  - Labels: 12px
- **Hierarquia**: Clara e óbvia

---

## 4. INTERAÇÕES E FEEDBACK

### Adição Rápida
- **Mobile**: FAB simplificado no canto inferior direito
- **Desktop**: Campo de entrada rápida pode funcionar, mas no mobile ocupa espaço nobre
- **Prioridade**: Mobile First

### Mobile First
- **Razão**: Controle financeiro pessoal acontece "no calor do momento"
  - Na fila do café
  - Após o almoço
  - No transporte
- **Consequência**: Se não for fácil no celular, o usuário esquece de anotar e o sistema morre

### Caminho Rápido: <3 segundos
- **Objetivo**: Abrir o app → Digitar o valor gasto
- **Máximo**: 3 segundos
- **Componentes**:
  1. Abrir app (1s)
  2. Tocar em "Adicionar Gasto" (0.5s)
  3. Digitar valor e descrição (1.5s)
  4. Salvar (0.5s)

---

## 5. COMPLEXIDADE VS. SIMPLICIDADE

### O que é "complexo demais"
- ❌ Conciliação bancária manual
- ❌ Categorização profunda (Ex: "Alimentação > Jantar > Restaurante Japonês")
- ✅ **Limite**: Máximo 3 níveis de categoria

### Segundo Plano
- Relatórios de exportação (PDF/CSV)
- Configurações de perfil
- **Uso**: Uma vez por mês
- **Localização**: Menu de configurações ou página dedicada

### O que deve ser direto
- ✅ Caminho entre "abrir o app" e "digitar o valor gasto"
- ✅ Visualização rápida do saldo
- ✅ Ver próximos vencimentos
- ✅ Adicionar transação

---

## PROBLEMAS IDENTIFICADOS NO SISTEMA ATUAL

### 1. FAB (Floating Action Button)
- ❌ Botões aparecem fora da tela
- ❌ Muitas opções (5 ações)
- ❌ Algumas opções não fazem sentido no dashboard
- ❌ Confuso

### 2. Dashboard
- ❌ Muitas informações de uma vez
- ❌ Hierarquia visual não clara
- ❌ Falta foco no essencial

### 3. Navegação
- ❌ Muitas opções no menu
- ❌ FAB com muitas ações
- ❌ Falta contexto por página

### 4. Design
- ❌ Muito "sistemático"
- ❌ Complexo demais
- ❌ Falta respiração visual

---

## PLANO DE AÇÃO

### Fase 1: Correções Imediatas (Críticas)
1. ✅ Corrigir posicionamento do FAB
2. ✅ Simplificar FAB para máximo 2 ações principais
3. ✅ Tornar FAB contextual por página

### Fase 2: Simplificação do Dashboard
1. ✅ Reorganizar hierarquia visual
2. ✅ Implementar cards expansíveis
3. ✅ Focar no essencial: Saldo, Progresso, Vencimentos

### Fase 3: Melhorias de Design
1. ✅ Aplicar princípios minimalistas
2. ✅ Ajustar tipografia (texto maior)
3. ✅ Usar cores apenas para atenção

### Fase 4: Otimização Mobile First
1. ✅ Garantir caminho rápido <3 segundos
2. ✅ Melhorar FAB para mobile
3. ✅ Simplificar formulários

---

## MÉTRICAS DE SUCESSO

- ✅ Usuário consegue adicionar gasto em <3 segundos
- ✅ Dashboard mostra apenas o essencial
- ✅ FAB não aparece fora da tela
- ✅ Interface respira (espaçamento adequado)
- ✅ Cores usadas apenas para atenção
- ✅ Mobile funciona perfeitamente

---

## PRÓXIMOS PASSOS

1. Implementar correções do FAB
2. Redesenhar Dashboard com nova hierarquia
3. Simplificar navegação
4. Aplicar design minimalista
5. Testar fluxo completo mobile
