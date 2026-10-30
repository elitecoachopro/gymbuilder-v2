BEGIN;
SET LOCAL lock_timeout = '10s';
ALTER TABLE public.promotions ALTER COLUMN price_eur DROP NOT NULL;
NOTIFY pgrst, 'reload schema';
COMMIT;
