CREATE OR REPLACE FUNCTION public.enforce_product_plan_limit() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE active_plan public.supplier_plan;
DECLARE product_limit INTEGER;
DECLARE current_count BIGINT;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.supplier_id = NEW.supplier_id THEN RETURN NEW; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('products:' || NEW.supplier_id::text, 0));
  IF NEW.source_url IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.supplier_profiles
    WHERE id = NEW.supplier_id AND user_id IS NULL AND listing_source_url IS NOT NULL
  ) THEN RETURN NEW; END IF;
  SELECT plan INTO active_plan FROM public.supplier_profiles WHERE id=NEW.supplier_id;
  product_limit := CASE active_plan WHEN 'starter' THEN 25 WHEN 'professional' THEN 100 WHEN 'enterprise' THEN 2147483647 ELSE 3 END;
  SELECT count(*) INTO current_count FROM public.products WHERE supplier_id=NEW.supplier_id;
  IF current_count >= product_limit THEN RAISE EXCEPTION 'Product limit reached for active plan' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END $$;

NOTIFY pgrst, 'reload schema';
