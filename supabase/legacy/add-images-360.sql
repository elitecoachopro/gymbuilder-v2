-- Add 360° image sequence support to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS images_360 JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN products.images_360 IS 'Array of image URLs for 360° product viewer (12-36 sequential images)';
