import {
  promotionTypes,
  type MobileStore,
  type MobilePromotionType,
} from "./billing-contract.ts";
export function billingEnvironment() {
  return process.env.MOBILE_BILLING_ENVIRONMENT === "production"
    ? "production"
    : "sandbox";
}
export function billingSkus(store: MobileStore) {
  const prefix = store === "apple" ? "APPLE" : "GOOGLE";
  return Object.fromEntries(
    promotionTypes.map((type) => [
      type,
      process.env[`${prefix}_PROMOTION_${type.toUpperCase()}_SKU`] || "",
    ]),
  ) as Record<MobilePromotionType, string>;
}
export function billingConfigured(store: MobileStore) {
  if (
    process.env.MOBILE_BILLING_ENABLED !== "true" ||
    (billingEnvironment() === "sandbox" &&
      !(process.env.MOBILE_BILLING_SANDBOX_USERS || "").trim()) ||
    !["sandbox", "production"].includes(
      process.env.MOBILE_BILLING_ENVIRONMENT || "",
    ) ||
    (billingEnvironment() === "production" &&
      process.env.MOBILE_BILLING_RELEASE_APPROVED !== "true") ||
    Object.values(billingSkus(store)).some((s) => !s) ||
    new Set(Object.values(billingSkus(store))).size !== 3
  )
    return false;
  return store === "apple"
    ? Boolean(
        process.env.APPLE_BUNDLE_ID &&
        (billingEnvironment() === "sandbox" ||
          Number(process.env.APPLE_APP_ID) > 0) &&
        process.env.APPLE_IAP_PRIVATE_KEY &&
        process.env.APPLE_IAP_KEY_ID &&
        process.env.APPLE_IAP_ISSUER_ID &&
        process.env.APPLE_ROOT_CERTIFICATES_BASE64,
      )
    : Boolean(
        process.env.GOOGLE_PLAY_PACKAGE_NAME &&
        process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON,
      );
}
