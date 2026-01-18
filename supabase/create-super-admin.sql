-- ============================================
-- SCRIPT PARA CRIAR SUPER ADMIN
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Passo 1: Criar usuário no Supabase Auth
-- IMPORTANTE: Execute isto primeiro no SQL Editor do Supabase:
-- 1. Vá em Authentication → Users
-- 2. Clique "Create User"
-- 3. Preencha:
--    Email: admin@formacao-ao.com
--    Password: admin123
--    Marque "Auto Confirm User"
-- 4. Clique "Create User"

-- Passo 2: Criar registro na tabela users
-- Execute este SQL após criar o usuário no Auth:

INSERT INTO users (name, email, phone, role, password_hash)
VALUES (
  'Super Admin',
  'admin@formacao-ao.com',
  '+244 923 456 789',
  'super_admin',
  '' -- Deixar vazio, pois a senha está no Supabase Auth
)
ON CONFLICT (email) DO UPDATE
SET 
  name = 'Super Admin',
  phone = '+244 923 456 789',
  role = 'super_admin';

-- Verificar se foi criado corretamente
SELECT id, name, email, role, created_at FROM users WHERE email = 'admin@formacao-ao.com';

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================
-- 1. Se não existe Super Admin anterior:
--    a) Vá em Authentication → Users no Supabase
--    b) Clique "Create User"
--    c) Preencha:
--       - Email: admin@formacao-ao.com
--       - Password: admin123
--       - Marque "Auto Confirm User"
--    d) Clique "Create User"
--    e) Volte aqui e execute este SQL
--
-- 2. Se já existe Super Admin e quer substituir:
--    a) Vá em Authentication → Users
--    b) Procure admin@formacao-ao.com
--    c) Delete o usuário
--    d) Crie um novo com os dados acima
--    e) Execute este SQL
--
-- 3. Faça login com:
--    Email: admin@formacao-ao.com
--    Senha: admin123
--
-- ⚠️ MUDE A SENHA APÓS O PRIMEIRO LOGIN!
