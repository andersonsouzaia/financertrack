-- ============================================
-- FUNÇÃO PARA CÁLCULO AUTOMÁTICO DE FATURAS
-- ============================================

-- Função para calcular fatura de um cartão em um mês específico
CREATE OR REPLACE FUNCTION public.calcular_fatura_cartao(
  p_cartao_id UUID,
  p_mes_referencia TEXT
)
RETURNS NUMERIC(15,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valor_total NUMERIC(15,2) := 0;
  v_cartao_record RECORD;
  v_ano INTEGER;
  v_mes INTEGER;
BEGIN
  -- Buscar informações do cartão
  SELECT * INTO v_cartao_record
  FROM public.cartoes
  WHERE id = p_cartao_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cartão não encontrado: %', p_cartao_id;
  END IF;
  
  -- Extrair ano e mês do mes_referencia (formato "YYYY-MM")
  v_ano := CAST(SPLIT_PART(p_mes_referencia, '-', 1) AS INTEGER);
  v_mes := CAST(SPLIT_PART(p_mes_referencia, '-', 2) AS INTEGER);
  
  -- Calcular total das transações do cartão no mês
  -- Considera apenas transações de saída (saida_fixa ou diario)
  SELECT COALESCE(SUM(valor_original), 0) INTO v_valor_total
  FROM public.transacoes t
  INNER JOIN public.meses_financeiros mf ON t.mes_financeiro_id = mf.id
  WHERE t.cartao_id = p_cartao_id
    AND t.deletado = false
    AND t.tipo IN ('saida_fixa', 'diario')
    AND mf.ano = v_ano
    AND mf.mes = v_mes;
  
  -- Criar ou atualizar fatura
  INSERT INTO public.faturas_cartoes (
    cartao_id,
    mes_referencia,
    valor_total,
    data_fechamento,
    data_vencimento
  )
  VALUES (
    p_cartao_id,
    p_mes_referencia,
    v_valor_total,
    CASE 
      WHEN v_cartao_record.dia_fechamento IS NOT NULL 
      THEN DATE_TRUNC('month', TO_DATE(p_mes_referencia || '-01', 'YYYY-MM-DD')) + 
           (v_cartao_record.dia_fechamento - 1) * INTERVAL '1 day'
      ELSE NULL
    END,
    CASE 
      WHEN v_cartao_record.dia_vencimento IS NOT NULL 
      THEN DATE_TRUNC('month', TO_DATE(p_mes_referencia || '-01', 'YYYY-MM-DD')) + 
           (v_cartao_record.dia_vencimento - 1) * INTERVAL '1 day'
      ELSE NULL
    END
  )
  ON CONFLICT (cartao_id, mes_referencia) 
  DO UPDATE SET
    valor_total = EXCLUDED.valor_total,
    data_atualizacao = NOW();
  
  RETURN v_valor_total;
END;
$$;

-- Função auxiliar para obter mes_referencia de um mes_financeiro_id
CREATE OR REPLACE FUNCTION public.get_mes_referencia(p_mes_financeiro_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_mes INTEGER;
  v_ano INTEGER;
BEGIN
  SELECT mes, ano INTO v_mes, v_ano
  FROM public.meses_financeiros
  WHERE id = p_mes_financeiro_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Retorna no formato "YYYY-MM"
  RETURN LPAD(v_ano::TEXT, 4, '0') || '-' || LPAD(v_mes::TEXT, 2, '0');
END;
$$;

-- Trigger para atualizar fatura automaticamente quando transação é criada/atualizada/deletada
CREATE OR REPLACE FUNCTION public.atualizar_fatura_on_transacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mes_referencia TEXT;
BEGIN
  -- Se a transação tem cartao_id, atualizar fatura
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.cartao_id IS NOT NULL THEN
    -- Obter mes_referencia do mes_financeiro
    v_mes_referencia := public.get_mes_referencia(NEW.mes_financeiro_id);
    
    IF v_mes_referencia IS NOT NULL THEN
      PERFORM public.calcular_fatura_cartao(NEW.cartao_id, v_mes_referencia);
    END IF;
  END IF;
  
  -- Se transação foi deletada ou cartao_id foi removido, recalcular fatura antiga
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.cartao_id IS NOT NULL AND (NEW.cartao_id IS NULL OR NEW.cartao_id != OLD.cartao_id)) THEN
    v_mes_referencia := public.get_mes_referencia(OLD.mes_financeiro_id);
    
    IF v_mes_referencia IS NOT NULL AND OLD.cartao_id IS NOT NULL THEN
      PERFORM public.calcular_fatura_cartao(OLD.cartao_id, v_mes_referencia);
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS atualizar_fatura_on_transacao ON public.transacoes;
CREATE TRIGGER atualizar_fatura_on_transacao
  AFTER INSERT OR UPDATE OR DELETE ON public.transacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_fatura_on_transacao();

-- ============================================
-- FUNÇÃO DE CÁLCULO DE FATURAS CRIADA! ✅
-- ============================================
