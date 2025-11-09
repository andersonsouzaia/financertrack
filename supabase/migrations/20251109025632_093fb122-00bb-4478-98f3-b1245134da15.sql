-- ============================================
-- CORRIGIR RLS PARA TODAS AS TABELAS
-- ============================================

-- 1. MESES_FINANCEIROS
ALTER TABLE meses_financeiros ENABLE ROW LEVEL SECURITY;

-- Drop antigas políticas se existirem
DROP POLICY IF EXISTS "Usuários podem ver seus próprios meses" ON meses_financeiros;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios meses" ON meses_financeiros;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios meses" ON meses_financeiros;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios meses" ON meses_financeiros;
DROP POLICY IF EXISTS "meses_see_own" ON meses_financeiros;

-- Criar novas políticas CORRETAS
CREATE POLICY "Usuários podem ver seus próprios meses"
  ON meses_financeiros FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios meses"
  ON meses_financeiros FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios meses"
  ON meses_financeiros FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios meses"
  ON meses_financeiros FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================

-- 2. TRANSACOES
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver suas transações" ON transacoes;
DROP POLICY IF EXISTS "Usuários podem inserir transações" ON transacoes;
DROP POLICY IF EXISTS "Usuários podem atualizar transações" ON transacoes;
DROP POLICY IF EXISTS "Usuários podem deletar transações" ON transacoes;
DROP POLICY IF EXISTS "transacoes_see_own" ON transacoes;
DROP POLICY IF EXISTS "no_edit_closed_month" ON transacoes;

CREATE POLICY "Usuários podem ver suas transações"
  ON transacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir transações"
  ON transacoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar transações"
  ON transacoes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar transações"
  ON transacoes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================

-- 3. BANCOS_CONTAS
ALTER TABLE bancos_contas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver suas contas" ON bancos_contas;
DROP POLICY IF EXISTS "Usuários podem inserir contas" ON bancos_contas;
DROP POLICY IF EXISTS "Usuários podem atualizar contas" ON bancos_contas;
DROP POLICY IF EXISTS "Usuários podem deletar contas" ON bancos_contas;
DROP POLICY IF EXISTS "bancos_see_own" ON bancos_contas;

CREATE POLICY "Usuários podem ver suas contas"
  ON bancos_contas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir contas"
  ON bancos_contas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar contas"
  ON bancos_contas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar contas"
  ON bancos_contas FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================

-- 4. CATEGORIAS_SAIDAS
ALTER TABLE categorias_saidas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver suas categorias" ON categorias_saidas;
DROP POLICY IF EXISTS "Usuários podem inserir categorias" ON categorias_saidas;
DROP POLICY IF EXISTS "Usuários podem atualizar categorias" ON categorias_saidas;
DROP POLICY IF EXISTS "Usuários podem deletar categorias" ON categorias_saidas;
DROP POLICY IF EXISTS "categorias_see_own" ON categorias_saidas;

CREATE POLICY "Usuários podem ver suas categorias"
  ON categorias_saidas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir categorias"
  ON categorias_saidas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar categorias"
  ON categorias_saidas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar categorias"
  ON categorias_saidas FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================

-- 5. OBSERVACOES_GASTOS
ALTER TABLE observacoes_gastos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver suas observações" ON observacoes_gastos;
DROP POLICY IF EXISTS "Usuários podem inserir observações" ON observacoes_gastos;
DROP POLICY IF EXISTS "Usuários podem atualizar observações" ON observacoes_gastos;
DROP POLICY IF EXISTS "Usuários podem deletar observações" ON observacoes_gastos;

CREATE POLICY "Usuários podem ver suas observações"
  ON observacoes_gastos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM transacoes 
    WHERE transacoes.id = observacoes_gastos.transacao_id 
    AND transacoes.user_id = auth.uid()
  ));

CREATE POLICY "Usuários podem inserir observações"
  ON observacoes_gastos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM transacoes 
    WHERE transacoes.id = observacoes_gastos.transacao_id 
    AND transacoes.user_id = auth.uid()
  ));

CREATE POLICY "Usuários podem atualizar observações"
  ON observacoes_gastos FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM transacoes 
    WHERE transacoes.id = observacoes_gastos.transacao_id 
    AND transacoes.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM transacoes 
    WHERE transacoes.id = observacoes_gastos.transacao_id 
    AND transacoes.user_id = auth.uid()
  ));

CREATE POLICY "Usuários podem deletar observações"
  ON observacoes_gastos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM transacoes 
    WHERE transacoes.id = observacoes_gastos.transacao_id 
    AND transacoes.user_id = auth.uid()
  ));

-- ============================================

-- 6. CONFIGURACAO_USUARIO
ALTER TABLE configuracao_usuario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver sua config" ON configuracao_usuario;
DROP POLICY IF EXISTS "Usuários podem inserir config" ON configuracao_usuario;
DROP POLICY IF EXISTS "Usuários podem atualizar config" ON configuracao_usuario;
DROP POLICY IF EXISTS "configuracao_see_own" ON configuracao_usuario;

CREATE POLICY "Usuários podem ver sua config"
  ON configuracao_usuario FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir config"
  ON configuracao_usuario FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar config"
  ON configuracao_usuario FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================

-- 7. CONFIGURACAO_ONBOARDING
ALTER TABLE configuracao_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver onboarding" ON configuracao_onboarding;
DROP POLICY IF EXISTS "Usuários podem inserir onboarding" ON configuracao_onboarding;
DROP POLICY IF EXISTS "Usuários podem atualizar onboarding" ON configuracao_onboarding;

CREATE POLICY "Usuários podem ver onboarding"
  ON configuracao_onboarding FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir onboarding"
  ON configuracao_onboarding FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar onboarding"
  ON configuracao_onboarding FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================

-- 8. USERS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON users;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON users;
DROP POLICY IF EXISTS "users_see_own" ON users;

CREATE POLICY "Usuários podem ver próprio perfil"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- PRONTO! Todas as políticas RLS foram corrigidas
-- ============================================