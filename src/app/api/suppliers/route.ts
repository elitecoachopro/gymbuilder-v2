import { isMarket } from '@/lib/markets';
import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizePostgrestSearch } from '@/lib/sanitize';

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market');
    if (market && !isMarket(market)) return await localizedJson({ error: 'Piață invalidă.' }, { status: 400 });
    const country = searchParams.get('country');
    const search = searchParams.get('search');
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 24), 1), 100);
    const page = Math.max(Number(searchParams.get('page') || 1), 1);
    if (!Number.isInteger(limit) || !Number.isInteger(page) || page > 100000) return await localizedJson({ error: 'Paginare invalidă.' }, { status: 400 });

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('public_supplier_directory')
      .select(`
        id, company_name, country, city, website, phone, description, logo_url, status, plan, verified, created_at, contact_email, listing_source_url, catalog_url, listing_checked_at
      `, { count: 'exact' })
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .order('id').range((page - 1) * limit, page * limit - 1);

    if (market) query = query.eq('market', market);

    if (country && country !== 'Toate' && country !== 'all') {
      query = query.eq('country', country);
    }

    if (search) {
      const safeSearch = sanitizePostgrestSearch(search);
      query = query.or(`company_name.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%,city.ilike.%${safeSearch}%`);
    }

    const { data: suppliers, error, count } = await query;

    if (error) {
      console.error('Suppliers fetch error:', error);
      return await localizedJson({
        suppliers: [],
        count: 0,
        source: 'error',
      }, { status: 500 });
    }

    // Enrich with product count per supplier
    const enrichedSuppliers = [];
    if (suppliers && suppliers.length > 0) {
      const supplierIds = suppliers.map(s => s.id).filter((id): id is string => !!id);
      const { data: productCounts, error: countError } = await supabase.rpc('supplier_product_counts', { p_supplier_ids: supplierIds });
      if (countError) return await localizedJson({ error: 'Statisticile nu au putut fi incarcate.' }, { status: 500 });
      const countMap = new Map<string, number>();
      (productCounts || []).forEach(p => {
        countMap.set(p.supplier_id, Number(p.product_count));
      });

      for (const supplier of suppliers) {
        enrichedSuppliers.push({
          ...supplier,
          product_count: countMap.get(supplier.id || '') || 0,
        });
      }
    }

    return await localizedJson({
      suppliers: enrichedSuppliers,
      count: count || 0,
      page,
      pages: Math.ceil((count || 0) / limit),
      source: 'supabase',
    });
  } catch (error) {
    console.error('Suppliers API error:', error);
    return await localizedJson({
      suppliers: [],
      count: 0,
      source: 'error',
    }, { status: 500 });
  }
}
