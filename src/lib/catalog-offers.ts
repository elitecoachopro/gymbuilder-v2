import type { CatalogOfferSelections, PromotionListing } from './promotions';

export interface CatalogOfferProduct {
  id: string | null;
  name: string | null;
  supplier_id: string | null;
  brand_id: string | null;
  brand_name: string | null;
  condition: string | null;
  category?: string | null;
  price_eur: number | null;
  listed_price_amount?: number | null;
  listed_price_currency?: string | null;
  images: unknown;
  description: string | null;
}
export type CatalogOfferSupplier = NonNullable<PromotionListing['supplier']>;
export function catalogOfferSelections(products: CatalogOfferProduct[], suppliers: CatalogOfferSupplier[], now: number): CatalogOfferSelections {
  const epoch = Date.parse('2026-01-01T00:00:00+02:00');
  const day = Math.floor((now-epoch)/86400000);
  const halfDay = Math.floor((now-epoch)/43200000);
  const supplierMap = new Map(suppliers.map(supplier => [supplier.id, supplier]));
  const groups = new Map<string, PromotionListing[]>();
  for (const product of [...products].sort((a,b) => (a.id || '').localeCompare(b.id || ''))) {
    if (!product.id || !product.name || !product.supplier_id || !supplierMap.has(product.supplier_id)) continue;
    const images = Array.isArray(product.images) ? product.images.filter((image): image is string => typeof image === 'string') : [];
    const key = product.brand_id || product.supplier_id;
    const cards = groups.get(key) || [];
    cards.push({
      id: `catalog-${product.id}`, supplier_id: product.supplier_id, product_id: product.id,
      selection: 'catalog', brand_name: product.brand_name, title: product.name, description: product.description,
      price_eur: product.price_eur, listed_price_amount: product.listed_price_amount, listed_price_currency: product.listed_price_currency,
      image_url: images[0] || null, starts_at: new Date(now).toISOString(), ends_at: new Date(now + 86400000).toISOString(),
      supplier: supplierMap.get(product.supplier_id)!, product: { id: product.id, name: product.name, images, condition: product.condition || 'new' },
    });
    groups.set(key,cards);
  }
  const rotate = <T,>(items: T[], offset: number): T[] => items.length ? [...items.slice(offset % items.length), ...items.slice(0,offset % items.length)] : [];
  const queues = [...groups.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([,cards])=>cards);
  const ordered: PromotionListing[] = [];
  for (let round=0; queues.some(queue=>round<queue.length); round++) {
    for (const queue of queues) if (queue[round]) ordered.push(queue[round]);
  }
  const dailyIndex = ordered.length ? day % ordered.length : 0;
  const daily = ordered[dailyIndex];
  const step = ordered.length>=3 && halfDay%2===0 ? 2 : 1;
  const superOffer = ordered.length ? ordered[(dailyIndex+step)%ordered.length] : undefined;
  const windowed = (offer: PromotionListing | undefined, hours: number) => {
    if (!offer) return [];
    const duration = hours*3600000;
    const start = epoch+Math.floor((now-epoch)/duration)*duration;
    return [{...offer,starts_at:new Date(start).toISOString(),ends_at:new Date(start+duration).toISOString()}];
  };
  const dumbbellIds = new Set(products.filter(product=>product.category==='dumbbells').map(product=>product.id));
  const dumbbells = ordered.filter(item=>dumbbellIds.has(item.product_id) && item.product_id!==daily?.product_id);
  const superPret = dumbbells.length ? dumbbells.flatMap(offer=>windowed(offer,12)) : windowed(superOffer,12);
  const superIds = new Set(superPret.map(offer=>offer.product_id));
  const weekly = ordered.filter(item=>item.product_id!==daily?.product_id && !superIds.has(item.product_id));
  return {superPret,ofertaZilei:windowed(daily,24),oferteleSaptamanii:rotate(weekly.length?weekly:ordered,day).slice(0,12)};
}
