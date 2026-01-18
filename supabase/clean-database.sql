-- ============================================
-- LIMPEZA COMPLETA DO BANCO DE DADOS
-- ============================================

-- Passo 1: Deletar views (sem precisar disabilitar RLS)
DROP VIEW IF EXISTS alunos_with_payment_status CASCADE;
DROP VIEW IF EXISTS pagamentos_summary CASCADE;
DROP VIEW IF EXISTS active_subscriptions_summary CASCADE;

-- Passo 2: Deletar todas as tabelas com CASCADE (remove políticas, triggers, constraints)
DROP TABLE IF EXISTS pagamento_installments CASCADE;
DROP TABLE IF EXISTS pagamentos CASCADE;
DROP TABLE IF EXISTS alunos CASCADE;
DROP TABLE IF EXISTS turmas CASCADE;
DROP TABLE IF EXISTS formacoes CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS centros CASCADE;

-- Passo 3: Deletar funções
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS has_active_subscription(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_role(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_centro_id(TEXT) CASCADE;

-- ============================================
-- FIM - BANCO LIMPO ✓
-- ============================================
