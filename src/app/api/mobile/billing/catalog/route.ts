import { NextRequest, NextResponse } from "next/server";
import {
  billingConfigured,
  billingSkus,
  billingEnvironment,
} from "@/lib/mobile/billing-config";
import { durations, promotionTypes } from "@/lib/mobile/billing-contract";
export async function GET(r: NextRequest) {
  const store = r.nextUrl.searchParams.get("store");
  if (store !== "apple" && store !== "google")
    return NextResponse.json({ error: "INVALID_STORE" }, { status: 400 });
  const enabled = billingConfigured(store);
  return NextResponse.json(
    {
      enabled,
      mode: billingEnvironment(),
      offers: enabled
        ? promotionTypes.map((type) => ({
            type,
            sku: billingSkus(store)[type],
            hours: durations[type],
          }))
        : [],
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
