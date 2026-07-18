import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import * as crypto from 'crypto';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getUserFromSession(): { userId: string } | null {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (!sessionToken) return null;

  try {
    const [payloadB64, signature] = sessionToken.split('.');
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.JWT_SECRET || '';
    const decodedPayload = Buffer.from(payloadB64, 'base64').toString();
    const expected = crypto.createHmac('sha256', secret).update(decodedPayload).digest('hex');

    if (signature !== expected) return null;

    const data = JSON.parse(decodedPayload);
    if (data.exp && data.exp < Date.now()) return null;

    return { userId: data.userId };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const session = getUserFromSession();
  if (!session) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
  }

  try {
    const supabase = getSupabase();

    // Get supplier profile for logged-in user
    const { data: supplier, error: supplierError } = await supabase
      .from('supplier_profiles')
      .select('id, company_name, status, plan, plan_expires_at')
      .eq('user_id', session.userId)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json({ error: 'Profil furnizor negăsit.' }, { status: 404 });
    }

    // Get products count for this supplier
    const { count: productsCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('supplier_id', supplier.id);

    // Get active products count
    const { count: activeProductsCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('supplier_id', supplier.id)
      .eq('status', 'active');

    // Get contact requests count for this supplier
    const { count: contactRequestsCount } = await supabase
      .from('contact_requests')
      .select('id', { count: 'exact', head: true })
      .eq('supplier_id', supplier.id);

    // Get contact requests this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count: contactRequestsThisMonth } = await supabase
      .from('contact_requests')
      .select('id', { count: 'exact', head: true })
      .eq('supplier_id', supplier.id)
      .gte('created_at', startOfMonth.toISOString());

    // Get reviews for this supplier
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('supplier_id', supplier.id)
      .eq('status', 'verified');

    const reviewCount = reviews?.length || 0;
    const avgRating = reviewCount > 0
      ? (reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
      : '0';

    // Get recent products (last 10)
    const { data: recentProducts } = await supabase
      .from('products')
      .select('id, name, category, price_eur, status, images, created_at')
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent contact requests (last 5)
    const { data: recentRequests } = await supabase
      .from('contact_requests')
      .select('id, client_name, client_email, message, status, created_at, viewed_at')
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Mark 'sent' requests as 'viewed' when supplier opens dashboard
    const unviewedIds = (recentRequests || [])
      .filter((r: any) => r.status === 'sent')
      .map((r: any) => r.id);
    if (unviewedIds.length > 0) {
      await supabase
        .from('contact_requests')
        .update({ status: 'viewed', viewed_at: new Date().toISOString() })
        .in('id', unviewedIds);
    }

    return NextResponse.json({
      supplier: {
        id: supplier.id,
        companyName: supplier.company_name,
        status: supplier.status,
        plan: supplier.plan,
        planExpiresAt: supplier.plan_expires_at,
      },
      stats: {
        totalProducts: productsCount || 0,
        activeProducts: activeProductsCount || 0,
        totalContactRequests: contactRequestsCount || 0,
        contactRequestsThisMonth: contactRequestsThisMonth || 0,
        reviewCount,
        avgRating,
      },
      recentProducts: recentProducts || [],
      recentRequests: recentRequests || [],
    });
  } catch (err) {
    console.error('Supplier dashboard API error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
