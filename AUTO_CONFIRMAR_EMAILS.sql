-- 🔄 Auto-confirmar Email de Usuários Não Confirmados
-- Execute este script no Supabase SQL Editor para confirmar todos os usuários pendentes

-- ⚠️ IMPORTANTE: Apenas para DESENVOLVIMENTO
-- Este script marca todos os emails como confirmados

UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- ✅ Resultado: Todos os usuários agora podem fazer login
-- Execute isto após criar um usuário novo se o email ainda não estiver confirmado

-- 📊 Verificar usuários confirmados:
SELECT id, email, email_confirmed_at FROM auth.users;
