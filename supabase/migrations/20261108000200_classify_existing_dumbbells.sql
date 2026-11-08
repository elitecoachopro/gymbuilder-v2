-- Run after the dumbbells enum addition has committed. Classify the existing
-- dumbbell set only; do not infer categories for racks or other accessories.
UPDATE public.products
SET category = 'dumbbells'
WHERE id = '3d59457b-59e6-4125-80e6-98e1ed1020bd'
  AND name = 'TheWay Fitness – set gantere 1–10 kg cu suport'
  AND category = 'strength';
