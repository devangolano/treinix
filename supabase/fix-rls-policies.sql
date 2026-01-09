-- ============================================
-- FIX: DESABILITAR RLS para Desenvolvimento
-- ============================================
-- Para ambiente de produção, implementar políticas apropriadas

-- Desabilitar RLS nas tabelas de certificados
ALTER TABLE certificate_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_logs DISABLE ROW LEVEL SECURITY;
