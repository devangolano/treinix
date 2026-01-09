-- ============================================
-- MIGRAÇÃO: Adicionar coluna auth_user_id na tabela users
-- Mapeia o UUID do Supabase Auth com o UUID da tabela users
-- ============================================

-- Adicionar coluna auth_user_id se não existir
ALTER TABLE users ADD COLUMN auth_user_id UUID;

-- Adicionar restrição UNIQUE para auth_user_id
ALTER TABLE users ADD CONSTRAINT unique_auth_user_id UNIQUE(auth_user_id);

-- Criar índice para buscar rápido pelo auth_user_id
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);

-- Adicionar comentário à coluna
COMMENT ON COLUMN users.auth_user_id IS 'UUID do usuário no Supabase Auth';
