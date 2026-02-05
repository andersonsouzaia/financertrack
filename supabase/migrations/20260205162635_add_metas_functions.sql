-- ============================================
-- FUNÇÕES PARA ATUALIZAÇÃO DE PROGRESSO DE METAS
-- ============================================

-- Função para atualizar progresso de uma meta mensal
CREATE OR REPLACE FUNCTION public.atualizar_progresso_meta_mensal(p_meta_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meta RECORD;
  v_valor_atual NUMERIC(15,2) := 0;
  v_mes INTEGER;
  v_ano INTEGER;
BEGIN
  -- Buscar informações da meta
  SELECT * INTO v_meta
  FROM public.metas_mensais
  WHERE id = p_meta_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Extrair mês e ano do mes_ano (formato "YYYY-MM")
  v_ano := CAST(SPLIT_PART(v_meta.mes_ano, '-', 1) AS INTEGER);
  v_mes := CAST(SPLIT_PART(v_meta.mes_ano, '-', 2) AS INTEGER);
  
  -- Calcular valor atual baseado no tipo da meta
  IF v_meta.tipo = 'financeira' THEN
    -- Meta financeira: soma todas as entradas do mês
    SELECT COALESCE(SUM(valor_original), 0) INTO v_valor_atual
    FROM public.transacoes t
    INNER JOIN public.meses_financeiros mf ON t.mes_financeiro_id = mf.id
    WHERE t.user_id = v_meta.user_id
      AND t.tipo = 'entrada'
      AND t.deletado = false
      AND mf.ano = v_ano
      AND mf.mes = v_mes;
      
  ELSIF v_meta.tipo = 'gasto' AND v_meta.categoria_id IS NOT NULL THEN
    -- Meta de gasto: soma transações da categoria no mês
    SELECT COALESCE(SUM(valor_original), 0) INTO v_valor_atual
    FROM public.transacoes t
    INNER JOIN public.meses_financeiros mf ON t.mes_financeiro_id = mf.id
    WHERE t.user_id = v_meta.user_id
      AND t.categoria_id = v_meta.categoria_id
      AND t.tipo IN ('saida_fixa', 'diario')
      AND t.deletado = false
      AND mf.ano = v_ano
      AND mf.mes = v_mes;
  END IF;
  
  -- Atualizar meta
  UPDATE public.metas_mensais
  SET 
    valor_atual = v_valor_atual,
    concluida = CASE 
      WHEN v_meta.valor_meta IS NOT NULL AND v_valor_atual >= v_meta.valor_meta 
      THEN true 
      ELSE false 
    END,
    data_atualizacao = NOW()
  WHERE id = p_meta_id;
END;
$$;

-- Função para calcular valor mensal sugerido de uma meta financeira
CREATE OR REPLACE FUNCTION public.calcular_valor_mensal_meta(
  p_valor_meta NUMERIC(15,2),
  p_data_limite DATE,
  p_valor_atual NUMERIC(15,2) DEFAULT 0
)
RETURNS NUMERIC(15,2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_meses_restantes INTEGER;
  v_valor_faltante NUMERIC(15,2);
BEGIN
  -- Calcular meses restantes até a data limite
  v_meses_restantes := GREATEST(
    EXTRACT(YEAR FROM p_data_limite)::INTEGER * 12 + 
    EXTRACT(MONTH FROM p_data_limite)::INTEGER - 
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER * 12 - 
    EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
    1
  );
  
  -- Calcular valor faltante
  v_valor_faltante := GREATEST(p_valor_meta - p_valor_atual, 0);
  
  -- Retornar valor mensal necessário
  RETURN ROUND(v_valor_faltante / v_meses_restantes, 2);
END;
$$;

-- Trigger para atualizar metas quando transação é criada/atualizada/deletada
CREATE OR REPLACE FUNCTION public.atualizar_metas_on_transacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mes_referencia TEXT;
  v_mes INTEGER;
  v_ano INTEGER;
  v_meta RECORD;
BEGIN
  -- Obter mes_referencia do mes_financeiro
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    SELECT mes, ano INTO v_mes, v_ano
    FROM public.meses_financeiros
    WHERE id = NEW.mes_financeiro_id;
    
    IF FOUND THEN
      v_mes_referencia := LPAD(v_ano::TEXT, 4, '0') || '-' || LPAD(v_mes::TEXT, 2, '0');
      
      -- Atualizar todas as metas mensais do usuário para aquele mês
      FOR v_meta IN 
        SELECT id FROM public.metas_mensais
        WHERE user_id = NEW.user_id
          AND mes_ano = v_mes_referencia
      LOOP
        PERFORM public.atualizar_progresso_meta_mensal(v_meta.id);
      END LOOP;
    END IF;
  END IF;
  
  -- Se deletado, atualizar metas do mês antigo
  IF TG_OP = 'DELETE' THEN
    SELECT mes, ano INTO v_mes, v_ano
    FROM public.meses_financeiros
    WHERE id = OLD.mes_financeiro_id;
    
    IF FOUND THEN
      v_mes_referencia := LPAD(v_ano::TEXT, 4, '0') || '-' || LPAD(v_mes::TEXT, 2, '0');
      
      FOR v_meta IN 
        SELECT id FROM public.metas_mensais
        WHERE user_id = OLD.user_id
          AND mes_ano = v_mes_referencia
      LOOP
        PERFORM public.atualizar_progresso_meta_mensal(v_meta.id);
      END LOOP;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS atualizar_metas_on_transacao ON public.transacoes;
CREATE TRIGGER atualizar_metas_on_transacao
  AFTER INSERT OR UPDATE OR DELETE ON public.transacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_metas_on_transacao();

-- Função para atualizar valor_atual de meta financeira baseado em contribuições
CREATE OR REPLACE FUNCTION public.atualizar_valor_meta_financeira(p_meta_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valor_total NUMERIC(15,2) := 0;
BEGIN
  -- Somar todas as contribuições da meta
  SELECT COALESCE(SUM(valor), 0) INTO v_valor_total
  FROM public.contribuicoes_metas
  WHERE meta_id = p_meta_id;
  
  -- Atualizar meta
  UPDATE public.metas_financeiras
  SET 
    valor_atual = v_valor_total,
    data_atualizacao = NOW()
  WHERE id = p_meta_id;
END;
$$;

-- Trigger para atualizar meta financeira quando contribuição é adicionada/removida
CREATE OR REPLACE FUNCTION public.atualizar_meta_on_contribuicao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.atualizar_valor_meta_financeira(NEW.meta_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.atualizar_valor_meta_financeira(OLD.meta_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS atualizar_meta_on_contribuicao ON public.contribuicoes_metas;
CREATE TRIGGER atualizar_meta_on_contribuicao
  AFTER INSERT OR UPDATE OR DELETE ON public.contribuicoes_metas
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_meta_on_contribuicao();

-- ============================================
-- FUNÇÕES DE METAS CRIADAS COM SUCESSO! ✅
-- ============================================
