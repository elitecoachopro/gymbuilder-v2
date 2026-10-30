import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { billingConfigured } from "@/lib/mobile/billing-config";
import { billingDatabase } from "@/lib/mobile/billing-server";
export async function POST(r: NextRequest) {
  if (
    !billingConfigured("google") ||
    !process.env.GOOGLE_PUBSUB_AUDIENCE ||
    !process.env.GOOGLE_PUBSUB_SERVICE_EMAIL
  )
    return NextResponse.json(
      { error: "BILLING_NOT_CONFIGURED" },
      { status: 503 },
    );
  try {
    const bearer = r.headers.get("authorization");
    if (!bearer?.startsWith("Bearer ")) throw new Error();
    const ticket = await new OAuth2Client().verifyIdToken({
      idToken: bearer.slice(7),
      audience: process.env.GOOGLE_PUBSUB_AUDIENCE,
    });
    const claims = ticket.getPayload();
    if (
      claims?.email !== process.env.GOOGLE_PUBSUB_SERVICE_EMAIL ||
      claims.email_verified !== true
    )
      throw new Error();
    const envelope = await r.json();
    if (
      typeof envelope.message?.data !== "string" ||
      envelope.message.data.length > 50000
    )
      throw new Error();
    const data = JSON.parse(
      Buffer.from(envelope.message.data, "base64").toString("utf8"),
    );
    if (data.testNotification) return NextResponse.json({ received: true });
    if (data.packageName !== process.env.GOOGLE_PLAY_PACKAGE_NAME)
      throw new Error();
    const cancel =
      data.oneTimeProductNotification?.notificationType === 2
        ? data.oneTimeProductNotification
        : data.voidedPurchaseNotification;
    if (!cancel) return NextResponse.json({ received: true, ignored: true });
    if (
      typeof cancel.purchaseToken !== "string" ||
      cancel.purchaseToken.length > 8192
    )
      throw new Error();
    const hash = createHash("sha256")
      .update(`google:${cancel.purchaseToken}`)
      .digest("hex");
    const { error } = await billingDatabase().rpc("revoke_mobile_promotion", {
      p_store: "google",
      p_transaction: hash,
    });
    if (error)
      return NextResponse.json(
        { error: "RETRY_NOTIFICATION" },
        { status: 503 },
      );
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "INVALID_NOTIFICATION" },
      { status: 401 },
    );
  }
}
