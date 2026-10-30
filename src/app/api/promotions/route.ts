import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { createClient } from '@supabase/supabase-js';
import type { PromotionListing, PromotionResponse } from '@/lib/promotions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
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
    const occupied = Math.min(1, count || 0);
    const response: PromotionResponse = {
      ofertaZilei: daily, oferteleSaptamanii: weekly, superPret: superPrice,
      slots: { ofertaZilei: { total: 1, occupied, available: 1 - occupied }, oferteleSaptamanii: { occupied: weekly.length } },
    };
    return await localizedJson(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Promotions API error:', error);
    return await localizedJson({ error: 'Promovările nu au putut fi încărcate.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
