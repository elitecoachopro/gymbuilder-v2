import { jsonObject } from '@/lib/database-values';
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

    // Fetch supplier profile (only approved ones are public)
    const { data: supplier, error: supplierError } = await supabase
      .from('supplier_profiles')
      .select('id, company_name, country, city, description, logo_url, website, phone, plan, verified, created_at, contact_email, listing_source_url, catalog_url, listing_checked_at')
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    if (supplierError || !supplier) {
      return await localizedJson({ error: 'Furnizor negăsit.' }, { status: 404 });
    }

    // Fetch active products for this supplier
    const { data: products } = await supabase
      .from('products')
      .select('id, name, description, category, condition, price_eur, listed_price_amount, listed_price_currency, images, status')
      .eq('supplier_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Calculate stats from reviews table
    const totalProducts = products?.length || 0;

    const { data: reviewStats, error: statsError } = await supabase.rpc('supplier_review_stats', { p_supplier_id: id });
    if (statsError) return await localizedJson({ error: 'Statisticile nu au putut fi incarcate.' }, { status: 500 });
    const avgRating = Number(jsonObject(reviewStats)?.avgRating || 0);
    const reviewCount = Number(jsonObject(reviewStats)?.count || 0);

    return await localizedJson({
      supplier,
      products: products || [],
      stats: { totalProducts, avgRating, reviewCount },
    });
  } catch (err) {
    console.error('Supplier profile error:', err);
    return await localizedJson({ error: 'Eroare internă.' }, { status: 500 });
  }
}
