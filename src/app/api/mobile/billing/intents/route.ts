import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { billingConfigured, billingSkus } from "@/lib/mobile/billing-config";
import { promotionTypes } from "@/lib/mobile/billing-contract";
import { billingDatabase, billingUser } from "@/lib/mobile/billing-server";
const input = z.object({
  store: z.enum(["apple", "google"]),
  type: z.enum(promotionTypes),
  productId: z.string().uuid(),
  requestId: z.string().uuid(),
});
export async function POST(r: NextRequest) {
  try {
    const user = await billingUser();
    if (!user)
      return NextResponse.json(
        { error: "SUPPLIER_AUTH_REQUIRED" },
        { status: 401 },
      );
    const p = input.safeParse(await r.json());
    if (!p.success)
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    if (!billingConfigured(p.data.store))
      return NextResponse.json(
        { error: "BILLING_NOT_CONFIGURED" },
        { status: 503 },
      );
    const { data, error } = await billingDatabase().rpc(
      "reserve_mobile_promotion",
      {
        p_user: user.id,
        p_product: p.data.productId,
        p_type: p.data.type,
        p_store: p.data.store,
        p_sku: billingSkus(p.data.store)[p.data.type],
        p_request: p.data.requestId,
      },
    );
    if (error)
      return NextResponse.json(
        { error: "SLOT_UNAVAILABLE_OR_PRODUCT_INVALID" },
        { status: 409 },
      );
    return NextResponse.json(
      { intent: data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "BILLING_UNAVAILABLE" }, { status: 503 });
  }
}
