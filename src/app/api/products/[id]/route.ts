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

    // Fetch product with supplier info
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id, name, description, category, condition, price_eur, images, specs, status, created_at,
        brand_id,
        supplier_profiles!inner(id, company_name, country, city, logo_url, website)
      `)
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (error || !product) {
      return NextResponse.json({ error: 'Produs negăsit.' }, { status: 404 });
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
    const { data: similar } = await supabase
      .from('products')
      .select(`
        id, name, price_eur, images, condition, category,
        supplier_profiles!inner(company_name)
      `)
      .eq('category', product.category)
      .eq('status', 'active')
      .neq('id', id)
      .limit(4);

    return NextResponse.json({
      product: { ...product, brand_name: brandName },
      similar: similar || [],
    });
  } catch (err) {
    console.error('Product detail error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
