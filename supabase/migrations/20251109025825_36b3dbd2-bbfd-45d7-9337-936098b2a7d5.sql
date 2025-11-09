-- ============================================
-- ATIVAR RLS NAS TABELAS RESTANTES
-- ============================================

-- CHAT_HISTORICO_COMPLETO
ALTER TABLE chat_historico_completo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu histórico de chat"
  ON chat_historico_completo FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir no histórico de chat"
  ON chat_historico_completo FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu histórico de chat"
  ON chat_historico_completo FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CONFIGURACAO_SALDO_USUARIO
ALTER TABLE configuracao_saldo_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver sua config de saldo"
  ON configuracao_saldo_usuario FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir config de saldo"
  ON configuracao_saldo_usuario FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar config de saldo"
  ON configuracao_saldo_usuario FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RENDA_COMPARTILHADA
ALTER TABLE renda_compartilhada ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver renda compartilhada que criaram"
  ON renda_compartilhada FOR SELECT
  USING (auth.uid() = criado_por);

CREATE POLICY "Usuários podem inserir renda compartilhada"
  ON renda_compartilhada FOR INSERT
  WITH CHECK (auth.uid() = criado_por);

CREATE POLICY "Usuários podem atualizar renda compartilhada que criaram"
  ON renda_compartilhada FOR UPDATE
  USING (auth.uid() = criado_por)
  WITH CHECK (auth.uid() = criado_por);

-- RENDA_COMPARTILHADA_MEMBROS
ALTER TABLE renda_compartilhada_membros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus dados de membro"
  ON renda_compartilhada_membros FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Criadores podem inserir membros"
  ON renda_compartilhada_membros FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM renda_compartilhada 
    WHERE renda_compartilhada.id = renda_compartilhada_membros.renda_compartilhada_id 
    AND renda_compartilhada.criado_por = auth.uid()
  ));

CREATE POLICY "Usuários podem atualizar seus dados de membro"
  ON renda_compartilhada_membros FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- TRANSACOES_RECORRENTES
ALTER TABLE transacoes_recorrentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas transações recorrentes"
  ON transacoes_recorrentes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir transações recorrentes"
  ON transacoes_recorrentes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar transações recorrentes"
  ON transacoes_recorrentes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar transações recorrentes"
  ON transacoes_recorrentes FOR DELETE
  USING (auth.uid() = user_id);

-- METAS_GASTOS
ALTER TABLE metas_gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas metas"
  ON metas_gastos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir metas"
  ON metas_gastos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar metas"
  ON metas_gastos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar metas"
  ON metas_gastos FOR DELETE
  USING (auth.uid() = user_id);

-- INSIGHTS_DIARIOS
ALTER TABLE insights_diarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus insights"
  ON insights_diarios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir insights"
  ON insights_diarios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar insights"
  ON insights_diarios FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- PROJECOES_FINANCEIRAS
ALTER TABLE projecoes_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas projeções"
  ON projecoes_financeiras FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir projeções"
  ON projecoes_financeiras FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar projeções"
  ON projecoes_financeiras FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar projeções"
  ON projecoes_financeiras FOR DELETE
  USING (auth.uid() = user_id);

-- INVESTIMENTOS
ALTER TABLE investimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus investimentos"
  ON investimentos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir investimentos"
  ON investimentos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar investimentos"
  ON investimentos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar investimentos"
  ON investimentos FOR DELETE
  USING (auth.uid() = user_id);

-- NOTIFICACOES_USUARIO
ALTER TABLE notificacoes_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas notificações"
  ON notificacoes_usuario FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir notificações"
  ON notificacoes_usuario FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar notificações"
  ON notificacoes_usuario FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar notificações"
  ON notificacoes_usuario FOR DELETE
  USING (auth.uid() = user_id);

-- USER_PREFERENCES
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas preferências"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir preferências"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar preferências"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- USER_DEVICES
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus devices"
  ON user_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir devices"
  ON user_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar devices"
  ON user_devices FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar devices"
  ON user_devices FOR DELETE
  USING (auth.uid() = user_id);

-- FEEDBACK_USUARIO
ALTER TABLE feedback_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu feedback"
  ON feedback_usuario FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir feedback"
  ON feedback_usuario FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ANALISE_COMPORTAMENTO_PSICOLOGICA
ALTER TABLE analise_comportamento_psicologica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas análises"
  ON analise_comportamento_psicologica FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir análises"
  ON analise_comportamento_psicologica FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar análises"
  ON analise_comportamento_psicologica FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PRONTO! RLS ativado em todas as tabelas
-- ============================================