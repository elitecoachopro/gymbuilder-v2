import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return await localizedJson({ error: 'ID lipsă.' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();

    // Fetch product
    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, description, category, condition, price_eur, listed_price_amount, listed_price_currency, images, images_360, specs, status, supplier_id, brand_id, created_at, source_url')
      .eq('id', id)
      .in('status', ['active', 'featured'])
      .single();

    if (error || !product) {
      return await localizedJson({ error: 'Produs negăsit.' }, { status: 404 });
    }

    // Fetch supplier info separately
    let supplierInfo = null;
    if (product.supplier_id) {
      const { data: supplier } = await supabase
        .from('supplier_profiles')
        .select('id, company_name, country, city, logo_url, website, phone, contact_email, listing_source_url, catalog_url, listing_checked_at')
        .eq('id', product.supplier_id)
        .eq('status', 'approved')
        .single();
      supplierInfo = supplier;
    }

    if (!supplierInfo) return await localizedJson({ error: 'Produs negăsit.' }, { status: 404 });

    // Fetch brand name if brand_id exists
    let brandName = null;
    let brandCountry = null;
    if (product.brand_id) {
      const { data: brand } = await supabase
        .from('brands')
        .select('name, country')
        .eq('id', product.brand_id)
        .single();
      brandName = brand?.name || null;
      brandCountry = brand?.country || null;
    }

    // Fetch similar products (same category, different product, max 4)
    const { data: similarRaw } = await supabase
      .from('products')
      .select('id, name, price_eur, listed_price_amount, listed_price_currency, images, condition, category, supplier_id, supplier_profiles!inner(status)')
      .eq('category', product.category)
      .in('status', ['active', 'featured'])
      .eq('supplier_profiles.status', 'approved')
      .neq('id', id)
      .limit(4);

    // Enrich similar products with supplier names
    let similar = similarRaw || [];
    if (similar.length > 0) {
      const supplierIds = Array.from(new Set(similar.map(p => p.supplier_id).filter(Boolean)));
      if (supplierIds.length > 0) {
        const { data: suppliers } = await supabase
          .from('supplier_profiles')
          .select('id, company_name')
          .in('id', supplierIds);

        const supplierMap = new Map((suppliers || []).map(s => [s.id, s]));
        similar = similar.map(p => ({
          ...p,
          supplier: supplierMap.get(p.supplier_id) || null,
        }));
      }
    }

    return await localizedJson({
      product: { ...product, supplier: supplierInfo, brand_name: brandName, brand_country: brandCountry },
      similar,
    });
  } catch (err) {
    console.error('Product detail error:', err);
    return await localizedJson({ error: 'Eroare internă.' }, { status: 500 });
  }
}
