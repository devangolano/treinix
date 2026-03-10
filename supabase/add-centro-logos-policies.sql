-- Script para criar as políticas RLS do bucket centro-logos
-- Execute no SQL Editor do Supabase com permissões de superuser/project owner

-- ========================================
-- LIMPAR POLÍTICAS ANTIGAS (se existirem)
-- ========================================
DROP POLICY IF EXISTS "Allow public read centro-logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert centro-logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete centro-logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update centro-logos" ON storage.objects;

-- ========================================
-- RECRIAR POLÍTICAS RLS
-- ========================================

-- Policy 1: Leitura pública (SELECT)
CREATE POLICY "Allow public read centro-logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'centro-logos');

-- Policy 2: Insert para usuários autenticados
CREATE POLICY "Allow authenticated insert centro-logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'centro-logos'
  AND auth.role() = 'authenticated'
);

-- Policy 3: Delete para usuários autenticados
CREATE POLICY "Allow authenticated delete centro-logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'centro-logos'
  AND auth.role() = 'authenticated'
);

-- Policy 4: Update para usuários autenticados
CREATE POLICY "Allow authenticated update centro-logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'centro-logos'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'centro-logos'
  AND auth.role() = 'authenticated'
);
