ALTER TABLE public.contact_requests ADD COLUMN idempotency_key uuid UNIQUE;
