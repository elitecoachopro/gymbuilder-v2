BEGIN;
SET LOCAL lock_timeout = '10s';
ALTER TABLE public.promotions DROP CONSTRAINT promotions_paid_duration;
ALTER TABLE public.promotions ADD CONSTRAINT promotions_paid_duration CHECK (
  (type = 'oferta_zilei' AND ends_at - starts_at = interval '24 hours')
  OR (type = 'anunturile_zilei' AND ends_at - starts_at = interval '168 hours')
  OR (type = 'super_pret' AND ends_at - starts_at = interval '12 hours')
) NOT VALID;
ALTER TABLE public.promotions ADD CONSTRAINT promotions_super_price_product CHECK (
  type <> 'super_pret' OR product_id IS NOT NULL
) NOT VALID;
NOTIFY pgrst, 'reload schema';
COMMIT;
