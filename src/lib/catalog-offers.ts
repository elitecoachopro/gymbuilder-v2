import type { CatalogOfferSelections, PromotionListing } from './promotions';

export interface CatalogOfferProduct {
  id: string | null;
  name: string | null;
  supplier_id: string | null;
  brand_id: string | null;
  brand_name: string | null;
  condition: string | null;
  price_eur: number | null;
  listed_price_amount?: number | null;
  listed_price_currency?: string | null;
  images: unknown;
  description: string | null;
}
export type CatalogOfferSupplier = NonNullable<PromotionListing['supplier']>;
export function catalogOfferSelections(products: CatalogOfferProduct[], suppliers: CatalogOfferSupplier[], now: number): CatalogOfferSelections {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const day = Math.floor(Date.parse(date) / 86400000);
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
  const queues = rotate([...groups.entries()].sort(([a],[b]) => a.localeCompare(b)),day).map(([,cards]) => rotate(cards,day));
  const ordered: PromotionListing[] = [];
  for (let round=0; queues.some(queue=>round<queue.length); round++) {
    for (const queue of queues) if (queue[round]) ordered.push(queue[round]);
  }
  const size = Math.min(12,Math.max(1,Math.floor(ordered.length/3)));
  const take = (offset: number) => ordered.length ? Array.from({length:Math.min(size,ordered.length)},(_,n)=>ordered[(offset+n)%ordered.length]) : [];
  return { superPret:take(0), ofertaZilei:take(size), oferteleSaptamanii:take(size*2) };
}
