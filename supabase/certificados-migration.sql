-- ============================================
-- MIGRAÇÃO: Módulo de Certificados
-- Adiciona tabelas para gerenciar certificados
-- ============================================

-- ============================================
-- TABELA: certificate_templates
-- Armazena modelos de certificados dos centros
-- ============================================
CREATE TABLE certificate_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  centro_id UUID NOT NULL REFERENCES centros(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  pdf_url TEXT NOT NULL, -- URL do arquivo PDF no Supabase Storage
  file_path VARCHAR(500) NOT NULL, -- Caminho do arquivo no storage
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_template_per_centro UNIQUE(centro_id, name)
);

-- Índices
CREATE INDEX idx_certificate_templates_centro_id ON certificate_templates(centro_id);
CREATE INDEX idx_certificate_templates_is_active ON certificate_templates(is_active);

-- ============================================
-- TABELA: certificates
-- Certificados emitidos para alunos
-- ============================================
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  centro_id UUID NOT NULL REFERENCES centros(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES certificate_templates(id) ON DELETE RESTRICT,
  certificate_number VARCHAR(100) NOT NULL, -- Número único do certificado
  pdf_url TEXT, -- URL do certificado gerado
  file_path VARCHAR(500), -- Caminho do arquivo no storage
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  final_grade DECIMAL(5,2), -- Nota final do aluno
  status VARCHAR(20) NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'revoked', 'expired')),
  issued_by UUID REFERENCES users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoke_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_certificate_number UNIQUE(centro_id, certificate_number),
  CONSTRAINT unique_aluno_turma_certificate UNIQUE(aluno_id, turma_id)
);

-- Índices
CREATE INDEX idx_certificates_centro_id ON certificates(centro_id);
CREATE INDEX idx_certificates_aluno_id ON certificates(aluno_id);
CREATE INDEX idx_certificates_turma_id ON certificates(turma_id);
CREATE INDEX idx_certificates_template_id ON certificates(template_id);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_certificates_issue_date ON certificates(issue_date);
CREATE INDEX idx_certificates_certificate_number ON certificates(certificate_number);
CREATE INDEX idx_certificates_final_grade ON certificates(final_grade);

-- ============================================
-- TABELA: certificate_logs
-- Auditoria de emissão de certificados
-- ============================================
CREATE TABLE certificate_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificate_id UUID NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('issued', 'revoked', 'regenerated', 'viewed')),
  action_by UUID REFERENCES users(id) ON DELETE SET NULL,
  action_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_certificate_logs_certificate_id ON certificate_logs(certificate_id);
CREATE INDEX idx_certificate_logs_action_date ON certificate_logs(action_date);
CREATE INDEX idx_certificate_logs_action ON certificate_logs(action);

-- ============================================
-- TRIGGERS
-- Atualização automática de timestamps
-- ============================================

CREATE TRIGGER update_certificate_templates_updated_at BEFORE UPDATE ON certificate_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS: certificate_templates
-- ============================================

-- Políticas RLS comentadas - implementar via aplicação ou funções custom
-- Controle de acesso baseado em auth.uid() será feito na aplicação

-- ============================================
-- POLÍTICAS RLS: certificates
-- ============================================

-- Políticas RLS comentadas - implementar via aplicação ou funções custom
-- Controle de acesso baseado em auth.uid() será feito na aplicação

-- ============================================
-- POLÍTICAS RLS: certificate_logs
-- ============================================

-- Políticas RLS comentadas - implementar via aplicação ou funções custom
-- Controle de acesso baseado em auth.uid() será feito na aplicação

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View: Resumo de certificados por turma
CREATE OR REPLACE VIEW certificates_summary_by_turma AS
SELECT 
  t.id as turma_id,
  t.name as turma_name,
  f.name as formacao_name,
  c.name as centro_name,
  COUNT(a.id) as total_alunos,
  COUNT(cert.id) as certificados_emitidos,
  (COUNT(a.id) - COUNT(cert.id)) as alunos_sem_certificado
FROM turmas t
LEFT JOIN formacoes f ON t.formacao_id = f.id
LEFT JOIN centros c ON t.centro_id = c.id
LEFT JOIN alunos a ON t.id = a.turma_id AND a.status = 'active'
LEFT JOIN certificates cert ON a.id = cert.aluno_id AND t.id = cert.turma_id AND cert.status = 'issued'
GROUP BY t.id, t.name, f.name, c.name, t.centro_id;

-- View: Detalhes completos de certificados emitidos
CREATE OR REPLACE VIEW certificates_detailed AS
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
-- COMENTÁRIOS NAS TABELAS
-- ============================================

COMMENT ON TABLE certificate_templates IS 'Modelos de certificados em PDF que cada centro de formação pode carregar';
COMMENT ON TABLE certificates IS 'Certificados emitidos para alunos, com rastreamento de qual modelo foi usado';
COMMENT ON TABLE certificate_logs IS 'Log de auditoria para todas as ações relacionadas a certificados';

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================
