-- ============================================
-- FORMAÇÃO-AO - Schema Simplificado para Desenvolvimento
-- Sistema de Gestão para Centros de Formação
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABELA: centros
-- Armazena informações dos centros de formação
-- ============================================
CREATE TABLE IF NOT EXISTS centros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  nif VARCHAR(50),
  subscription_status VARCHAR(20) NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'pending', 'expired', 'blocked')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_centros_email ON centros(email);
CREATE INDEX IF NOT EXISTS idx_centros_subscription_status ON centros(subscription_status);

-- ============================================
-- TABELA: subscriptions
-- Subscrições dos centros de formação
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  centro_id UUID NOT NULL REFERENCES centros(id) ON DELETE CASCADE,
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('mensal', 'trimestral', 'semestral', 'anual')),
  months INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('trial', 'active', 'pending', 'expired', 'blocked')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_centro_id ON subscriptions(centro_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_status ON subscriptions(payment_status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);

-- ============================================
-- TABELA: formacoes
-- Cursos/Formações oferecidos pelos centros
-- ============================================
CREATE TABLE IF NOT EXISTS formacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  centro_id UUID NOT NULL REFERENCES centros(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_formacoes_centro_id ON formacoes(centro_id);
CREATE INDEX IF NOT EXISTS idx_formacoes_status ON formacoes(status);
CREATE INDEX IF NOT EXISTS idx_formacoes_category ON formacoes(category);

-- ============================================
-- TABELA: turmas
-- Turmas/Classes dos cursos
-- ============================================
CREATE TABLE IF NOT EXISTS turmas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  centro_id UUID NOT NULL REFERENCES centros(id) ON DELETE CASCADE,
  formacao_id UUID NOT NULL REFERENCES formacoes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  schedule VARCHAR(255) NOT NULL,
  max_students INTEGER NOT NULL DEFAULT 25,
  current_students INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chk_students CHECK (current_students <= max_students)
);

CREATE INDEX IF NOT EXISTS idx_turmas_centro_id ON turmas(centro_id);
CREATE INDEX IF NOT EXISTS idx_turmas_formacao_id ON turmas(formacao_id);
CREATE INDEX IF NOT EXISTS idx_turmas_status ON turmas(status);
CREATE INDEX IF NOT EXISTS idx_turmas_start_date ON turmas(start_date);

-- ============================================
-- TABELA: alunos
-- Estudantes matriculados
-- ============================================
CREATE TABLE IF NOT EXISTS alunos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  centro_id UUID NOT NULL REFERENCES centros(id) ON DELETE CASCADE,
  formacao_id UUID REFERENCES formacoes(id) ON DELETE SET NULL,
  turma_id UUID REFERENCES turmas(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  bi VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  birth_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_bi_per_centro UNIQUE(centro_id, bi)
);

CREATE INDEX IF NOT EXISTS idx_alunos_centro_id ON alunos(centro_id);
CREATE INDEX IF NOT EXISTS idx_alunos_formacao_id ON alunos(formacao_id);
CREATE INDEX IF NOT EXISTS idx_alunos_turma_id ON alunos(turma_id);
CREATE INDEX IF NOT EXISTS idx_alunos_status ON alunos(status);
CREATE INDEX IF NOT EXISTS idx_alunos_email ON alunos(email);
CREATE INDEX IF NOT EXISTS idx_alunos_bi ON alunos(bi);

-- ============================================
-- TABELA: pagamentos
-- Pagamentos dos alunos
-- ============================================
CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  centro_id UUID NOT NULL REFERENCES centros(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  installments INTEGER NOT NULL CHECK (installments IN (1, 2)),
  installments_paid INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed', 'cancelled')),
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'multicaixa')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_centro_id ON pagamentos(centro_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_aluno_id ON pagamentos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_turma_id ON pagamentos(turma_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);

-- ============================================
-- TABELA: pagamento_installments
-- Prestações dos pagamentos
-- ============================================
CREATE TABLE IF NOT EXISTS pagamento_installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pagamento_id UUID NOT NULL REFERENCES pagamentos(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_installment UNIQUE(pagamento_id, installment_number)
);

CREATE INDEX IF NOT EXISTS idx_installments_pagamento_id ON pagamento_installments(pagamento_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON pagamento_installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON pagamento_installments(due_date);

-- ============================================
-- TRIGGERS
-- Atualização automática de timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_centros_updated_at ON centros;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_formacoes_updated_at ON formacoes;
DROP TRIGGER IF EXISTS update_turmas_updated_at ON turmas;
DROP TRIGGER IF EXISTS update_alunos_updated_at ON alunos;
DROP TRIGGER IF EXISTS update_pagamentos_updated_at ON pagamentos;

-- Create triggers
CREATE TRIGGER update_centros_updated_at BEFORE UPDATE ON centros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_formacoes_updated_at BEFORE UPDATE ON formacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_turmas_updated_at BEFORE UPDATE ON turmas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alunos_updated_at BEFORE UPDATE ON alunos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pagamentos_updated_at BEFORE UPDATE ON pagamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View de centros com subscrição ativa
CREATE OR REPLACE VIEW centros_ativos AS
SELECT c.* FROM centros c
LEFT JOIN subscriptions s ON c.id = s.centro_id AND s.status = 'active' AND s.end_date > NOW()
WHERE c.subscription_status IN ('active', 'trial')
OR s.id IS NOT NULL;

CREATE OR REPLACE VIEW alunos_com_turma AS
SELECT 
  a.id,
  a.name,
  a.email,
  a.centro_id,
  t.id as turma_id,
  t.name as turma_name,
  f.id as formacao_id,
  f.name as formacao_name,
  a.created_at
FROM alunos a
LEFT JOIN turmas t ON a.turma_id = t.id
LEFT JOIN formacoes f ON a.formacao_id = f.id;

-- ============================================
-- DADOS INICIAIS DE TESTE (OPCIONAL)
-- Descomente se quiser popular com dados de teste
-- ============================================

-- INSERT INTO centros (name, email, phone, address, nif, subscription_status, trial_ends_at)
-- VALUES (
--   'Centro de Teste',
--   'teste@test.ao',
--   '+244923456789',
--   'Luanda, Angola',
--   '00123456789LA',
--   'trial',
--   NOW() + INTERVAL '3 days'
-- );

-- ============================================
-- TABELA: users (Usuários do Centro)
-- Armazena secretários e outros usuários vinculados a centros
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  centro_id UUID NOT NULL REFERENCES centros(id) ON DELETE CASCADE,
  auth_user_id UUID UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'secretario' CHECK (role IN ('centro_admin', 'secretario', 'instructor')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_centro_id ON users(centro_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Trigger para atualizar updated_at em users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FIM DO SCHEMA
-- ============================================
-- Notas:
-- 1. RLS foi DESABILITADO para facilitar desenvolvimento
-- 2. Todas as tabelas usam UUID como chave primária
-- 3. Triggers mantêm os timestamps atualizados automaticamente
-- 4. Índices otimizam queries comuns
-- 5. Views auxiliam na consulta de dados relacionados
-- ============================================
