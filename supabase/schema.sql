-- ============================================
-- FORMAÇÃO-AO - Schema Completo Supabase
-- Sistema de Gestão para Centros de Formação
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABELA: centros
-- Armazena informações dos centros de formação
-- ============================================
CREATE TABLE centros (
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

-- Índices para otimização
CREATE INDEX idx_centros_email ON centros(email);
CREATE INDEX idx_centros_subscription_status ON centros(subscription_status);

-- ============================================
-- TABELA: users
-- Usuários do sistema (Super Admin, Admin Centro, Secretário)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  centro_id UUID REFERENCES centros(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'centro_admin', 'secretario')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_centro_id ON users(centro_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- TABELA: subscriptions
-- Subscrições dos centros de formação
-- ============================================
CREATE TABLE subscriptions (
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

-- Índices
CREATE INDEX idx_subscriptions_centro_id ON subscriptions(centro_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_payment_status ON subscriptions(payment_status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);

-- ============================================
-- TABELA: formacoes
-- Cursos/Formações oferecidos pelos centros
-- ============================================
CREATE TABLE formacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  centro_id UUID NOT NULL REFERENCES centros(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- em horas
  price DECIMAL(12, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_formacoes_centro_id ON formacoes(centro_id);
CREATE INDEX idx_formacoes_status ON formacoes(status);
CREATE INDEX idx_formacoes_category ON formacoes(category);

-- ============================================
-- TABELA: turmas
-- Turmas/Classes dos cursos
-- ============================================
CREATE TABLE turmas (
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

-- Índices
CREATE INDEX idx_turmas_centro_id ON turmas(centro_id);
CREATE INDEX idx_turmas_formacao_id ON turmas(formacao_id);
CREATE INDEX idx_turmas_status ON turmas(status);
CREATE INDEX idx_turmas_start_date ON turmas(start_date);

-- ============================================
-- TABELA: alunos
-- Estudantes matriculados
-- ============================================
CREATE TABLE alunos (
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

-- Índices
CREATE INDEX idx_alunos_centro_id ON alunos(centro_id);
CREATE INDEX idx_alunos_formacao_id ON alunos(formacao_id);
CREATE INDEX idx_alunos_turma_id ON alunos(turma_id);
CREATE INDEX idx_alunos_status ON alunos(status);
CREATE INDEX idx_alunos_email ON alunos(email);
CREATE INDEX idx_alunos_bi ON alunos(bi);

-- ============================================
-- TABELA: pagamentos
-- Pagamentos dos alunos
-- ============================================
CREATE TABLE pagamentos (
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

-- Índices
CREATE INDEX idx_pagamentos_centro_id ON pagamentos(centro_id);
CREATE INDEX idx_pagamentos_aluno_id ON pagamentos(aluno_id);
CREATE INDEX idx_pagamentos_turma_id ON pagamentos(turma_id);
CREATE INDEX idx_pagamentos_status ON pagamentos(status);

-- ============================================
-- TABELA: pagamento_installments
-- Prestações dos pagamentos
-- ============================================
CREATE TABLE pagamento_installments (
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

-- Índices
CREATE INDEX idx_installments_pagamento_id ON pagamento_installments(pagamento_id);
CREATE INDEX idx_installments_status ON pagamento_installments(status);
CREATE INDEX idx_installments_due_date ON pagamento_installments(due_date);

-- ============================================
-- TRIGGERS
-- Atualização automática de timestamps
-- ============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER update_centros_updated_at BEFORE UPDATE ON centros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
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
-- FUNÇÕES AUXILIARES
-- ============================================

-- Função para verificar se um centro tem subscrição ativa
CREATE OR REPLACE FUNCTION has_active_subscription(centro_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE centro_id = centro_uuid 
    AND status = 'active' 
    AND end_date > NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Função para obter o papel do usuário atual
CREATE OR REPLACE FUNCTION get_user_role(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM users WHERE email = user_email;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql;

-- Função para obter o centro_id do usuário atual
CREATE OR REPLACE FUNCTION get_user_centro_id(user_email TEXT)
RETURNS UUID AS $$
DECLARE
  user_centro UUID;
BEGIN
  SELECT centro_id INTO user_centro FROM users WHERE email = user_email;
  RETURN user_centro;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE centros ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE formacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamento_installments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS: centros
-- ============================================

-- Super Admin: acesso total
CREATE POLICY "Super admin tem acesso total aos centros" ON centros
  FOR ALL
  USING (get_user_role(auth.jwt() ->> 'email') = 'super_admin');

-- Centro Admin/Secretário: ver apenas seu centro
CREATE POLICY "Centro admin/secretário vê apenas seu centro" ON centros
  FOR SELECT
  USING (id = get_user_centro_id(auth.jwt() ->> 'email'));

-- Centro Admin: atualizar seu centro
CREATE POLICY "Centro admin pode atualizar seu centro" ON centros
  FOR UPDATE
  USING (
    id = get_user_centro_id(auth.jwt() ->> 'email') 
    AND get_user_role(auth.jwt() ->> 'email') = 'centro_admin'
  );

-- ============================================
-- POLÍTICAS RLS: users
-- ============================================

-- Super Admin: acesso total
CREATE POLICY "Super admin tem acesso total aos usuários" ON users
  FOR ALL
  USING (get_user_role(auth.jwt() ->> 'email') = 'super_admin');

-- Centro Admin: gerenciar usuários do seu centro
CREATE POLICY "Centro admin gerencia usuários do centro" ON users
  FOR ALL
  USING (
    centro_id = get_user_centro_id(auth.jwt() ->> 'email')
    AND get_user_role(auth.jwt() ->> 'email') IN ('centro_admin', 'secretario')
  );

-- ============================================
-- POLÍTICAS RLS: subscriptions
-- ============================================

-- Super Admin: acesso total
CREATE POLICY "Super admin tem acesso total às subscrições" ON subscriptions
  FOR ALL
  USING (get_user_role(auth.jwt() ->> 'email') = 'super_admin');

-- Centro: ver e criar suas subscrições
CREATE POLICY "Centro vê suas subscrições" ON subscriptions
  FOR SELECT
  USING (centro_id = get_user_centro_id(auth.jwt() ->> 'email'));

CREATE POLICY "Centro pode criar subscrições" ON subscriptions
  FOR INSERT
  WITH CHECK (
    centro_id = get_user_centro_id(auth.jwt() ->> 'email')
    AND get_user_role(auth.jwt() ->> 'email') = 'centro_admin'
  );

-- ============================================
-- POLÍTICAS RLS: formacoes
-- ============================================

-- Super Admin: ver todas
CREATE POLICY "Super admin vê todas as formações" ON formacoes
  FOR SELECT
  USING (get_user_role(auth.jwt() ->> 'email') = 'super_admin');

-- Centro: gerenciar suas formações
CREATE POLICY "Centro gerencia suas formações" ON formacoes
  FOR ALL
  USING (centro_id = get_user_centro_id(auth.jwt() ->> 'email'));

-- ============================================
-- POLÍTICAS RLS: turmas
-- ============================================

-- Super Admin: ver todas
CREATE POLICY "Super admin vê todas as turmas" ON turmas
  FOR SELECT
  USING (get_user_role(auth.jwt() ->> 'email') = 'super_admin');

-- Centro: gerenciar suas turmas
CREATE POLICY "Centro gerencia suas turmas" ON turmas
  FOR ALL
  USING (centro_id = get_user_centro_id(auth.jwt() ->> 'email'));

-- ============================================
-- POLÍTICAS RLS: alunos
-- ============================================

-- Super Admin: ver todos
CREATE POLICY "Super admin vê todos os alunos" ON alunos
  FOR SELECT
  USING (get_user_role(auth.jwt() ->> 'email') = 'super_admin');

-- Centro: gerenciar seus alunos
CREATE POLICY "Centro gerencia seus alunos" ON alunos
  FOR ALL
  USING (centro_id = get_user_centro_id(auth.jwt() ->> 'email'));

-- ============================================
-- POLÍTICAS RLS: pagamentos
-- ============================================

-- Super Admin: ver todos
CREATE POLICY "Super admin vê todos os pagamentos" ON pagamentos
  FOR SELECT
  USING (get_user_role(auth.jwt() ->> 'email') = 'super_admin');

-- Centro: gerenciar seus pagamentos
CREATE POLICY "Centro gerencia seus pagamentos" ON pagamentos
  FOR ALL
  USING (centro_id = get_user_centro_id(auth.jwt() ->> 'email'));

-- ============================================
-- POLÍTICAS RLS: pagamento_installments
-- ============================================

-- Super Admin: ver todas
CREATE POLICY "Super admin vê todas as prestações" ON pagamento_installments
  FOR SELECT
  USING (
    get_user_role(auth.jwt() ->> 'email') = 'super_admin'
  );

-- Centro: gerenciar prestações dos seus pagamentos
CREATE POLICY "Centro gerencia prestações dos seus pagamentos" ON pagamento_installments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM pagamentos 
      WHERE pagamentos.id = pagamento_installments.pagamento_id
      AND pagamentos.centro_id = get_user_centro_id(auth.jwt() ->> 'email')
    )
  );

-- ============================================
-- DADOS INICIAIS (SEEDS)
-- ============================================

-- Inserir Super Admin
INSERT INTO users (id, name, email, password_hash, role)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Super Admin',
  'admin@formacao-ao.com',
  crypt('admin123', gen_salt('bf')), -- Use bcrypt na aplicação real
  'super_admin'
);

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View: Resumo de subscrições ativas
CREATE OR REPLACE VIEW active_subscriptions_summary AS
SELECT 
  c.id as centro_id,
  c.name as centro_name,
  s.plan,
  s.start_date,
  s.end_date,
  s.status,
  s.payment_status,
  EXTRACT(DAY FROM (s.end_date - NOW())) as days_remaining
FROM centros c
LEFT JOIN subscriptions s ON c.id = s.centro_id
WHERE s.status IN ('active', 'trial')
ORDER BY s.end_date ASC;

-- View: Resumo de pagamentos por centro
CREATE OR REPLACE VIEW pagamentos_summary AS
SELECT 
  c.id as centro_id,
  c.name as centro_name,
  COUNT(p.id) as total_pagamentos,
  SUM(p.amount) as total_amount,
  SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as paid_amount,
  SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as pending_amount
FROM centros c
LEFT JOIN pagamentos p ON c.id = p.centro_id
GROUP BY c.id, c.name;

-- View: Alunos com status de pagamento
CREATE OR REPLACE VIEW alunos_with_payment_status AS
SELECT 
  a.*,
  f.name as formacao_name,
  t.name as turma_name,
  p.amount as payment_amount,
  p.installments,
  p.installments_paid,
  p.status as payment_status,
  p.payment_method,
  (p.amount - (p.amount / p.installments * p.installments_paid)) as amount_remaining
FROM alunos a
LEFT JOIN formacoes f ON a.formacao_id = f.id
LEFT JOIN turmas t ON a.turma_id = t.id
LEFT JOIN pagamentos p ON a.id = p.aluno_id;

-- ============================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================

COMMENT ON TABLE centros IS 'Centros de formação registrados no sistema';
COMMENT ON TABLE users IS 'Usuários do sistema com diferentes papéis (super_admin, centro_admin, secretario)';
COMMENT ON TABLE subscriptions IS 'Subscrições dos centros com planos mensais, trimestrais, semestrais ou anuais';
COMMENT ON TABLE formacoes IS 'Cursos/formações oferecidos pelos centros';
COMMENT ON TABLE turmas IS 'Turmas/classes dos cursos com datas e horários específicos';
COMMENT ON TABLE alunos IS 'Estudantes matriculados nos centros de formação';
COMMENT ON TABLE pagamentos IS 'Pagamentos dos alunos com suporte para 1 ou 2 prestações';
COMMENT ON TABLE pagamento_installments IS 'Prestações individuais dos pagamentos';

-- ============================================
-- FIM DO SCHEMA
-- ============================================
