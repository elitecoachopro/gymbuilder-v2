import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import {
  Environment,
  SignedDataVerifier,
} from "@apple/app-store-server-library";
import {
  billingConfigured,
  billingEnvironment,
} from "@/lib/mobile/billing-config";
import { billingDatabase } from "@/lib/mobile/billing-server";
export async function POST(r: NextRequest) {
  if (!billingConfigured("apple"))
    return NextResponse.json(
      { error: "BILLING_NOT_CONFIGURED" },
      { status: 503 },
    );
  try {
    const body = await r.json();
    if (
      typeof body.signedPayload !== "string" ||
      body.signedPayload.length > 50000
    )
      return NextResponse.json(
        { error: "INVALID_NOTIFICATION" },
        { status: 400 },
      );
    const verifier = new SignedDataVerifier(
      process.env
        .APPLE_ROOT_CERTIFICATES_BASE64!.split(",")
        .map((s) => Buffer.from(s.trim(), "base64")),
      true,
      billingEnvironment() === "sandbox"
        ? Environment.SANDBOX
        : Environment.PRODUCTION,
      process.env.APPLE_BUNDLE_ID!,
      billingEnvironment() === "production"
        ? Number(process.env.APPLE_APP_ID)
        : undefined,
    );
    const notification = await verifier.verifyAndDecodeNotification(
      body.signedPayload,
    );
    if (notification.notificationType === "TEST")
      return NextResponse.json({ received: true });
    if (!["REFUND", "REVOKE"].includes(notification.notificationType || ""))
      return NextResponse.json({ received: true, ignored: true });
    if (!notification.data?.signedTransactionInfo) throw new Error();
    const transaction = await verifier.verifyAndDecodeTransaction(
      notification.data.signedTransactionInfo,
    );
    if (!transaction.transactionId || !transaction.revocationDate)
      throw new Error();
    const hash = createHash("sha256")
      .update(`apple:${transaction.transactionId}`)
      .digest("hex");
    const { error } = await billingDatabase().rpc("revoke_mobile_promotion", {
      p_store: "apple",
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
