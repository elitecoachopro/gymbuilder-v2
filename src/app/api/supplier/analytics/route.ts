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
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  const session = getUserFromSession();
  if (!session) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
  }

  const supabase = getSupabase();

  // Get supplier profile
  const { data: supplier } = await supabase
    .from('supplier_profiles')
    .select('id')
    .eq('user_id', session.userId)
    .single();

  if (!supplier) {
    return NextResponse.json({ error: 'Profil furnizor negăsit' }, { status: 404 });
  }

  // Get all products for this supplier
  const { data: products } = await supabase
    .from('products')
    .select('id, name, images, price_eur, status')
    .eq('supplier_id', supplier.id)
    .order('created_at', { ascending: false });

  if (!products || products.length === 0) {
    return NextResponse.json({ analytics: [] });
  }

  const productIds = products.map(p => p.id);

  // Calculate date ranges
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  // Get views for current month
  const { data: currentViews } = await supabase
    .from('product_views')
    .select('product_id')
    .in('product_id', productIds)
    .gte('viewed_at', currentMonthStart);

  // Get views for previous month
  const { data: previousViews } = await supabase
    .from('product_views')
    .select('product_id')
    .in('product_id', productIds)
    .gte('viewed_at', previousMonthStart)
    .lte('viewed_at', previousMonthEnd);

  // Get total views (all time)
  const { data: totalViews } = await supabase
    .from('product_views')
    .select('product_id')
    .in('product_id', productIds);

  // Get contact requests for current month
  const { data: currentRequests } = await supabase
    .from('contact_requests')
    .select('product_id')
    .eq('supplier_id', supplier.id)
    .gte('created_at', currentMonthStart);

  // Get contact requests for previous month
  const { data: previousRequests } = await supabase
    .from('contact_requests')
    .select('product_id')
    .eq('supplier_id', supplier.id)
    .gte('created_at', previousMonthStart)
    .lte('created_at', previousMonthEnd);

  // Get total contact requests (all time)
  const { data: totalRequests } = await supabase
    .from('contact_requests')
    .select('product_id')
    .eq('supplier_id', supplier.id);

  // Build analytics per product
  const analytics = products.map(product => {
    const totalViewCount = (totalViews || []).filter(v => v.product_id === product.id).length;
    const currentMonthViewCount = (currentViews || []).filter(v => v.product_id === product.id).length;
    const previousMonthViewCount = (previousViews || []).filter(v => v.product_id === product.id).length;

    const totalRequestCount = (totalRequests || []).filter(r => r.product_id === product.id).length;
    const currentMonthRequestCount = (currentRequests || []).filter(r => r.product_id === product.id).length;
    const previousMonthRequestCount = (previousRequests || []).filter(r => r.product_id === product.id).length;

    // Calculate percentage change for views
    let viewsChange: number | null = null;
    if (previousMonthViewCount > 0) {
      viewsChange = Math.round(((currentMonthViewCount - previousMonthViewCount) / previousMonthViewCount) * 100);
    } else if (currentMonthViewCount > 0) {
      viewsChange = 100; // New activity this month
    }

    // Calculate percentage change for requests
    let requestsChange: number | null = null;
    if (previousMonthRequestCount > 0) {
      requestsChange = Math.round(((currentMonthRequestCount - previousMonthRequestCount) / previousMonthRequestCount) * 100);
    } else if (currentMonthRequestCount > 0) {
      requestsChange = 100;
    }

    return {
      product_id: product.id,
      product_name: product.name,
      product_image: product.images?.[0] || null,
      price_eur: product.price_eur,
      status: product.status,
      views_total: totalViewCount,
      views_current_month: currentMonthViewCount,
      views_previous_month: previousMonthViewCount,
      views_change_percent: viewsChange,
      requests_total: totalRequestCount,
      requests_current_month: currentMonthRequestCount,
      requests_previous_month: previousMonthRequestCount,
      requests_change_percent: requestsChange,
    };
  });

  return NextResponse.json({ analytics });
}
