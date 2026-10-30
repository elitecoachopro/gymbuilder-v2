export interface PromotionListing {
  id: string;
  supplier_id: string;
  product_id: string | null;
  title: string;
  description: string | null;
  price_eur: number | null;
  image_url: string | null;
  starts_at: string;
  ends_at: string;
  supplier: { id: string; company_name: string; country: string } | null;
  product: { id: string; name: string; images: string[]; condition: string } | null;
}

export interface PromotionAvailability {
  ofertaZilei: { total: number; occupied: number; available: number };
  oferteleSaptamanii: { occupied: number };
}

export interface PromotionResponse {
  ofertaZilei: PromotionListing | null;
  oferteleSaptamanii: PromotionListing[];
  superPret: PromotionListing[];
  slots: PromotionAvailability;
}
export const SUPER_PRICE_FEE_EUR = 12;
export const SUPER_PRICE_HOURS = 12;

export function promotionCountdown(endsAt: string, now: number): string {
  const remaining = Math.max(0, Math.ceil((Date.parse(endsAt) - now) / 1000));
  return [Math.floor(remaining / 3600), Math.floor(remaining / 60) % 60, remaining % 60]
    .map(value => String(value).padStart(2, '0')).join(':');
}

