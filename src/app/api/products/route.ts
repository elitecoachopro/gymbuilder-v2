import { isMarket } from '@/lib/markets';
import { productCreateInput } from '@/lib/validation';
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
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const condition = searchParams.get('condition');
    const priceMin = searchParams.get('price_min');
    const priceMax = searchParams.get('price_max');
    const supplier = searchParams.get('supplier');
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 24), 1), 100);
    const page = Math.max(Number(searchParams.get('page') || 1), 1);
    if (!Number.isInteger(limit) || !Number.isInteger(page) || page > 100000) return await localizedJson({ error: 'Paginare invalidă.' }, { status: 400 });
    const sort = searchParams.get('sort') || 'newest';

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('public_catalog_products')
      .select('id, name, category, brand_id, condition, price_eur, listed_price_amount, listed_price_currency, description, images, specs, status, supplier_id, created_at, brand_name, brand_country, supplier_country, market, source_url', { count: 'exact' })
      .in('status', ['active', 'featured'])
      .order(sort.startsWith('price_') ? 'price_eur' : 'created_at', { ascending: sort === 'price_asc', nullsFirst: false })
      .order('id', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (category && category !== 'Toate' && category !== 'all') {
      const parsedCategory = productCreateInput.shape.category.safeParse(category.toLowerCase());
      if (!parsedCategory.success) return await localizedJson({ error: 'Categorie invalidă.' }, { status: 400 });
      query = query.eq('category', parsedCategory.data);
    }

    if (condition && condition !== 'all') {
      const parsedCondition = productCreateInput.shape.condition.safeParse(condition);
      if (!parsedCondition.success) return await localizedJson({ error: 'Condiție invalidă.' }, { status: 400 });
      query = query.eq('condition', parsedCondition.data);
    }

    if (priceMin) {
      query = query.gte('price_eur', parseFloat(priceMin));
    }

    if (priceMax) {
      query = query.lte('price_eur', parseFloat(priceMax));
    }

    if (search) {
      const safeSearch = sanitizePostgrestSearch(search);
      query = query.or(`name.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%,brand_name.ilike.%${safeSearch}%`);
    }

    if (market) query = query.eq('market', market);

    if (supplier) {
      query = query.eq('supplier_id', supplier);
    }

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Products fetch error:', error);
      return await localizedJson({
        products: [],
        count: 0,
        source: 'error',
      }, { status: 500 });
    }

    // Enrich with supplier info via separate query
    let enrichedProducts = products || [];
    if (enrichedProducts.length > 0) {
      const supplierIds = Array.from(new Set(enrichedProducts.map(p => p.supplier_id).filter((id): id is string => typeof id === 'string')));
      if (supplierIds.length > 0) {
        const { data: suppliers } = await supabase
          .from('supplier_profiles')
          .select('id, company_name, country, city, verified, phone, website, contact_email, listing_source_url, catalog_url, listing_checked_at')
          .in('id', supplierIds);

        const supplierMap = new Map((suppliers || []).map(s => [s.id, s]));

        enrichedProducts = enrichedProducts.map(product => ({
          ...product,
          supplier: supplierMap.get(product.supplier_id || '') || null,
        }));
      }
    }

    // Also enrich with brand info
    const brandIds = Array.from(new Set(enrichedProducts.map(p => p.brand_id).filter((id): id is string => typeof id === 'string')));
    if (brandIds.length > 0) {
      const { data: brands } = await supabase
        .from('brands')
        .select('id, name, country')
        .in('id', brandIds);

      const brandMap = new Map((brands || []).map(b => [b.id, b]));

      enrichedProducts = enrichedProducts.map(product => ({
        ...product,
        brand: brandMap.get(product.brand_id || '') || null,
      }));
    }

    return await localizedJson({
      products: enrichedProducts,
      count: count || 0,
      page,
      pages: Math.ceil((count || 0) / limit),
      source: 'supabase',
    });
  } catch (error) {
    console.error('Products API error:', error);
    return await localizedJson({
      products: [],
      count: 0,
      source: 'error',
    }, { status: 500 });
  }
}
