-- ============================================
-- MIGRAÇÃO: 2025-12-29
-- Atualizações para o módulo de certificados
-- - Adiciona coluna auth_user_id na tabela users para mapear com Supabase Auth
-- - Adiciona coluna final_grade na tabela certificates para armazenar a nota do aluno
-- ============================================

-- ============================================
-- 1. ADICIONAR auth_user_id NA TABELA users (SE NÃO EXISTIR)
-- Necessário para mapear usuários do Supabase Auth com a tabela users
-- ============================================

-- Adicionar coluna se não existir
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;

-- Criar índice para buscar rápido pelo auth_user_id (se não existir)
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Adicionar comentário à coluna
COMMENT ON COLUMN users.auth_user_id IS 'UUID do usuário no Supabase Auth';

-- ============================================
-- 2. ADICIONAR final_grade NA TABELA certificates (SE NÃO EXISTIR)
-- Armazena a nota final do aluno para o certificado
-- ============================================

-- Adicionar coluna se não existir
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS final_grade DECIMAL(5,2);

-- Preencher valores NULL com um valor padrão (20.0) para certificados existentes
UPDATE certificates SET final_grade = 20.0 WHERE final_grade IS NULL;

-- Tornar a coluna obrigatória (nota sempre deve ser preenchida)
ALTER TABLE certificates ALTER COLUMN final_grade SET NOT NULL;

-- Criar índice para ordenação por nota (se não existir)
CREATE INDEX IF NOT EXISTS idx_certificates_final_grade ON certificates(final_grade);

-- Adicionar comentário à coluna
COMMENT ON COLUMN certificates.final_grade IS 'Nota final do aluno para este certificado (0-20) - Obrigatório';

-- ============================================
-- 3. ATUALIZAR VIEW certificates_detailed
-- Adiciona colunas centro_id e final_grade que estavam faltando
-- ============================================

DROP VIEW IF EXISTS certificates_detailed CASCADE;

CREATE VIEW certificates_detailed AS
SELECT 
  cert.id,
  cert.centro_id,
  cert.certificate_number,
  a.name as aluno_name,
  a.email as aluno_email,
  t.name as turma_name,
  f.name as formacao_name,
  c.name as centro_name,
  ct.name as template_name,
  cert.issue_date,
  cert.final_grade,
  cert.status,
  u.name as issued_by_name,
  cert.created_at,
  cert.pdf_url
FROM certificates cert
LEFT JOIN alunos a ON cert.aluno_id = a.id
LEFT JOIN turmas t ON cert.turma_id = t.id
LEFT JOIN formacoes f ON t.formacao_id = f.id
LEFT JOIN centros c ON cert.centro_id = c.id
LEFT JOIN certificate_templates ct ON cert.template_id = ct.id
LEFT JOIN users u ON cert.issued_by = u.id;

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================
