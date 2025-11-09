-- ============================================
-- ATIVAR RLS NAS ÚLTIMAS TABELAS
-- ============================================

-- ADS_EVENTOS (pode ser acessado publicamente para tracking)
ALTER TABLE ads_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus eventos de ads"
  ON ads_eventos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir eventos de ads"
  ON ads_eventos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- COTACOES_HISTORICAS (dados públicos de cotações)
ALTER TABLE cotacoes_historicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver cotações históricas"
  ON cotacoes_historicas FOR SELECT
  USING (true);

-- XAPI_LOGS (logs do sistema)
ALTER TABLE xapi_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus logs"
  ON xapi_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir logs"
  ON xapi_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CORRIGIR search_path NA FUNÇÃO update_updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.data_atualizacao = NOW();
  RETURN NEW;
END;
$$;

-- ============================================
-- TODAS AS TABELAS AGORA TÊM RLS ATIVADO!
-- ============================================