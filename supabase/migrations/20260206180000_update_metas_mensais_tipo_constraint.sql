-- ============================================
-- ATUALIZAR CONSTRAINT DE TIPO EM METAS_MENSAIS
-- ============================================

-- Remover a constraint antiga
ALTER TABLE public.metas_mensais 
DROP CONSTRAINT IF EXISTS metas_mensais_tipo_check;

-- Adicionar a nova constraint com os valores corretos
ALTER TABLE public.metas_mensais 
ADD CONSTRAINT metas_mensais_tipo_check 
CHECK (tipo IN ('gasto_maximo', 'economia_minima'));

-- Atualizar registros existentes que usam os valores antigos
-- Converter 'gasto' para 'gasto_maximo' e 'financeira' para 'economia_minima'
UPDATE public.metas_mensais 
SET tipo = CASE 
  WHEN tipo = 'gasto' THEN 'gasto_maximo'
  WHEN tipo = 'financeira' THEN 'economia_minima'
  WHEN tipo = 'pessoal' THEN 'economia_minima'
  ELSE tipo
END
WHERE tipo IN ('gasto', 'financeira', 'pessoal');
