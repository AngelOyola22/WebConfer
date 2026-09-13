-- ============================================
-- WebConfer - Agregar campos dinámicos a Eventos
-- Ejecutar en: Supabase SQL Editor
-- ============================================

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS speakers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS agenda JSONB DEFAULT '[]'::jsonb;

-- Forzar la recarga del esquema para la API
NOTIFY pgrst, 'reload schema';
