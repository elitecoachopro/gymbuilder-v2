ALTER TABLE public.contact_messages ADD COLUMN idempotency_key uuid UNIQUE;
