import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/session-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { billingEnvironment } from "./billing-config";
export function billingDatabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
export async function billingUser() {
  const user = await getSessionUser();
  if (!user || user.role !== "supplier") return null;
  if (
    billingEnvironment() === "sandbox" &&
    !(process.env.MOBILE_BILLING_SANDBOX_USERS || "")
      .split(",")
      .map((s) => s.trim())
      .includes(user.id)
  )
    return null;
  const limit = await checkRateLimit(`mobile-billing:${user.id}`, {
    maxRequests: 20,
    windowMs: 60000,
  });
  if (!limit.allowed) throw new Error("RATE_LIMITED");
  return user;
}
