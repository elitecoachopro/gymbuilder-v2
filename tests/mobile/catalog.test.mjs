import { test } from "node:test";
import assert from "node:assert/strict";
import { getCatalog, price, trustedUrl } from "../../mobile/src/api.ts";
test("native catalog resolves website photos and preserves public seller contacts", async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  globalThis.fetch = async () =>
    Response.json({
      pages: 1,
      products: [
        {
          id: "fixture",
          name: "Fixture equipment",
          condition: "new",
          images: ["/equipment/fixture.png", "javascript:alert(1)"],
          supplier: {
            id: "seller",
            company_name: "Fixture seller",
            contact_email: "fixture@example.test",
          },
        },
      ],
    });
  const data = await getCatalog("", 1);
  assert.deepEqual(data.products[0].images, [
    "https://www.gymbuilder.app/equipment/fixture.png",
  ]);
  assert.equal(data.products[0].supplier.contact_email, "fixture@example.test");
});
test("invalid prices and unrelated WebView origins do not crash or gain bridge access", () => {
  assert.equal(price({ price_eur: NaN }), "Preț la cerere");
  assert.equal(
    price({ price_eur: 10, listed_price_currency: "invalid currency" }),
    "Preț la cerere",
  );
  assert.equal(
    trustedUrl("https://www.gymbuilder.app/mobile/promotions"),
    true,
  );
  for (const url of [
    "https://www.gymbuilder.app.evil.test",
    "https://evil.test",
    "javascript:alert(1)",
    "http://www.gymbuilder.app",
  ])
    assert.equal(trustedUrl(url), false);
});
