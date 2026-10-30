import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { billingDatabase, billingUser } from "@/lib/mobile/billing-server";
import {
  billingConfigured,
  billingEnvironment,
} from "@/lib/mobile/billing-config";
import {
  validateVerifiedPurchase,
  type BillingIntent,
} from "@/lib/mobile/billing-contract";
import { verifyStorePurchase } from "@/lib/mobile/billing-verifier";
export const maxDuration = 60;
const input = z.object({
  intentId: z.string().uuid(),
  proof: z.string().min(1).max(8192),
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
    if (!billingConfigured("apple") && !billingConfigured("google"))
      return NextResponse.json(
        { error: "BILLING_NOT_CONFIGURED" },
        { status: 503 },
      );
    const db = billingDatabase();
    const { data: intent, error } = await db
      .from("mobile_billing_intents")
      .select("id,user_id,store,sku,type,expires_at")
      .eq("id", p.data.intentId)
      .eq("user_id", user.id)
      .single();
    if (error || !intent)
      return NextResponse.json({ error: "INTENT_NOT_FOUND" }, { status: 404 });
    if (!billingConfigured(intent.store))
      return NextResponse.json(
        { error: "BILLING_NOT_CONFIGURED" },
        { status: 503 },
      );
    const verified = validateVerifiedPurchase(
      await verifyStorePurchase(intent.store, intent.sku, p.data.proof),
      intent as BillingIntent,
      Date.now(),
      billingEnvironment() === "sandbox",
    );
    const { data, error: grantError } = await db.rpc("grant_mobile_promotion", {
      p_user: user.id,
      p_intent: intent.id,
      p_transaction: verified.transactionKey,
      p_purchased_at: new Date(verified.purchasedAt).toISOString(),
    });
    if (grantError)
      return NextResponse.json(
        { error: "PAYMENT_REVIEW_REQUIRED", granted: false },
        { status: 409 },
      );
    return NextResponse.json(
      { granted: true, promotion: data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "PURCHASE_NOT_VERIFIED", granted: false },
      { status: 422 },
    );
  }
}
