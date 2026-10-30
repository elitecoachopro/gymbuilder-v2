import { createClient } from '@supabase/supabase-js';
import { readFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';

const databaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
assert.ok(['localhost', '127.0.0.1'].includes(databaseUrl.hostname), 'This import only supports local Supabase.');
const market = process.argv[2] ?? 'asia';
const manifestFiles = { asia: 'asian-suppliers.json', romania: 'romanian-suppliers.json', 'rest-of-world': 'international-suppliers.json', 'second-hand': 'second-hand-suppliers.json' };
assert.ok(Object.hasOwn(manifestFiles, market), 'Choose asia, romania, rest-of-world or second-hand.');
const manifest = JSON.parse(await readFile(new URL(`../data/${manifestFiles[market]}`, import.meta.url), 'utf8'));
const db = createClient(databaseUrl.href, process.env.SUPABASE_SERVICE_ROLE_KEY);

for (const supplier of manifest.suppliers) {
  assert.ok(supplier.listing_source_url.startsWith('https://'));
  for (const product of supplier.products) {
    assert.ok(['new', 'used'].includes(product.condition ?? 'new'));
    if (product.listed_price_amount != null) {
      assert.ok(Number.isFinite(product.listed_price_amount) && product.listed_price_amount > 0);
      assert.match(product.listed_price_currency, /^[A-Z]{3}$/);
    }
    assert.ok(product.source_url.startsWith('https://') && product.images.length > 0, `Missing source or photos: ${product.name}`);
    for (const image of product.images) {
      assert.ok(image.startsWith(`/equipment/${market}/`) && !image.includes('..'));
      await access(new URL(`../public${image}`, import.meta.url));
    }
  }
}

let supplierCount = 0, productCount = 0;
for (const supplier of manifest.suppliers) {
  const existing = await db.from('supplier_profiles').select('id,user_id').eq('listing_source_url', supplier.listing_source_url).maybeSingle();
  if (existing.error) throw existing.error;
  assert.ok(!existing.data?.user_id, `Refusing to replace an account-owned supplier: ${supplier.company_name}`);
  const { data: profile, error } = await db.from('supplier_profiles').upsert({
    company_name: supplier.company_name, country: supplier.country, city: supplier.city,
    website: supplier.website, phone: supplier.phone, contact_email: supplier.contact_email,
    description: `${supplier.description}\n\nAdresă: ${supplier.address}`,
    catalog_url: supplier.catalog_url, listing_source_url: supplier.listing_source_url,
    listing_checked_at: manifest.checked_at, logo_url: supplier.logo_url,
    status: 'approved', verified: false,
  }, { onConflict: 'listing_source_url' }).select('id').single();
  if (error) throw error;
  const rows = [];
  for (const product of supplier.products) {
    const brandName = product.brand ?? supplier.brand;
    assert.ok(brandName, `Missing brand: ${product.name}`);
    const brandInsert = await db.from('brands').upsert({
      name: brandName,
      country: product.brand ? (product.brand_country ?? null) : supplier.country,
    }, { onConflict: 'name', ignoreDuplicates: true });
    if (brandInsert.error) throw brandInsert.error;
    const { data: brand, error: brandError } = await db.from('brands').select('id').eq('name', brandName).single();
    if (brandError) throw brandError;
    rows.push({
      supplier_id: profile.id, brand_id: brand.id, name: product.name,
      category: product.category, condition: product.condition ?? 'new', status: 'active',
      price_eur: product.listed_price_currency === 'EUR' ? product.listed_price_amount : null,
      listed_price_amount: product.listed_price_amount ?? null,
      listed_price_currency: product.listed_price_currency ?? null,
      description: product.description, images: product.images, specs: product.specs, source_url: product.source_url,
    });
  }
  const previous = await db.from('products').select('id,supplier_id,source_url').in('source_url', rows.map(row => row.source_url));
  if (previous.error) throw previous.error;
  const existingProducts = new Map(previous.data.map(product => [product.source_url, product]));
  for (const row of rows) {
    const existingProduct = existingProducts.get(row.source_url);
    assert.ok(!existingProduct || existingProduct.supplier_id === profile.id, 'Product source belongs to another supplier.');
    const result = existingProduct
      ? await db.from('products').update(row).eq('id', existingProduct.id)
      : await db.from('products').insert(row);
    if (result.error) throw result.error;
  }
  supplierCount++; productCount += rows.length;
  console.log(`${supplier.company_name}: ${rows.length} products saved`);
}
console.log(`Imported ${supplierCount} suppliers and ${productCount} products from verified public sources. No accounts created; no emails sent.`);
