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

    // Fetch supplier profile (only approved ones are public)
    const { data: supplier, error: supplierError } = await supabase
      .from('supplier_profiles')
      .select('id, company_name, country, city, description, logo_url, website, phone, plan, created_at')
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json({ error: 'Furnizor negăsit.' }, { status: 404 });
    }

    // Fetch active products for this supplier
    const { data: products } = await supabase
      .from('products')
      .select('id, name, description, category, condition, price_eur, images, status')
      .eq('supplier_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Calculate stats from reviews table
    const totalProducts = products?.length || 0;

    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('supplier_id', id)
      .eq('verified', true);

    let avgRating = 0;
    let reviewCount = 0;
    if (reviews && reviews.length > 0) {
      reviewCount = reviews.length;
      avgRating = Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10;
    }

    return NextResponse.json({
      supplier,
      products: products || [],
      stats: { totalProducts, avgRating, reviewCount },
    });
  } catch (err) {
    console.error('Supplier profile error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
