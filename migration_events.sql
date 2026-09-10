-- ============================================
-- WebConfer - Migration to Events Structure
-- Ejecutar en: Supabase SQL Editor
-- ============================================

-- 1. Crear la tabla de Eventos
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  banner_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed', 'cancelled'))
);

-- 2. Modificar la tabla de Inscripciones para incluir el event_id
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id);

-- 3. Crear indice para event_id
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations(event_id);

-- 4. RLS para Eventos
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver los eventos publicados
CREATE POLICY "Public can view published events"
  ON public.events FOR SELECT
  USING (status = 'published');

-- Solo admins pueden ver todos y modificar
CREATE POLICY "Admins full access events"
  ON public.events FOR ALL
  USING (auth.role() = 'authenticated');
