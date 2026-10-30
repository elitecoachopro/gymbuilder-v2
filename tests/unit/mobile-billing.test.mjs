import { test } from "node:test";
import assert from "node:assert/strict";
import { validateVerifiedPurchase } from "../../src/lib/mobile/billing-contract.ts";
const id = "eac54f4d-b2cc-438a-80f8-58f106401e17";
const intent = {
  id,
  user_id: "fixture-owner",
  sku: "fixture.offer",
  store: "apple",
  type: "oferta_zilei",
  expires_at: new Date(Date.now() + 100000).toISOString(),
};
const valid = {
  sku: intent.sku,
  store: "apple",
  binding: id,
  quantity: 1,
  purchasedAt: Date.now(),
  revoked: false,
  pending: false,
  sandbox: true,
  transactionKey: "fixture-verified-key",
};
test("verified sandbox purchase must match account-bound intent, SKU, store and quantity", () => {
  assert.equal(validateVerifiedPurchase(valid, intent), valid);
  for (const patch of [
    { binding: "another-account-intent" },
    { sku: "another-product" },
    { store: "google" },
    { quantity: 2 },
    { quantity: 0 },
  ])
    assert.throws(
      () => validateVerifiedPurchase({ ...valid, ...patch }, intent),
      /PURCHASE_MISMATCH/,
    );
});
test("pending, revoked, production and invalid date cannot grant benefits", () => {
  for (const [patch, error] of [
    [{ pending: true }, "PURCHASE_PENDING"],
    [{ revoked: true }, "PURCHASE_REVOKED"],
    [{ sandbox: false }, "PURCHASE_ENVIRONMENT_MISMATCH"],
    [{ purchasedAt: NaN }, "PURCHASE_DATE_INVALID"],
    [{ purchasedAt: Date.now() + 120000 }, "PURCHASE_DATE_INVALID"],
  ])
    assert.throws(
      () => validateVerifiedPurchase({ ...valid, ...patch }, intent),
      new RegExp(error),
    );
});

test("production transactions require explicit production expectation; sandbox cannot be used there", () => {
  assert.equal(
    validateVerifiedPurchase(
      { ...valid, sandbox: false },
      intent,
      Date.now(),
      false,
    ).sandbox,
    false,
  );
  assert.throws(
    () => validateVerifiedPurchase(valid, intent, Date.now(), false),
    /PURCHASE_ENVIRONMENT_MISMATCH/,
  );
});

test("billing configuration fails closed and separates sandbox from release approval", async () => {
  const { billingConfigured } =
    await import("../../src/lib/mobile/billing-config.ts");
  const settings = {
    MOBILE_BILLING_ENABLED: "true",
    MOBILE_BILLING_SANDBOX_USERS: "fixture-test-user",
    MOBILE_BILLING_ENVIRONMENT: "sandbox",
    MOBILE_BILLING_RELEASE_APPROVED: "false",
    GOOGLE_PLAY_PACKAGE_NAME: "fixture.package",
    GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: "{}",
    GOOGLE_PROMOTION_OFERTA_ZILEI_SKU: "daily",
    GOOGLE_PROMOTION_ANUNTURILE_ZILEI_SKU: "weekly",
    GOOGLE_PROMOTION_SUPER_PRET_SKU: "super",
  };
  const before = Object.fromEntries(
    Object.keys(settings).map((k) => [k, process.env[k]]),
  );
  try {
    Object.assign(process.env, settings);
    assert.equal(billingConfigured("google"), true);
    process.env.MOBILE_BILLING_ENABLED = "false";
    assert.equal(billingConfigured("google"), false);
    process.env.MOBILE_BILLING_ENABLED = "true";
    process.env.MOBILE_BILLING_ENVIRONMENT = "production";
    assert.equal(billingConfigured("google"), false);
    process.env.MOBILE_BILLING_RELEASE_APPROVED = "true";
    assert.equal(billingConfigured("google"), true);
    process.env.GOOGLE_PROMOTION_SUPER_PRET_SKU = "daily";
    assert.equal(billingConfigured("google"), false);
  } finally {
    for (const [k, v] of Object.entries(before)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});
