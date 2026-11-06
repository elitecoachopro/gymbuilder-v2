ALTER TABLE public.supplier_profiles
  ADD COLUMN business_type text NOT NULL DEFAULT 'equipment',
  ADD COLUMN service_categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN service_areas text NOT NULL DEFAULT '',
  ADD COLUMN service_brands text NOT NULL DEFAULT '',
  ADD CONSTRAINT supplier_business_type_valid CHECK (business_type IN ('equipment', 'service', 'both')),
  ADD CONSTRAINT supplier_service_categories_valid CHECK (
    cardinality(service_categories) <= 6 AND
    service_categories <@ ARRAY['repairs','preventive','installation','relocation','upholstery','parts']::text[]
  ),
  ADD CONSTRAINT supplier_service_text_bounded CHECK (length(service_areas) <= 500 AND length(service_brands) <= 500),
  ADD CONSTRAINT supplier_services_complete CHECK (
    (business_type = 'equipment' AND cardinality(service_categories) = 0 AND service_areas = '' AND service_brands = '') OR
    (business_type IN ('service', 'both') AND cardinality(service_categories) > 0 AND length(btrim(service_areas)) >= 2)
  );

CREATE OR REPLACE VIEW public.public_supplier_directory WITH (security_invoker = true) AS
SELECT id, company_name, country, city, website, phone, description, logo_url,
       status, plan, verified, created_at, public.catalog_market(country) AS market,
       contact_email, catalog_url, listing_source_url, listing_checked_at,
       business_type, service_categories, service_areas, service_brands
FROM public.supplier_profiles WHERE status = 'approved';

REVOKE ALL ON public.public_supplier_directory FROM anon, authenticated;
GRANT SELECT ON public.public_supplier_directory TO service_role;
NOTIFY pgrst, 'reload schema';
