export const promotionTypes = [
  "oferta_zilei",
  "anunturile_zilei",
  "super_pret",
] as const;
export type MobilePromotionType = (typeof promotionTypes)[number];
export type MobileStore = "apple" | "google";
export const durations: Record<MobilePromotionType, number> = {
  oferta_zilei: 24,
  anunturile_zilei: 168,
  super_pret: 12,
};
export interface BillingIntent {
  id: string;
  user_id: string;
  store: MobileStore;
  sku: string;
  type: MobilePromotionType;
  expires_at: string;
}
export interface VerifiedPurchase {
  store: MobileStore;
  sku: string;
  binding: string;
  quantity: number;
  purchasedAt: number;
  revoked: boolean;
  pending: boolean;
  sandbox: boolean;
  transactionKey: string;
}
export function validateVerifiedPurchase(
  p: VerifiedPurchase,
  intent: BillingIntent,
  now = Date.now(),
  sandboxExpected = true,
) {
  if (p.pending) throw new Error("PURCHASE_PENDING");
  if (p.revoked) throw new Error("PURCHASE_REVOKED");
  if (p.sandbox !== sandboxExpected)
    throw new Error("PURCHASE_ENVIRONMENT_MISMATCH");
  if (
    p.store !== intent.store ||
    p.sku !== intent.sku ||
    p.binding.toLowerCase() !== intent.id.toLowerCase() ||
    p.quantity !== 1
  )
    throw new Error("PURCHASE_MISMATCH");
  if (!Number.isFinite(p.purchasedAt) || p.purchasedAt > now + 60000)
    throw new Error("PURCHASE_DATE_INVALID");
  // Fulfilment may be retried later. The DB, not the client clock, decides reservation validity.
  return p;
}
