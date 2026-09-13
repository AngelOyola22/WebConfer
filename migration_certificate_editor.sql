-- ============================================
-- WebConfer - Advanced Certificate Editor
-- Ejecutar en: Supabase SQL Editor
-- ============================================

-- Agregar columna elements para guardar los componentes arrastrables (textos)
ALTER TABLE public.event_certificates 
ADD COLUMN IF NOT EXISTS elements JSONB DEFAULT '[]'::jsonb;

-- Notificar a postgREST que recargue el schema
NOTIFY pgrst, 'reload schema';
