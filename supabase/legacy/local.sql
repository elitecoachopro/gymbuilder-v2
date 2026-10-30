-- Completari pentru campurile folosite de catalog, absente din schema istorica.
-- Acest fisier este incarcat numai de configurarea Supabase locala.
ALTER TABLE public.supplier_profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS image_url TEXT;

-- API-urile aplicatiei acceseaza baza cu service_role, pastrand RLS activ.
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
