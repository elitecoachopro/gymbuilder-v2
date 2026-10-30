import { createHash } from "node:crypto";
import {
  AppStoreServerAPIClient,
  Environment,
  SignedDataVerifier,
} from "@apple/app-store-server-library";
import { GoogleAuth } from "google-auth-library";
import type { MobileStore, VerifiedPurchase } from "./billing-contract";
import { billingEnvironment } from "./billing-config";
export async function verifyStorePurchase(
  store: MobileStore,
  sku: string,
  proof: string,
): Promise<VerifiedPurchase> {
  if (store === "apple") {
    const environment =
      billingEnvironment() === "sandbox"
        ? Environment.SANDBOX
        : Environment.PRODUCTION;
    const bundle = process.env.APPLE_BUNDLE_ID!;
    const client = new AppStoreServerAPIClient(
      process.env.APPLE_IAP_PRIVATE_KEY!.replace(/\n/g, "\n"),
      process.env.APPLE_IAP_KEY_ID!,
      process.env.APPLE_IAP_ISSUER_ID!,
      bundle,
      environment,
    );
    const result = await client.getTransactionInfo(proof);
    if (!result.signedTransactionInfo) throw new Error("PURCHASE_UNVERIFIED");
    const roots = process.env
      .APPLE_ROOT_CERTIFICATES_BASE64!.split(",")
      .map((s) => Buffer.from(s.trim(), "base64"));
    const verifier = new SignedDataVerifier(
      roots,
      true,
      environment,
      bundle,
      environment === Environment.PRODUCTION
        ? Number(process.env.APPLE_APP_ID)
        : undefined,
    );
    const p = await verifier.verifyAndDecodeTransaction(
      result.signedTransactionInfo,
    );
    if (
      p.bundleId !== bundle ||
      p.transactionId !== proof ||
      p.type !== "Consumable"
    )
      throw new Error("PURCHASE_MISMATCH");
    return {
      store,
      sku: p.productId || "",
      binding: p.appAccountToken || "",
      quantity: p.quantity || 0,
      purchasedAt: p.purchaseDate || 0,
      revoked: Boolean(p.revocationDate),
      pending: false,
      sandbox: p.environment === Environment.SANDBOX,
      transactionKey: createHash("sha256")
        .update(`apple:${proof}`)
        .digest("hex"),
    };
  }
  const auth = new GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON!),
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });
  const client = await auth.getClient();
  const packageName = encodeURIComponent(process.env.GOOGLE_PLAY_PACKAGE_NAME!);
  const { data } = await client.request<{
    purchaseState?: number;
    purchaseType?: number;
    quantity?: number;
    purchaseTimeMillis?: string;
    obfuscatedExternalProfileId?: string;
  }>({
    url: `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${encodeURIComponent(sku)}/tokens/${encodeURIComponent(proof)}`,
    method: "GET",
    timeout: 15000,
  });
  return {
    store,
    sku,
    binding: data.obfuscatedExternalProfileId || "",
    quantity: data.quantity ?? 1,
    purchasedAt: Number(data.purchaseTimeMillis),
    revoked: data.purchaseState === 1,
    pending: data.purchaseState !== 0,
    sandbox: data.purchaseType === 0,
    transactionKey: createHash("sha256")
      .update(`google:${proof}`)
      .digest("hex"),
  };
}
