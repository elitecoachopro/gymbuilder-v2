import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('products')
      .select('id, name, category, brand_id, condition, price_eur, description, images, specs, status, supplier_id, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category && category !== 'Toate' && category !== 'all') {
      query = query.eq('category', category.toLowerCase());
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Products fetch error:', error);
      return NextResponse.json({
        products: [],
        count: 0,
        source: 'error',
        debug: error.message,
      });
    }

    // Enrich with supplier info via separate query
    let enrichedProducts = products || [];
    if (enrichedProducts.length > 0) {
      const supplierIds = Array.from(new Set(enrichedProducts.map(p => p.supplier_id).filter(Boolean)));
      if (supplierIds.length > 0) {
        const { data: suppliers } = await supabase
          .from('supplier_profiles')
          .select('id, company_name, country, city')
          .in('id', supplierIds);

        const supplierMap = new Map((suppliers || []).map(s => [s.id, s]));

        enrichedProducts = enrichedProducts.map(product => ({
          ...product,
          supplier: supplierMap.get(product.supplier_id) || null,
        }));
      }
    }

    // Also enrich with brand info
    const brandIds = Array.from(new Set(enrichedProducts.map(p => p.brand_id).filter(Boolean)));
    if (brandIds.length > 0) {
      const { data: brands } = await supabase
        .from('brands')
        .select('id, name')
        .in('id', brandIds);

      const brandMap = new Map((brands || []).map(b => [b.id, b]));

      enrichedProducts = enrichedProducts.map(product => ({
        ...product,
        brand: brandMap.get(product.brand_id) || null,
      }));
    }

    return NextResponse.json({
      products: enrichedProducts,
      count: enrichedProducts.length,
      source: 'supabase',
    });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({
      products: [],
      count: 0,
      source: 'error',
    });
  }
}
