-- ============================================
-- ADICIONAR TABELAS DE METAS
-- ============================================

-- 1. Criar tabela METAS_MENSAIS
CREATE TABLE IF NOT EXISTS public.metas_mensais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mes_ano TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('financeira', 'pessoal', 'gasto')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  valor_meta NUMERIC(15,2),
  valor_atual NUMERIC(15,2) DEFAULT 0,
  categoria_id UUID REFERENCES public.categorias_saidas(id) ON DELETE SET NULL,
  data_limite DATE,
  concluida BOOLEAN DEFAULT false,
  prioridade INTEGER DEFAULT 5 CHECK (prioridade >= 1 AND prioridade <= 10),
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar tabela METAS_FINANCEIRAS
CREATE TABLE IF NOT EXISTS public.metas_financeiras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  valor_meta NUMERIC(15,2) NOT NULL,
  valor_atual NUMERIC(15,2) DEFAULT 0,
  tipo TEXT NOT NULL CHECK (tipo IN ('emergencia', 'viagem', 'imovel', 'aposentadoria', 'educacao', 'outro')),
  data_limite DATE,
  valor_mensal_sugerido NUMERIC(15,2),
  prioridade INTEGER DEFAULT 5 CHECK (prioridade >= 1 AND prioridade <= 10),
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar tabela CONTRIBUICOES_METAS
CREATE TABLE IF NOT EXISTS public.contribuicoes_metas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meta_id UUID NOT NULL REFERENCES public.metas_financeiras(id) ON DELETE CASCADE,
  transacao_id UUID REFERENCES public.transacoes(id) ON DELETE SET NULL,
  valor NUMERIC(15,2) NOT NULL,
  data_contribuicao DATE NOT NULL,
  observacao TEXT,
  data_criacao TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_metas_mensais_user_mes ON public.metas_mensais(user_id, mes_ano);
CREATE INDEX IF NOT EXISTS idx_metas_mensais_categoria ON public.metas_mensais(categoria_id);
CREATE INDEX IF NOT EXISTS idx_metas_financeiras_user ON public.metas_financeiras(user_id);
CREATE INDEX IF NOT EXISTS idx_metas_financeiras_ativo ON public.metas_financeiras(ativo) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_contribuicoes_meta ON public.contribuicoes_metas(meta_id);
CREATE INDEX IF NOT EXISTS idx_contribuicoes_transacao ON public.contribuicoes_metas(transacao_id);

-- 5. Criar triggers para atualizar data_atualizacao
DROP TRIGGER IF EXISTS update_metas_mensais_updated_at ON public.metas_mensais;
CREATE TRIGGER update_metas_mensais_updated_at
  BEFORE UPDATE ON public.metas_mensais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_metas_financeiras_updated_at ON public.metas_financeiras;
CREATE TRIGGER update_metas_financeiras_updated_at
  BEFORE UPDATE ON public.metas_financeiras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 6. Habilitar RLS nas novas tabelas
ALTER TABLE public.metas_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribuicoes_metas ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS para METAS_MENSAIS
DROP POLICY IF EXISTS "Usuários podem ver suas metas mensais" ON public.metas_mensais;
CREATE POLICY "Usuários podem ver suas metas mensais"
  ON public.metas_mensais FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir suas metas mensais" ON public.metas_mensais;
CREATE POLICY "Usuários podem inserir suas metas mensais"
  ON public.metas_mensais FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas metas mensais" ON public.metas_mensais;
CREATE POLICY "Usuários podem atualizar suas metas mensais"
  ON public.metas_mensais FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas metas mensais" ON public.metas_mensais;
CREATE POLICY "Usuários podem deletar suas metas mensais"
  ON public.metas_mensais FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Criar políticas RLS para METAS_FINANCEIRAS
DROP POLICY IF EXISTS "Usuários podem ver suas metas financeiras" ON public.metas_financeiras;
CREATE POLICY "Usuários podem ver suas metas financeiras"
  ON public.metas_financeiras FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir suas metas financeiras" ON public.metas_financeiras;
CREATE POLICY "Usuários podem inserir suas metas financeiras"
  ON public.metas_financeiras FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas metas financeiras" ON public.metas_financeiras;
CREATE POLICY "Usuários podem atualizar suas metas financeiras"
  ON public.metas_financeiras FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas metas financeiras" ON public.metas_financeiras;
CREATE POLICY "Usuários podem deletar suas metas financeiras"
  ON public.metas_financeiras FOR DELETE
  USING (auth.uid() = user_id);

-- 9. Criar políticas RLS para CONTRIBUICOES_METAS
DROP POLICY IF EXISTS "Usuários podem ver contribuições de suas metas" ON public.contribuicoes_metas;
CREATE POLICY "Usuários podem ver contribuições de suas metas"
  ON public.contribuicoes_metas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.metas_financeiras 
    WHERE metas_financeiras.id = contribuicoes_metas.meta_id 
    AND metas_financeiras.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Usuários podem inserir contribuições em suas metas" ON public.contribuicoes_metas;
CREATE POLICY "Usuários podem inserir contribuições em suas metas"
  ON public.contribuicoes_metas FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.metas_financeiras 
    WHERE metas_financeiras.id = contribuicoes_metas.meta_id 
    AND metas_financeiras.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Usuários podem atualizar contribuições de suas metas" ON public.contribuicoes_metas;
CREATE POLICY "Usuários podem atualizar contribuições de suas metas"
  ON public.contribuicoes_metas FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.metas_financeiras 
    WHERE metas_financeiras.id = contribuicoes_metas.meta_id 
    AND metas_financeiras.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.metas_financeiras 
    WHERE metas_financeiras.id = contribuicoes_metas.meta_id 
    AND metas_financeiras.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Usuários podem deletar contribuições de suas metas" ON public.contribuicoes_metas;
CREATE POLICY "Usuários podem deletar contribuições de suas metas"
  ON public.contribuicoes_metas FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.metas_financeiras 
    WHERE metas_financeiras.id = contribuicoes_metas.meta_id 
    AND metas_financeiras.user_id = auth.uid()
  ));

-- ============================================
-- TABELAS DE METAS CRIADAS COM SUCESSO! ✅
-- ============================================
