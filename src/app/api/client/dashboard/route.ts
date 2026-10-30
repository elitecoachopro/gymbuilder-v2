import type { SupplierProfile } from '@/types/database';
import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { getSessionUser } from '@/lib/session-server';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getClientUser(_request?: unknown) { return getSessionUser(); }

export async function GET(request: NextRequest) {
  const user = await getClientUser(request);
  if (!user) {
    return await localizedJson({ error: 'Neautentificat.' }, { status: 401 });
  }

  const supabase = getSupabase();

  try {
    const page = Math.max(1, Math.min(10000, Number.parseInt(request.nextUrl.searchParams.get('page') || '1', 10) || 1));
    const from = (page - 1) * 20;
    // 1. Contact requests (cereri de ofertă) sent by this client
    const requestsForClient = () => supabase
      .from('contact_requests')
      .select(`
        id, message, status, created_at, updated_at,
        supplier_profiles(id, company_name, logo_url, country),
        products(id, name, images, price_eur)
      `, { count: 'exact' })
      .eq('client_id', user.id);
    let { data: contactRequests, error: contactRequestsError, count: contactRequestsCount } = await requestsForClient()
      .order('created_at', { ascending: false }).order('id', { ascending: false })
      .range(from, from + 19);

    // 2. Favorites
    let { data: favorites, error: favoritesError, count: favoritesCount } = await supabase
      .from('favorites')
      .select(`
        id, created_at,
        products(id, name, category, price_eur, images, condition, status,
          supplier_profiles(id, company_name))
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }).order('id', { ascending: false })
      .range(from, from + 19);

    // 3. Reviews written by this client (by email)
    let { data: reviews, error: reviewsError, count: reviewsCount } = await supabase
      .from('reviews')
      .select(`
        id, rating, title, body, verified, created_at,
        supplier_profiles(id, company_name)
      `, { count: 'exact' })
      .eq('client_email', user.email)
      .order('created_at', { ascending: false }).order('id', { ascending: false })
      .range(from, from + 19);

    if (contactRequestsError?.code === 'PGRST103') {
      const result = await supabase.from('contact_requests').select('id', { count: 'exact', head: true }).eq('client_id', user.id);
      if (result.error) throw new Error('Dashboard count failed');
      contactRequests = []; contactRequestsCount = result.count; contactRequestsError = null;
    }
    if (favoritesError?.code === 'PGRST103') {
      const result = await supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
      if (result.error) throw new Error('Dashboard count failed');
      favorites = []; favoritesCount = result.count; favoritesError = null;
    }
    if (reviewsError?.code === 'PGRST103') {
      const result = await supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('client_email', user.email);
      if (result.error) throw new Error('Dashboard count failed');
      reviews = []; reviewsCount = result.count; reviewsError = null;
    }
    if (contactRequestsError || favoritesError || reviewsError) throw new Error('Dashboard queries failed');
    const wantedChat = request.nextUrl.searchParams.get('chat');
    if (wantedChat && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(wantedChat) && !contactRequests?.some(r => r.id === wantedChat)) {
      const focused = await requestsForClient().eq('id', wantedChat).maybeSingle();
      if (focused.error) throw new Error('Conversation query failed');
      if (focused.data) contactRequests = [focused.data, ...(contactRequests || [])];
    }
    // 4. Recently contacted suppliers (unique, from contact_requests)
    const recentSuppliers: Array<Pick<SupplierProfile, 'id' | 'company_name' | 'logo_url' | 'country'> & { last_contact: string | null }> = [];
    if (contactRequests && contactRequests.length > 0) {
      const seen = new Set<string>();
      for (const cr of contactRequests) {
        const supplier = cr.supplier_profiles;
        const suppId = supplier?.id;
        if (supplier && suppId && !seen.has(suppId)) {
          seen.add(suppId);
          recentSuppliers.push({
            id: suppId,
            company_name: supplier.company_name,
            logo_url: supplier.logo_url,
            country: supplier.country,
            last_contact: cr.created_at,
          });
          if (recentSuppliers.length >= 5) break;
        }
      }
    }

    return await localizedJson({
      pagination: { page, pageSize: 20, hasNext: Math.max(contactRequestsCount || 0, favoritesCount || 0, reviewsCount || 0) > from + 20 },
      totals: { contactRequests: contactRequestsCount || 0, favorites: favoritesCount || 0, reviews: reviewsCount || 0 },
      user: { id: user.id, full_name: user.full_name, email: user.email },
      contactRequests: contactRequests || [],
      favorites: favorites || [],
      reviews: reviews || [],
      recentSuppliers,
    });
  } catch (err) {
    console.error('Client dashboard error:', err);
    return await localizedJson({ error: 'Eroare internă.' }, { status: 500 });
  }
}
