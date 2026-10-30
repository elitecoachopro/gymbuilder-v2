import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';

const files = ['asian-suppliers.json', 'romanian-suppliers.json', 'international-suppliers.json', 'second-hand-suppliers.json'];
const suppliers = [];
for (const file of files) {
  const manifest = JSON.parse(await readFile(new URL(`../../data/${file}`, import.meta.url), 'utf8'));
  for (const supplier of manifest.suppliers) {
    assert.ok(supplier.listing_source_url.startsWith('https://'));
    for (const product of supplier.products) {
      assert.ok(product.source_url.startsWith('https://'));
      for (const image of product.images) {
        assert.ok(image.startsWith('/equipment/') && !image.includes('..'));
        await access(new URL(`../../public${image}`, import.meta.url));
      }
    }
    suppliers.push({ ...supplier, checked_at: manifest.checked_at });
  }
}
const publicData = JSON.stringify(suppliers);
const delimiter = '$gymbuilder_public_catalog$';
assert.ok(!publicData.includes(delimiter));
const destination = process.argv[2];
assert.ok(destination, 'Pass an output SQL path.');
const sql = `BEGIN;
SET LOCAL lock_timeout = '10s';
DO $import$
DECLARE s jsonb;
DECLARE p jsonb;
DECLARE imported_supplier_id uuid;
DECLARE imported_brand_id uuid;
DECLARE imported_brand_name text;
BEGIN
  FOR s IN SELECT value FROM jsonb_array_elements(${delimiter}${publicData}${delimiter}::jsonb) LOOP
    IF EXISTS (SELECT 1 FROM public.supplier_profiles WHERE listing_source_url=s->>'listing_source_url' AND user_id IS NOT NULL) THEN
      RAISE EXCEPTION 'Source belongs to an account-owned supplier';
    END IF;
    INSERT INTO public.supplier_profiles(company_name, country, city, website, phone, contact_email, description, catalog_url, listing_source_url, listing_checked_at, logo_url, status, verified)
    VALUES (s->>'company_name', s->>'country', s->>'city', s->>'website', s->>'phone', s->>'contact_email', (s->>'description') || E'\\n\\nAdresă: ' || (s->>'address'), s->>'catalog_url', s->>'listing_source_url', (s->>'checked_at')::timestamptz, s->>'logo_url', 'approved', false)
    ON CONFLICT (listing_source_url) DO UPDATE SET company_name=EXCLUDED.company_name, country=EXCLUDED.country, city=EXCLUDED.city, website=EXCLUDED.website, phone=EXCLUDED.phone, contact_email=EXCLUDED.contact_email, description=EXCLUDED.description, catalog_url=EXCLUDED.catalog_url, listing_checked_at=EXCLUDED.listing_checked_at, logo_url=EXCLUDED.logo_url, status=EXCLUDED.status, verified=false
    RETURNING id INTO imported_supplier_id;
    FOR p IN SELECT value FROM jsonb_array_elements(s->'products') LOOP
      imported_brand_name := coalesce(p->>'brand', s->>'brand');
      INSERT INTO public.brands(name,country) VALUES(imported_brand_name, CASE WHEN p ? 'brand' THEN p->>'brand_country' ELSE s->>'country' END) ON CONFLICT(name) DO NOTHING;
      SELECT id INTO STRICT imported_brand_id FROM public.brands WHERE name=imported_brand_name;
      IF EXISTS(SELECT 1 FROM public.products WHERE source_url=p->>'source_url' AND products.supplier_id<>imported_supplier_id) THEN
        RAISE EXCEPTION 'Product source belongs to another supplier';
      END IF;
      INSERT INTO public.products(supplier_id, brand_id, name, category, condition, status, price_eur, listed_price_amount, listed_price_currency, description, images, specs, source_url)
      VALUES(imported_supplier_id, imported_brand_id, p->>'name', (p->>'category')::public.product_category, coalesce(p->>'condition','new')::public.product_condition, 'active', CASE WHEN p->>'listed_price_currency'='EUR' THEN (p->>'listed_price_amount')::numeric ELSE NULL END, (p->>'listed_price_amount')::numeric, p->>'listed_price_currency', p->>'description', p->'images', p->'specs', p->>'source_url')
      ON CONFLICT(source_url) DO UPDATE SET brand_id=EXCLUDED.brand_id, name=EXCLUDED.name, category=EXCLUDED.category, condition=EXCLUDED.condition, status=EXCLUDED.status, price_eur=EXCLUDED.price_eur, listed_price_amount=EXCLUDED.listed_price_amount, listed_price_currency=EXCLUDED.listed_price_currency, description=EXCLUDED.description, images=EXCLUDED.images, specs=EXCLUDED.specs;
    END LOOP;
  END LOOP;
END $import$;
COMMIT;
`;
await writeFile(destination, sql);
console.log(`Prepared only public manifest data: ${suppliers.length} suppliers, ${suppliers.reduce((total, s) => total + s.products.length, 0)} products. No accounts or private database rows included.`);
