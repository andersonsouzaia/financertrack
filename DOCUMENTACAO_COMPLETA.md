# 📘 Documentação Completa - FinanceTrack

**Versão:** 1.0.0  
**Data:** Fevereiro 2025  
**Sistema:** FinanceTrack - Plataforma de Gestão Financeira Pessoal

---

## 📑 Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura Técnica](#2-arquitetura-técnica)
3. [Banco de Dados](#3-banco-de-dados)
4. [Funcionalidades Existentes](#4-funcionalidades-existentes)
5. [Funcionalidades Planejadas](#5-funcionalidades-planejadas)
6. [Custos Operacionais](#6-custos-operacionais)
7. [Estrutura de Valores](#7-estrutura-de-valores)
8. [Tutoriais e Suporte](#8-tutoriais-e-suporte)
9. [Roadmap de Desenvolvimento](#9-roadmap-de-desenvolvimento)
10. [Anexos Técnicos](#10-anexos-técnicos)

---

## 1. Visão Geral do Sistema

### 1.1. Sobre o FinanceTrack

O **FinanceTrack** é uma plataforma completa de gestão financeira pessoal desenvolvida para ajudar usuários a controlar suas finanças, entender seus gastos, planejar investimentos e alcançar metas financeiras.

### 1.2. Objetivos do Sistema

- ✅ **Controle Financeiro Completo**: Gestão de receitas, despesas e investimentos
- ✅ **Inteligência Artificial**: Análise comportamental e recomendações personalizadas
- ✅ **Automação**: Importação automática de extratos bancários
- ✅ **Planejamento**: Projeções financeiras e metas personalizadas
- ✅ **Educação Financeira**: Tutoriais e insights educativos

### 1.3. Público-Alvo

- Pessoas físicas que desejam controlar suas finanças pessoais
- Casais e famílias que precisam gerenciar renda compartilhada
- Profissionais freelancers com renda variável
- Investidores iniciantes e experientes

---

## 2. Arquitetura Técnica

### 2.1. Stack Tecnológico

#### Frontend
- **Framework**: React 18.3.1 com TypeScript
- **Build Tool**: Vite 5.4.19
- **UI Framework**: shadcn/ui + Radix UI
- **Estilização**: Tailwind CSS 3.4.17
- **Roteamento**: React Router DOM 6.30.1
- **Estado**: React Query (TanStack Query) 5.83.0
- **Formulários**: React Hook Form 7.61.1 + Zod 3.25.76
- **Gráficos**: Recharts 2.15.4
- **Ícones**: Lucide React 0.462.0

#### Backend & Banco de Dados
- **Backend**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Storage**: Supabase Storage
- **Edge Functions**: Supabase Functions (Deno)

#### Integrações
- **IA**: OpenAI GPT-4o-mini (classificação de transações)
- **Parsing**: PDF.js, CSV-Parse, XLSX
- **Notificações**: Sistema interno (preparado para Push Notifications)

