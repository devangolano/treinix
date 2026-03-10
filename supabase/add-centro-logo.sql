-- Adicionar coluna logo_url na tabela centro
-- Este script adiciona suporte para armazenar URL da logo do centro

ALTER TABLE centros
ADD COLUMN logo_url TEXT;

-- Criar índice para melhor performance ao recuperar centros com logo
CREATE INDEX IF NOT EXISTS idx_centro_logo_url ON centros(logo_url);

-- Comentário descritivo
COMMENT ON COLUMN centros.logo_url IS 'URL da logo do centro armazenada no Supabase Storage';
