-- The historical anunturile_zilei enum value stores the weekly placement.
-- Keep it stable for existing stored records; the interface calls it Ofertele săptămânii.
ALTER TABLE public.promotions
  ADD CONSTRAINT promotions_paid_duration CHECK (
    (type = 'oferta_zilei' AND ends_at - starts_at = interval '24 hours')
    OR (type = 'anunturile_zilei' AND ends_at - starts_at = interval '168 hours')
  ) NOT VALID;

ALTER TABLE public.promotions
  ADD CONSTRAINT promotions_daily_exclusive EXCLUDE USING gist (
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (type = 'oferta_zilei' AND status IN ('pending', 'active'));

CREATE OR REPLACE VIEW public.public_promotions WITH (security_invoker = true) AS
SELECT promotion.*
FROM public.promotions promotion
JOIN public.supplier_profiles supplier ON supplier.id = promotion.supplier_id AND supplier.status = 'approved'
LEFT JOIN public.products product ON product.id = promotion.product_id AND product.supplier_id = promotion.supplier_id
WHERE promotion.status = 'active'
  AND promotion.starts_at <= now() AND promotion.ends_at > now()
  AND (promotion.product_id IS NULL OR product.status IN ('active', 'featured'));
REVOKE ALL ON public.public_promotions FROM anon, authenticated;
GRANT SELECT ON public.public_promotions TO service_role;
NOTIFY pgrst, 'reload schema';
