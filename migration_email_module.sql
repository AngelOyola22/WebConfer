-- ============================================
-- WebConfer - Email Module Migration
-- Ejecutar en: Supabase SQL Editor
-- ============================================

-- 1. Tabla de Contactos de Eventos (Event Contacts)
-- Lista de correos importados o agregados manualmente a un evento
CREATE TABLE IF NOT EXISTS public.event_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  source TEXT DEFAULT 'manual', -- manual, import_excel, import_csv
  is_unsubscribed BOOLEAN DEFAULT false,
  UNIQUE(event_id, email)
);

-- 2. Tabla de Campañas de Correo (Email Campaigns)
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'sending', 'completed', 'failed')),
  recipients_count INTEGER DEFAULT 0,
  scheduled_for TIMESTAMPTZ
);

-- 3. Tabla de Logs de Correos (Email Logs)
-- Para rastrear el estado individual de cada correo enviado
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  event_contact_id UUID REFERENCES public.event_contacts(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'complained', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ
);

-- 4. Indices
CREATE INDEX IF NOT EXISTS idx_event_contacts_event_id ON public.event_contacts(event_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_event_id ON public.email_campaigns(event_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON public.email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);

-- 5. Row Level Security (RLS)
ALTER TABLE public.event_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Policies (Solo admins pueden gestionar esto)
CREATE POLICY "Admins full access event_contacts"
  ON public.event_contacts FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access email_campaigns"
  ON public.email_campaigns FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access email_logs"
  ON public.email_logs FOR ALL
  USING (auth.role() = 'authenticated');
