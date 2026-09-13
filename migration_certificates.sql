-- ============================================
-- WebConfer - Certificates Module
-- Ejecutar en: Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_certificates (
  event_id UUID PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  background_color TEXT DEFAULT '#ffffff',
  primary_color TEXT DEFAULT '#1e3a8a',
  secondary_color TEXT DEFAULT '#eab308',
  signature_1_name TEXT DEFAULT 'Mateo López',
  signature_1_title TEXT DEFAULT 'Director',
  signature_2_name TEXT DEFAULT 'Juliana Silva',
  signature_2_title TEXT DEFAULT 'Coordinadora',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE public.event_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access certificates"
  ON public.event_certificates FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view certificates"
  ON public.event_certificates FOR SELECT
  USING (true);
