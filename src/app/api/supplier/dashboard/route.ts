import { jsonObject } from '@/lib/database-values';
import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { getSessionUser } from '@/lib/session-server';
import { parsePublicContactEmail } from '@/lib/supplier-contact';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getUserFromSession(_request?: unknown) { return getSessionUser(); }

export async function GET(request: Request) {
  const session = await getUserFromSession();
  if (!session) {
    return await localizedJson({ error: 'Neautorizat' }, { status: 401 });
  }

  try {
    const supabase = getSupabase();

    // Get supplier profile for logged-in user
    const { data: supplier, error: supplierError } = await supabase
      .from('supplier_profiles')
      .select('id, company_name, status, plan, plan_expires_at, contact_email')
      .eq('user_id', session.userId)
      .single();

    if (supplierError || !supplier) {
      return await localizedJson({ error: 'Profil furnizor negăsit.' }, { status: 404 });
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

    const { data: reviewStats, error: reviewsError } = await supabase.rpc('supplier_review_stats', { p_supplier_id: supplier.id });
    if (reviewsError) return await localizedJson({ error: 'Recenziile nu au putut fi incarcate.' }, { status: 500 });
    const reviewCount = Number(jsonObject(reviewStats)?.count || 0);
    const avgRating = Number(jsonObject(reviewStats)?.avgRating || 0).toFixed(1);

    // Get recent products (last 10)
    const { data: recentProducts } = await supabase
      .from('products')
      .select('id, name, category, price_eur, status, images, created_at')
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent contact requests (last 5)
    const requestsForSupplier = () => supabase
      .from('contact_requests')
      .select('id, client_name, client_email, client_phone, message, product_id, status, created_at, viewed_at')
      .eq('supplier_id', supplier.id);
    const recentQuery = await requestsForSupplier()
      .order('created_at', { ascending: false })
      .limit(50);
    let recentRequests = recentQuery.data;

    if (recentQuery.error) return await localizedJson({ error: 'Eroare la încărcarea datelor.' }, { status: 500 });
    const wantedChat = new URL(request.url).searchParams.get('chat');
    if (wantedChat && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(wantedChat) && !recentRequests?.some(r => r.id === wantedChat)) {
      const focused = await requestsForSupplier().eq('id', wantedChat).maybeSingle();
      if (focused.error) return await localizedJson({ error: 'Eroare la încărcarea datelor.' }, { status: 500 });
      if (focused.data) recentRequests = [focused.data, ...(recentRequests || [])];
    }
    // Mark 'sent' requests as 'viewed' when supplier opens dashboard
    const unviewedIds = (recentRequests || [])
      .filter((r) => r.status === 'sent')
      .map((r) => r.id);
    if (unviewedIds.length > 0) {
      await supabase
        .from('contact_requests')
        .update({ status: 'viewed', viewed_at: new Date().toISOString() })
        .in('id', unviewedIds);
    }

    return await localizedJson({
      supplier: {
        id: supplier.id,
        companyName: supplier.company_name,
        contactEmail: supplier.contact_email,
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
    return await localizedJson({ error: 'Eroare internă.' }, { status: 500 });
  }
}


export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session) return await localizedJson({ error: 'Autentificare necesară.' }, { status: 401 });
  if (session.role !== 'supplier') return await localizedJson({ error: 'Acces interzis.' }, { status: 403 });
  const limit = await checkRateLimit(`supplier-public-contact:${session.id}`, { maxRequests: 20, windowMs: 60000 });
  if (!limit.allowed) return rateLimitResponse(limit.resetTime);
  const body = await request.json().catch(() => null);
  if (!body || !Object.hasOwn(body, 'contactEmail')) return await localizedJson({ error: 'Emailul public de contact nu este valid.' }, { status: 400 });
  const parsed = parsePublicContactEmail(body.contactEmail);
  if (!parsed.valid) return await localizedJson({ error: 'Emailul public de contact nu este valid.' }, { status: 400 });
  const { data, error } = await getSupabase().from('supplier_profiles')
    .update({ contact_email: parsed.email, updated_at: new Date().toISOString() })
    .eq('user_id', session.id).select('contact_email').maybeSingle();
  if (error) return await localizedJson({ error: 'Emailul public nu a putut fi salvat.' }, { status: 500 });
  if (!data) return await localizedJson({ error: 'Profil furnizor negăsit.' }, { status: 404 });
  return await localizedJson({ success: true, contactEmail: data.contact_email });
}
