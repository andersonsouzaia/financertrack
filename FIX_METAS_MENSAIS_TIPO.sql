-- ============================================
-- CORREÇÃO: Atualizar constraint de tipo em METAS_MENSAIS
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- para corrigir o erro ao salvar metas mensais

-- 1. Remover a constraint antiga
ALTER TABLE public.metas_mensais 
DROP CONSTRAINT IF EXISTS metas_mensais_tipo_check;

-- 2. Atualizar registros existentes (se houver)
-- Converter valores antigos para os novos
UPDATE public.metas_mensais 
SET tipo = CASE 
  WHEN tipo = 'gasto' THEN 'gasto_maximo'
  WHEN tipo = 'financeira' THEN 'economia_minima'
  WHEN tipo = 'pessoal' THEN 'economia_minima'
  ELSE tipo
END
WHERE tipo IN ('gasto', 'financeira', 'pessoal');

-- 3. Adicionar a nova constraint com os valores corretos
ALTER TABLE public.metas_mensais 
ADD CONSTRAINT metas_mensais_tipo_check 
CHECK (tipo IN ('gasto_maximo', 'economia_minima'));

-- ============================================
-- CONCLUÍDO! ✅
-- Agora você pode criar metas mensais sem erro.
-- ============================================
