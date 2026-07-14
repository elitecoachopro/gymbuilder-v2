import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'ID lipsă.' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();

    // Fetch product
    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, description, category, condition, price_eur, images, specs, status, supplier_id, brand_id, created_at')
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (error || !product) {
      return NextResponse.json({ error: 'Produs negăsit.' }, { status: 404 });
    }

    // Fetch supplier info separately
    let supplierInfo = null;
    if (product.supplier_id) {
      const { data: supplier } = await supabase
        .from('supplier_profiles')
        .select('id, company_name, country, city, logo_url, website')
        .eq('id', product.supplier_id)
        .single();
      supplierInfo = supplier;
    }

    // Fetch brand name if brand_id exists
    let brandName = null;
    if (product.brand_id) {
      const { data: brand } = await supabase
        .from('brands')
        .select('name')
        .eq('id', product.brand_id)
        .single();
      brandName = brand?.name || null;
    }

    // Fetch similar products (same category, different product, max 4)
    const { data: similarRaw } = await supabase
      .from('products')
      .select('id, name, price_eur, images, condition, category, supplier_id')
      .eq('category', product.category)
      .eq('status', 'active')
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

    return NextResponse.json({
      product: { ...product, supplier: supplierInfo, brand_name: brandName },
      similar,
    });
  } catch (err) {
    console.error('Product detail error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
