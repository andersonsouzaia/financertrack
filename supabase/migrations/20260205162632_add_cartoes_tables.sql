-- ============================================
-- ADICIONAR TABELAS DE CARTÕES E FATURAS
-- ============================================

-- 1. Criar tabela CARTÕES
CREATE TABLE IF NOT EXISTS public.cartoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('credito', 'debito', 'ambos')),
  bandeira TEXT,
  limite NUMERIC(15,2),
  dia_fechamento INTEGER CHECK (dia_fechamento >= 1 AND dia_fechamento <= 31),
  dia_vencimento INTEGER CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  banco_conta_id UUID REFERENCES public.bancos_contas(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar tabela FATURAS_CARTOES
CREATE TABLE IF NOT EXISTS public.faturas_cartoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cartao_id UUID NOT NULL REFERENCES public.cartoes(id) ON DELETE CASCADE,
  mes_referencia TEXT NOT NULL,
  valor_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  data_fechamento DATE,
  data_vencimento DATE,
  pago BOOLEAN DEFAULT false,
  data_pagamento DATE,
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cartao_id, mes_referencia)
);

-- 3. Adicionar campo cartao_id na tabela TRANSACOES
ALTER TABLE public.transacoes 
ADD COLUMN IF NOT EXISTS cartao_id UUID REFERENCES public.cartoes(id) ON DELETE SET NULL;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_cartoes_user_id ON public.cartoes(user_id);
CREATE INDEX IF NOT EXISTS idx_cartoes_banco_conta_id ON public.cartoes(banco_conta_id);
CREATE INDEX IF NOT EXISTS idx_faturas_cartoes_cartao_id ON public.faturas_cartoes(cartao_id);
CREATE INDEX IF NOT EXISTS idx_faturas_cartoes_mes ON public.faturas_cartoes(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_transacoes_cartao_id ON public.transacoes(cartao_id);

-- 5. Criar triggers para atualizar data_atualizacao
DROP TRIGGER IF EXISTS update_cartoes_updated_at ON public.cartoes;
CREATE TRIGGER update_cartoes_updated_at
  BEFORE UPDATE ON public.cartoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_faturas_cartoes_updated_at ON public.faturas_cartoes;
CREATE TRIGGER update_faturas_cartoes_updated_at
  BEFORE UPDATE ON public.faturas_cartoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 6. Habilitar RLS nas novas tabelas
ALTER TABLE public.cartoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas_cartoes ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS para CARTÕES
DROP POLICY IF EXISTS "Usuários podem ver seus cartões" ON public.cartoes;
CREATE POLICY "Usuários podem ver seus cartões"
  ON public.cartoes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir seus cartões" ON public.cartoes;
CREATE POLICY "Usuários podem inserir seus cartões"
  ON public.cartoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus cartões" ON public.cartoes;
CREATE POLICY "Usuários podem atualizar seus cartões"
  ON public.cartoes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus cartões" ON public.cartoes;
CREATE POLICY "Usuários podem deletar seus cartões"
  ON public.cartoes FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Criar políticas RLS para FATURAS_CARTOES
DROP POLICY IF EXISTS "Usuários podem ver faturas de seus cartões" ON public.faturas_cartoes;
CREATE POLICY "Usuários podem ver faturas de seus cartões"
  ON public.faturas_cartoes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.cartoes 
    WHERE cartoes.id = faturas_cartoes.cartao_id 
    AND cartoes.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Usuários podem inserir faturas de seus cartões" ON public.faturas_cartoes;
CREATE POLICY "Usuários podem inserir faturas de seus cartões"
  ON public.faturas_cartoes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.cartoes 
    WHERE cartoes.id = faturas_cartoes.cartao_id 
    AND cartoes.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Usuários podem atualizar faturas de seus cartões" ON public.faturas_cartoes;
CREATE POLICY "Usuários podem atualizar faturas de seus cartões"
  ON public.faturas_cartoes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.cartoes 
    WHERE cartoes.id = faturas_cartoes.cartao_id 
    AND cartoes.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.cartoes 
    WHERE cartoes.id = faturas_cartoes.cartao_id 
    AND cartoes.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Usuários podem deletar faturas de seus cartões" ON public.faturas_cartoes;
CREATE POLICY "Usuários podem deletar faturas de seus cartões"
  ON public.faturas_cartoes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.cartoes 
    WHERE cartoes.id = faturas_cartoes.cartao_id 
    AND cartoes.user_id = auth.uid()
  ));

-- ============================================
-- TABELAS DE CARTÕES CRIADAS COM SUCESSO! ✅
-- ============================================
