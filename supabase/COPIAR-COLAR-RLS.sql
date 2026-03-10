-- ⚡ SOLUÇÃO RÁPIDA: Copy & Paste no SQL Editor do Supabase
-- Copie TODO este bloco, cole no SQL Editor e clique em RUN

DROP POLICY IF EXISTS "Allow public read centro-logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert centro-logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete centro-logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update centro-logos" ON storage.objects;

CREATE POLICY "Allow public read centro-logos" ON storage.objects FOR SELECT USING (bucket_id = 'centro-logos');
CREATE POLICY "Allow authenticated insert centro-logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'centro-logos' AND auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete centro-logos" ON storage.objects FOR DELETE USING (bucket_id = 'centro-logos' AND auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update centro-logos" ON storage.objects FOR UPDATE USING (bucket_id = 'centro-logos' AND auth.role() = 'authenticated') WITH CHECK (bucket_id = 'centro-logos' AND auth.role() = 'authenticated');
