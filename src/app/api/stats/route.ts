import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabase();

    // Count active products
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Count approved suppliers
    const { count: suppliersCount } = await supabase
      .from('supplier_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    // Count distinct brands from products that have a brand_id
    const { data: brandData } = await supabase
      .from('products')
      .select('brand_id')
      .eq('status', 'active')
      .not('brand_id', 'is', null);

    const uniqueBrands = new Set((brandData || []).map(p => p.brand_id));

    return NextResponse.json({
      products: productsCount || 0,
      suppliers: suppliersCount || 0,
      brands: uniqueBrands.size,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ products: 0, suppliers: 0, brands: 0 });
  }
}
