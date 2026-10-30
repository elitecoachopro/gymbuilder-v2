import { test } from "node:test";
import assert from "node:assert/strict";
import { purchaseMessage } from "../../mobile/src/store-policy.ts";
test("native purchase bridge rejects malformed or oversized purchase requests", () => {
  assert.equal(
    purchaseMessage({
      type: "purchase",
      intentId: "eac54f4d-b2cc-438a-80f8-58f106401e17",
      sku: "fixture.offer",
    }),
    true,
  );
  for (const input of [
    null,
    {},
    { type: "purchase", intentId: "javascript:alert(1)", sku: "fixture.offer" },
    {
      type: "purchase",
      intentId: "eac54f4d-b2cc-438a-80f8-58f106401e17",
      sku: "x".repeat(201),
    },
  ])
    assert.equal(purchaseMessage(input), false);
});
