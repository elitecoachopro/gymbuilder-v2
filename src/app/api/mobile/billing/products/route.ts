import { NextResponse } from "next/server";
import { billingDatabase, billingUser } from "@/lib/mobile/billing-server";
export async function GET() {
  try {
    const user = await billingUser();
    if (!user)
      return NextResponse.json(
        { error: "SUPPLIER_AUTH_REQUIRED" },
        { status: 401 },
      );
    const db = billingDatabase();
    const { data: s } = await db
      .from("supplier_profiles")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "approved")
      .single();
    if (!s)
      return NextResponse.json(
        { error: "SUPPLIER_NOT_APPROVED" },
        { status: 403 },
      );
    const { data, error } = await db
      .from("products")
      .select("id,name")
      .eq("supplier_id", s.id)
      .in("status", ["active", "featured"])
      .order("name")
      .limit(500);
    if (error) throw error;
    return NextResponse.json(
      { products: data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "PRODUCTS_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
