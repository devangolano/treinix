-- ============================================
-- MIGRATION: Atualizar tabela certificados
-- Adicionar campos: estado e pdf_url
-- Remover: data_validade (se existir)
-- ============================================

-- Remover coluna data_validade se existir
ALTER TABLE IF EXISTS public.certificados
DROP COLUMN IF EXISTS data_validade;

-- Adicionar coluna 'estado' se não existir
ALTER TABLE IF EXISTS public.certificados
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'emitido' CHECK (estado IN ('emitido', 'em_andamento', 'pronto'));

-- Adicionar coluna 'pdf_url' para armazenar URL do PDF (tipo TEXT)
ALTER TABLE IF EXISTS public.certificados
ADD COLUMN IF NOT EXISTS pdf_url TEXT NULL;

-- Adicionar índice para melhorar performance em buscas por estado
CREATE INDEX IF NOT EXISTS idx_certificados_estado ON public.certificados(estado);

-- Adicionar índice para melhorar performance em buscas por centro e estado
CREATE INDEX IF NOT EXISTS idx_certificados_centro_estado ON public.certificados(centro_id, estado);

-- ============================================
-- COMENTÁRIOS DAS COLUNAS
-- ============================================

COMMENT ON COLUMN public.certificados.estado IS 'Estado do certificado: emitido, em_andamento, pronto';
COMMENT ON COLUMN public.certificados.pdf_url IS 'URL do arquivo PDF do certificado armazenado no Supabase Storage';

-- ============================================
-- POLÍTICAS RLS (Row Level Security) - Opcional
-- ============================================

-- Permitir leitura do PDF pelo aluno (se autenticado)
-- Permitir escrita do PDF pelo admin do centro

-- Se você usar Supabase Storage, configure as políticas no painel do Supabase

-- ============================================
-- TABELA PARA RASTREAR NOTIFICAÇÕES (Opcional)
-- ============================================

CREATE TABLE IF NOT EXISTS public.notificacoes_certificado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificado_id UUID NOT NULL REFERENCES public.certificados(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('whatsapp', 'email')), -- tipo de notificação
  mensagem TEXT NOT NULL,
  enviado_em TIMESTAMP NULL, -- quando foi enviado
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'falhou')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_certificado_id ON public.notificacoes_certificado(certificado_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_status ON public.notificacoes_certificado(status);

-- ============================================
-- FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- ============================================

CREATE OR REPLACE FUNCTION update_certificados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS certificados_update_timestamp ON public.certificados;

CREATE TRIGGER certificados_update_timestamp
BEFORE UPDATE ON public.certificados
FOR EACH ROW
EXECUTE FUNCTION update_certificados_updated_at();

-- ============================================
-- POLÍTICAS RLS PARA NOTIFICAÇÕES
-- ============================================

ALTER TABLE public.notificacoes_certificado ENABLE ROW LEVEL SECURITY;

-- Usuários do centro podem ver notificações dos seus certificados
DROP POLICY IF EXISTS notificacoes_certificado_read ON public.notificacoes_certificado;
CREATE POLICY notificacoes_certificado_read ON public.notificacoes_certificado
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.certificados c
      WHERE c.id = certificado_id
      AND c.centro_id = auth.uid()
    )
  );

-- Apenas admins do centro podem inserir notificações
DROP POLICY IF EXISTS notificacoes_certificado_insert ON public.notificacoes_certificado;
CREATE POLICY notificacoes_certificado_insert ON public.notificacoes_certificado
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.certificados c
      WHERE c.id = certificado_id
      AND c.centro_id = auth.uid()
    )
  );

-- ============================================
-- DADOS INICIAIS (se necessário)
-- ============================================

-- Atualizar certificados existentes para estado 'emitido'
UPDATE public.certificados
SET estado = 'emitido'
WHERE estado IS NULL;

-- ============================================
-- ROLLBACK (Se precisar reverter)
-- ============================================

-- DROP INDEX IF EXISTS idx_certificados_estado;
-- DROP INDEX IF EXISTS idx_certificados_centro_estado;
-- DROP TRIGGER IF EXISTS certificados_update_timestamp ON public.certificados;
-- DROP FUNCTION IF EXISTS update_certificados_updated_at();
-- ALTER TABLE public.certificados DROP COLUMN IF EXISTS estado;
-- ALTER TABLE public.certificados DROP COLUMN IF EXISTS pdf_url;
-- DROP TABLE IF EXISTS public.notificacoes_certificado CASCADE;
