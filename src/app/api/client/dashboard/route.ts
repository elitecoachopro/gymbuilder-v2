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

async function getClientUser(request: NextRequest): Promise<{ id: string; email: string; full_name: string; role: string } | null> {
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

    const supabase = getSupabase();
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', data.userId)
      .single();

    return user;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const user = await getClientUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Neautentificat.' }, { status: 401 });
  }

  const supabase = getSupabase();

  try {
    // 1. Contact requests (cereri de ofertă) sent by this client
    const { data: contactRequests } = await supabase
      .from('contact_requests')
      .select(`
        id, message, status, created_at, updated_at,
        supplier_profiles(id, company_name, logo_url, country),
        products(id, name, images, price_eur)
      `)
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // 2. Favorites
    const { data: favorites } = await supabase
      .from('favorites')
      .select(`
        id, created_at,
        products(id, name, category, price_eur, images, condition, status,
          supplier_profiles(id, company_name))
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // 3. Reviews written by this client (by email)
    const { data: reviews } = await supabase
      .from('reviews')
      .select(`
        id, rating, title, body, verified, created_at,
        supplier_profiles(id, company_name)
      `)
      .eq('client_email', user.email)
      .order('created_at', { ascending: false })
      .limit(20);

    // 4. Recently contacted suppliers (unique, from contact_requests)
    const recentSuppliers: any[] = [];
    if (contactRequests && contactRequests.length > 0) {
      const seen = new Set<string>();
      for (const cr of contactRequests) {
        const suppId = (cr.supplier_profiles as any)?.id;
        if (suppId && !seen.has(suppId)) {
          seen.add(suppId);
          recentSuppliers.push({
            id: suppId,
            company_name: (cr.supplier_profiles as any)?.company_name,
            logo_url: (cr.supplier_profiles as any)?.logo_url,
            country: (cr.supplier_profiles as any)?.country,
            last_contact: cr.created_at,
          });
          if (recentSuppliers.length >= 5) break;
        }
      }
    }

    return NextResponse.json({
      user: { id: user.id, full_name: user.full_name, email: user.email },
      contactRequests: contactRequests || [],
      favorites: favorites || [],
      reviews: reviews || [],
      recentSuppliers,
    });
  } catch (err) {
    console.error('Client dashboard error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
