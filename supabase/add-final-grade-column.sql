-- ============================================
-- MIGRAÇÃO: Adicionar coluna de nota final
-- Adiciona a coluna final_grade à tabela certificates
-- ============================================

ALTER TABLE certificates ADD COLUMN final_grade DECIMAL(5,2);

-- Criar índice para ordenação por nota
CREATE INDEX idx_certificates_final_grade ON certificates(final_grade);

-- Adicionar comentário à coluna
COMMENT ON COLUMN certificates.final_grade IS 'Nota final do aluno para este certificado';
