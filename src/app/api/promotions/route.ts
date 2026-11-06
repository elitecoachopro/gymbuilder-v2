import { webBillingConfig } from '@/lib/web-billing/config';
import { catalogOfferSelections, type CatalogOfferProduct } from '@/lib/catalog-offers';
import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { createClient } from '@supabase/supabase-js';
import type { CatalogOfferSelections, PromotionListing, PromotionResponse } from '@/lib/promotions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    if(webBillingConfig().configured){
      const {error:expiryError}=await supabase.rpc('release_expired_web_promotions');
      if(expiryError)throw expiryError;
    }
    const now = new Date().toISOString();
    const weekly: PromotionListing[] = [];
    const superPrice: PromotionListing[] = [];
    let daily: PromotionListing | null = null;
    const batchSize = 500;
    let cursor: { startsAt: string; id: string } | null = null;
    while (true) {
      let query = supabase.from('public_promotions')
        .select('id, title, description, price_eur, type, supplier_id, product_id, image_url, starts_at, ends_at, supplier:supplier_profiles(id, company_name, country), product:products(id, name, images, condition)')
        .eq('status', 'active').lte('starts_at', now).gt('ends_at', now)
        .order('starts_at', { ascending: true }).order('id', { ascending: true }).limit(batchSize);
      if (cursor) query = query.or(`starts_at.gt.${cursor.startsAt},and(starts_at.eq.${cursor.startsAt},id.gt.${cursor.id})`);
      const { data, error } = await query;
      if (error) throw error;
      for (const row of data || []) {
        if (!row.id || !row.supplier_id || !row.title || !row.starts_at || !row.ends_at) continue;
        const listing: PromotionListing = {
          id: row.id, supplier_id: row.supplier_id, product_id: row.product_id, title: row.title,
          description: row.description, price_eur: row.price_eur, image_url: row.image_url,
          starts_at: row.starts_at, ends_at: row.ends_at, supplier: row.supplier,
          product: row.product ? { ...row.product, images: Array.isArray(row.product.images) ? row.product.images.filter((image): image is string => typeof image === 'string') : [] } : null,
        };
        if (row.type === 'oferta_zilei') daily ??= listing;
        else if (row.type === 'anunturile_zilei') weekly.push(listing);
        else if (row.type === 'super_pret') superPrice.push(listing);
      }
      if (!data || data.length < batchSize) break;
      const last = data[data.length - 1];
      if (!last.starts_at || !last.id) throw new Error('Invalid promotion cursor');
      cursor = { startsAt: last.starts_at, id: last.id };
    }
    const { count, error: reservationError } = await supabase.from('promotions')
      .select('id', { count: 'exact', head: true }).eq('type', 'oferta_zilei')
      .in('status', ['pending', 'active']).lte('starts_at', now).gt('ends_at', now);
    if (reservationError) throw reservationError;
    let selections: CatalogOfferSelections = {superPret:[],ofertaZilei:[],oferteleSaptamanii:[]};
    let catalogUnavailable = false;
    try {
      const catalog: CatalogOfferProduct[] = [];
      if (!daily || !weekly.length || !superPrice.length) {
        let afterId: string | null = null;
        while (true) {
          let query = supabase.from('public_catalog_products')
            .select('id,name,supplier_id,brand_id,brand_name,condition,price_eur,listed_price_amount,listed_price_currency,images,description')
            .in('status',['active','featured']).order('id',{ascending:true}).limit(batchSize);
          if (afterId) query = query.gt('id',afterId);
          const {data: products,error: catalogError} = await query;
          if (catalogError) throw catalogError;
          catalog.push(...(products || []));
          if (!products || products.length < batchSize) break;
          afterId = products[products.length-1].id;
          if (!afterId) throw new Error('Invalid catalog cursor');
        }
      }
      const supplierIds = [...new Set(catalog.map(product=>product.supplier_id).filter((id): id is string=>!!id))];
      const {data: suppliers,error: supplierError} = supplierIds.length
        ? await supabase.from('supplier_profiles').select('id,company_name,country').eq('status','approved').in('id',supplierIds)
        : {data:[],error:null};
      if (supplierError) throw supplierError;
      selections = catalogOfferSelections(catalog,suppliers || [],Date.parse(now));
    } catch (catalogError) {
      catalogUnavailable = true;
      console.error('Catalog selections unavailable:',catalogError);
    }
    const occupied = Math.min(1, count || 0);
    const response: PromotionResponse = {
      catalogSelections: selections, catalogUnavailable,
      ofertaZilei: daily, oferteleSaptamanii: weekly, superPret: superPrice,
      slots: { ofertaZilei: { total: 1, occupied, available: 1 - occupied }, oferteleSaptamanii: { occupied: weekly.length } },
    };
    return await localizedJson(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Promotions API error:', error);
    return await localizedJson({ error: 'Promovările nu au putut fi încărcate.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
