-- ============================================
-- WebConfer - Agregar campo de URL de reunión (Google Meet) a Eventos
-- Ejecutar en: Supabase SQL Editor
-- ============================================

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS meeting_url TEXT;

-- Forzar la recarga del esquema para la API
NOTIFY pgrst, 'reload schema';
