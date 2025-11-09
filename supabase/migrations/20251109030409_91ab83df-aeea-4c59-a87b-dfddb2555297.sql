-- ============================================
-- SOLUÇÃO COMPLETA: SINCRONIZAÇÃO AUTOMÁTICA DE USUÁRIOS
-- ============================================

-- 1. Adicionar policy de INSERT em users (para o trigger funcionar)
CREATE POLICY "Sistema pode inserir usuários via trigger"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- 2. Criar função que insere automaticamente em public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    nome_completo,
    email_verificado,
    google_id,
    apple_id,
    microsoft_id,
    ativo,
    aceita_lgpd,
    data_criacao
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email_confirmed_at IS NOT NULL,
    CASE WHEN NEW.raw_user_meta_data->>'provider' = 'google' THEN NEW.id::text ELSE NULL END,
    CASE WHEN NEW.raw_user_meta_data->>'provider' = 'apple' THEN NEW.id::text ELSE NULL END,
    CASE WHEN NEW.raw_user_meta_data->>'provider' = 'microsoft' THEN NEW.id::text ELSE NULL END,
    true,
    true,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 3. Criar trigger que executa após signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Migrar usuários existentes de auth.users para public.users
INSERT INTO public.users (
  id,
  email,
  nome_completo,
  email_verificado,
  google_id,
  ativo,
  aceita_lgpd,
  data_criacao
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', au.email),
  au.email_confirmed_at IS NOT NULL,
  CASE WHEN au.raw_user_meta_data->>'provider' = 'google' THEN au.id::text ELSE NULL END,
  true,
  true,
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- ============================================
-- SINCRONIZAÇÃO AUTOMÁTICA CONFIGURADA! ✅
-- ============================================