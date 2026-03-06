-- ============================================
-- SCRIPT PARA ATUALIZAR DADOS DO SUPER ADMIN
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Atualizar dados do super admin na tabela users
UPDATE users
SET 
  name = 'Super Admin',
  phone = '+244 923 456 789',
  role = 'super_admin'
WHERE email = 'devangolano@gmail.com';

-- Verificar se foi atualizado corretamente
SELECT id, name, email, phone, role, created_at, updated_at 
FROM users 
WHERE email = 'devangolano@gmail.com';

-- ============================================
-- NOTA IMPORTANTE
-- ============================================
-- Se você precisa alterar a senha, vá em:
-- Authentication → Users → Procure devangolano@gmail.com
-- Clique nos 3 pontinhos e selecione "Reset password"
-- Ou delete e crie um novo usuário com a nova senha
