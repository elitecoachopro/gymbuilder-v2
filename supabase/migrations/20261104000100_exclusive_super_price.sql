-- Historical elapsed placements can still be marked active/pending.
-- Retain their rows and prices while completing their already-ended display periods.
UPDATE public.promotions SET status='expired'
WHERE type='super_pret' AND status IN ('pending','active') AND ends_at<=now();

ALTER TABLE public.promotions ADD CONSTRAINT promotions_super_price_exclusive
  EXCLUDE USING gist (tstzrange(starts_at,ends_at,'[)') WITH &&)
  WHERE (type='super_pret' AND status IN ('pending','active'));
NOTIFY pgrst, 'reload schema';
