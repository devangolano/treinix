-- Adicionar colunas auth_user_id e status à tabela users
-- Esta migração adiciona suporte para vinculação com Supabase Auth

-- Adicionar coluna auth_user_id (para vincular com auth.users)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Criar índice para auth_user_id para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Criar restrição de chave estrangeira para auth.users (opcional, apenas se necessário)
-- ALTER TABLE users ADD CONSTRAINT fk_users_auth_user_id FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adicionar comentários explicativos
COMMENT ON COLUMN users.auth_user_id IS 'UUID do usuário no Supabase Auth (auth.users.id)';
COMMENT ON COLUMN users.status IS 'Status do usuário no sistema: active, inactive, pending, suspended';
COMMENT ON COLUMN users.last_login IS 'Data e hora do último login';
