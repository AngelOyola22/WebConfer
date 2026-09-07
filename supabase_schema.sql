-- ============================================
-- WebConfer - Supabase Database Schema
-- Ejecutar en: Supabase SQL Editor
-- ============================================

-- 1. Tabla de Inscripciones
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age BETWEEN 16 AND 100),
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  payment_proof_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT
);

-- 2. Tabla de Contactos (Base de Difusión)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  source TEXT,
  tags TEXT[]
);

-- 3. Indices
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registrations(email);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);

-- 4. Row Level Security (RLS)
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 5. Policies para registrations
-- Cualquiera puede insertar (formulario público)
CREATE POLICY "Public can insert registrations"
  ON public.registrations FOR INSERT
  WITH CHECK (true);

-- Solo admins autenticados pueden leer y actualizar
CREATE POLICY "Admins can read registrations"
  ON public.registrations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can update registrations"
  ON public.registrations FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 6. Policies para contacts (solo admins)
CREATE POLICY "Admins full access contacts"
  ON public.contacts FOR ALL
  USING (auth.role() = 'authenticated');

-- 7. Storage Bucket para comprobantes
-- Ejecutar en: Storage > Buckets > New Bucket
-- Nombre: payment-proofs
-- Public bucket: TRUE (para ver las imágenes)

-- Alternativa via SQL (puede requerir extensión habilitada):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true) ON CONFLICT DO NOTHING;

-- 8. Storage Policy: Permitir uploads públicos
-- CREATE POLICY "Public upload payment proofs"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'payment-proofs');
