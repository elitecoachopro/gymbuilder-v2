-- Additive recovery of the schema expected by the existing application APIs.
ALTER TYPE public.contact_request_status ADD VALUE IF NOT EXISTS 'viewed';
ALTER TABLE public.contact_requests ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;
ALTER TABLE public.supplier_profiles ADD COLUMN IF NOT EXISTS verification_photos JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.contact_requests(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'supplier')),
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_request_time ON public.messages(request_id, created_at);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_time ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE NOT is_read;

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE CHECK (email = lower(trim(email))),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, session_id)
);
CREATE INDEX IF NOT EXISTS idx_product_views_time ON public.product_views(product_id, viewed_at);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (char_length(trim(label)) BETWEEN 1 AND 120),
  price_override NUMERIC(10,2) CHECK (price_override >= 0),
  description_override TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_variants_order ON public.product_variants(product_id, sort_order);

CREATE TABLE IF NOT EXISTS public.supplier_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.supplier_profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_supplier_gallery_time ON public.supplier_gallery(supplier_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.budget_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  area_sqm NUMERIC(10,2) NOT NULL CHECK (area_sqm > 0),
  gym_type TEXT NOT NULL,
  selected_zones JSONB NOT NULL CHECK (jsonb_typeof(selected_zones) = 'array'),
  total_min NUMERIC(14,2) NOT NULL CHECK (total_min >= 0),
  total_max NUMERIC(14,2) NOT NULL CHECK (total_max >= total_min),
  breakdown JSONB NOT NULL CHECK (jsonb_typeof(breakdown) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_budget_estimates_user_time ON public.budget_estimates(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('uploads', 'uploads', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('supplier-assets', 'supplier-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
