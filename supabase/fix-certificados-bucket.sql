-- ============================================
-- CORRIGIR BUCKET CERTIFICADOS-PDFS
-- Tornar público para acesso direto
-- ============================================

-- Atualizar o bucket para ser público
UPDATE storage.buckets
SET public = true
WHERE id = 'certificados-pdfs';

-- ============================================
-- POLÍTICAS RLS - ACESSO PÚBLICO COM AUTENTICAÇÃO
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "auth_upload_certificados" ON storage.objects;
DROP POLICY IF EXISTS "auth_read_certificados" ON storage.objects;
DROP POLICY IF EXISTS "auth_update_certificados" ON storage.objects;
DROP POLICY IF EXISTS "auth_delete_certificados" ON storage.objects;

-- Permitir leitura pública (qualquer pessoa pode visualizar/baixar)
CREATE POLICY "Leitura pública certificados" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'certificados-pdfs');

-- Permitir que usuários autenticados façam upload
CREATE POLICY "Upload certificados autenticado" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'certificados-pdfs'
    AND auth.role() = 'authenticated'
  );

-- Permitir que usuários autenticados atualizem seus PDFs
CREATE POLICY "Update certificados autenticado" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'certificados-pdfs'
    AND auth.role() = 'authenticated'
  );

-- Permitir que usuários autenticados deletem seus PDFs
CREATE POLICY "Delete certificados autenticado" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'certificados-pdfs'
    AND auth.role() = 'authenticated'
  );

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- SELECT id, name, public FROM storage.buckets WHERE id = 'certificados-pdfs';
-- SELECT bucket_id, name FROM storage.objects WHERE bucket_id = 'certificados-pdfs' LIMIT 5;
