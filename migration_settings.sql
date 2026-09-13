-- ============================================
-- WebConfer - Global Settings Module
-- Ejecutar en: Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.global_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_email TEXT NOT NULL DEFAULT 'eventos@tudominio.com',
  sender_name TEXT NOT NULL DEFAULT 'Eventos WebConfer',
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view and edit global_settings"
  ON public.global_settings FOR ALL
  USING (auth.role() = 'authenticated');

-- Insert initial row if empty
INSERT INTO public.global_settings (sender_email, sender_name)
SELECT 'eventos@tudominio.com', 'Eventos WebConfer'
WHERE NOT EXISTS (SELECT 1 FROM public.global_settings);
