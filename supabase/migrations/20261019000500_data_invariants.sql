ALTER TABLE public.products ADD CONSTRAINT products_price_positive CHECK (price_eur > 0) NOT VALID;
ALTER TABLE public.products VALIDATE CONSTRAINT products_price_positive;
ALTER TABLE public.gym_projects ADD CONSTRAINT gym_projects_positive_dimensions CHECK (total_area > 0 AND length_m > 0 AND width_m > 0) NOT VALID;
ALTER TABLE public.gym_projects VALIDATE CONSTRAINT gym_projects_positive_dimensions;
ALTER TABLE public.gym_projects ADD CONSTRAINT gym_projects_zones_array CHECK (jsonb_typeof(zones) = 'array') NOT VALID;
ALTER TABLE public.gym_projects VALIDATE CONSTRAINT gym_projects_zones_array;
ALTER TABLE public.supplier_profiles ADD CONSTRAINT supplier_verification_photos_array CHECK (jsonb_typeof(verification_photos) = 'array') NOT VALID;
ALTER TABLE public.supplier_profiles VALIDATE CONSTRAINT supplier_verification_photos_array;
