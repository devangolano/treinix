-- ============================================
-- CRIAR BUCKET PARA CERTIFICADOS PDFs
-- ============================================

-- Criar o bucket 'certificados-pdfs' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificados-pdfs', 'certificados-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- POLÍTICAS RLS DO BUCKET
-- ============================================

-- Permitir que usuários autenticados façam upload de PDFs
CREATE POLICY "Usuários autenticados podem fazer upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'certificados-pdfs'
    AND auth.role() = 'authenticated'
  );

-- Permitir que usuários autenticados leiam PDFs
CREATE POLICY "Usuários autenticados podem ler PDFs" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'certificados-pdfs'
    AND auth.role() = 'authenticated'
  );

-- Permitir que usuários autenticados atualizem seus próprios PDFs
CREATE POLICY "Usuários autenticados podem atualizar PDFs" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'certificados-pdfs'
    AND auth.role() = 'authenticated'
  );

-- Permitir que usuários autenticados deletem seus próprios PDFs
CREATE POLICY "Usuários autenticados podem deletar PDFs" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'certificados-pdfs'
    AND auth.role() = 'authenticated'
  );

-- ============================================
-- NOTA: Para criar o bucket via UI do Supabase:
-- 1. Ir para Storage no painel do Supabase
-- 2. Clicar em "New Bucket"
-- 3. Nome: certificados-pdfs
-- 4. Public: Desabilitar (deixar privado)
-- 5. Aplicar as políticas RLS acima
-- ============================================
