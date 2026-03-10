-- Script para criar o bucket de storage para logos dos centros
-- IMPORTANTE: Este script foi simplificado - as políticas RLS devem ser criadas via Dashboard do Supabase
-- Pois requerem permissões especiais que não podem ser executadas via SQL direto

-- ========================================
-- 1. CRIAR BUCKET (se ainda não existir)
-- ========================================
-- Você pode criar o bucket manualmente no Dashboard do Supabase em:
-- Storage > Create a new bucket > Nome: "centro-logos" > Make it public

-- OU execute este SQL (se tiver permissão):
INSERT INTO storage.buckets (id, name, owner, public)
VALUES ('centro-logos', 'centro-logos', null, true)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 2. POLÍTICAS RLS
-- ========================================
-- EXECUTE ESTAS POLÍTICAS NO DASHBOARD DO SUPABASE:
--
-- Policy 1 - Public Read (SELECT)
-- - Target roles: Public
-- - Target: storage.objects
-- - Allowed operations: SELECT
-- - USING expression: (bucket_id = 'centro-logos')
--
-- Policy 2 - Authenticated Upload (INSERT)
-- - Target roles: Authenticated
-- - Target: storage.objects
-- - Allowed operations: INSERT
-- - WITH CHECK expression: (bucket_id = 'centro-logos')
--
-- Policy 3 - Authenticated Delete (DELETE)
-- - Target roles: Authenticated
-- - Target: storage.objects
-- - Allowed operations: DELETE
-- - USING expression: (bucket_id = 'centro-logos')
--
-- Policy 4 - Authenticated Update (UPDATE)
-- - Target roles: Authenticated
-- - Target: storage.objects
-- - Allowed operations: UPDATE
-- - USING expression: (bucket_id = 'centro-logos')
--
-- ========================================
-- ALTERNATIVA: SQL com permissões corretas
-- ========================================
-- Se preferir, você pode copiar e colar as políticas abaixo no SQL Editor:

-- Desabilitar RLS temporariamente (se necessário)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Criar políticas (execute individualmente se uma falhar):
-- CREATE POLICY "Centro logos public read"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'centro-logos');

-- CREATE POLICY "Centro logos authenticated insert"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'centro-logos' AND auth.role() = 'authenticated');

-- CREATE POLICY "Centro logos authenticated delete"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'centro-logos' AND auth.role() = 'authenticated');

-- CREATE POLICY "Centro logos authenticated update"
-- ON storage.objects FOR UPDATE
-- USING (bucket_id = 'centro-logos' AND auth.role() = 'authenticated');
