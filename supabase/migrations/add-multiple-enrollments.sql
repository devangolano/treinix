-- ============================================
-- MIGRAÇÃO: Suporte a Matrículas Múltiplas
-- Data: 2026-01-19
-- Objetivo: Permitir que alunos se matriculem em várias formações
-- ============================================

-- 1. Remover views que dependem das colunas formacao_id e turma_id
DROP VIEW IF EXISTS alunos_with_payment_status CASCADE;

-- 2. Remover as colunas formacao_id e turma_id de alunos (agora serão referenciadas via matriculas)
ALTER TABLE alunos DROP CONSTRAINT IF EXISTS idx_alunos_formacao_id;
ALTER TABLE alunos DROP CONSTRAINT IF EXISTS idx_alunos_turma_id;
ALTER TABLE alunos DROP COLUMN IF EXISTS formacao_id;
ALTER TABLE alunos DROP COLUMN IF EXISTS turma_id;

-- 2. Criar nova tabela de matrículas
CREATE TABLE IF NOT EXISTS matriculas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  centro_id UUID NOT NULL REFERENCES centros(id) ON DELETE CASCADE,
  formacao_id UUID NOT NULL REFERENCES formacoes(id) ON DELETE RESTRICT,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'cancelled')),
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_aluno_formacao_turma UNIQUE(aluno_id, formacao_id, turma_id)
);

-- Índices para matriculas
CREATE INDEX IF NOT EXISTS idx_matriculas_aluno_id ON matriculas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_centro_id ON matriculas(centro_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_formacao_id ON matriculas(formacao_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_turma_id ON matriculas(turma_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_status ON matriculas(status);
CREATE INDEX IF NOT EXISTS idx_matriculas_aluno_status ON matriculas(aluno_id, status);

-- 3. Adicionar coluna de matrícula_id na tabela pagamentos para rastrear qual matrícula está sendo paga
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS matricula_id UUID REFERENCES matriculas(id) ON DELETE CASCADE;

-- Índice para pagamentos com matrícula
CREATE INDEX IF NOT EXISTS idx_pagamentos_matricula_id ON pagamentos(matricula_id);

-- 4. Atualizar políticas RLS para matriculas
ALTER TABLE matriculas ENABLE ROW LEVEL SECURITY;

-- Super Admin: ver todas as matrículas
CREATE POLICY "Super admin vê todas as matrículas" ON matriculas
  FOR SELECT
  USING (get_user_role(auth.jwt() ->> 'email') = 'super_admin');

-- Centro: gerenciar suas matrículas
CREATE POLICY "Centro gerencia suas matrículas" ON matriculas
  FOR ALL
  USING (centro_id = get_user_centro_id(auth.jwt() ->> 'email'));

-- Qualquer usuário autenticado pode criar matrículas
CREATE POLICY "Qualquer usuário pode criar matrículas" ON matriculas
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- VIEWS para facilitar queries (opcional)
-- ============================================

-- View: Alunos com suas matrículas ativas
CREATE OR REPLACE VIEW alunos_com_matriculas AS
SELECT 
  a.id as aluno_id,
  a.centro_id,
  a.name,
  a.email,
  a.phone,
  a.bi,
  a.address,
  a.birth_date,
  a.status,
  m.id as matricula_id,
  m.formacao_id,
  m.turma_id,
  f.name as formacao_name,
  t.name as turma_name,
  m.status as matricula_status,
  m.enrollment_date
FROM alunos a
LEFT JOIN matriculas m ON a.id = m.aluno_id AND m.status = 'active'
LEFT JOIN formacoes f ON m.formacao_id = f.id
LEFT JOIN turmas t ON m.turma_id = t.id
ORDER BY a.created_at DESC;

-- View: Recriação da view antiga para compatibilidade com código existente
-- Agora baseada em matrículas, não em colunas da tabela alunos
CREATE OR REPLACE VIEW alunos_with_payment_status AS
SELECT 
  a.id,
  a.centro_id,
  a.name,
  a.email,
  a.phone,
  a.bi,
  a.address,
  a.birth_date,
  a.status,
  a.created_at,
  a.updated_at,
  m.formacao_id,
  m.turma_id,
  f.name as formacao_name,
  t.name as turma_name,
  p.amount as payment_amount,
  p.installments,
  p.installments_paid,
  p.status as payment_status,
  p.payment_method,
  (p.amount - (p.amount / NULLIF(p.installments, 0) * p.installments_paid)) as amount_remaining
FROM alunos a
LEFT JOIN matriculas m ON a.id = m.aluno_id AND m.status = 'active'
LEFT JOIN formacoes f ON m.formacao_id = f.id
LEFT JOIN turmas t ON m.turma_id = t.id
LEFT JOIN pagamentos p ON m.id = p.matricula_id;

-- ============================================
-- Dados de Migração (se necessário)
-- ============================================

-- Se você tinha dados antigos com formacao_id e turma_id, seria necessário:
-- INSERT INTO matriculas (aluno_id, centro_id, formacao_id, turma_id, status)
-- SELECT id, centro_id, formacao_id, turma_id, 'active'
-- FROM alunos
-- WHERE formacao_id IS NOT NULL AND turma_id IS NOT NULL;
