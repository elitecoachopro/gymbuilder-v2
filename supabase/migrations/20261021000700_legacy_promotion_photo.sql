-- Historical hosted databases may predate the optional promotion photo override.
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS image_url text;

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
