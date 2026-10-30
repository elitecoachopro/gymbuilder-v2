import { jsonObject } from '@/lib/database-values';
import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/reviews?supplier_id=X — returns verified reviews for a supplier
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const supplierId = searchParams.get('supplier_id');

  if (!supplierId) {
    return await localizedJson({ error: 'supplier_id este obligatoriu.' }, { status: 400 });
  }

  const limit = searchParams.get('limit');

  try {
    const supabase = getSupabase();

    let query = supabase
      .from('reviews')
      .select('id, client_name, rating, title, body, created_at, verified')
      .eq('supplier_id', supplierId)
      .eq('verified', true)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(parseInt(limit, 10));
    }

    const { data: reviews, error } = await query;

    const { data: stats, error: statsError } = await supabase.rpc('supplier_review_stats', { p_supplier_id: supplierId });
    if (error || statsError) return await localizedJson({ error: 'Recenziile nu au putut fi incarcate.' }, { status: 500 });
    const count = Number(jsonObject(stats)?.count || 0);
    const avgRating = Number(jsonObject(stats)?.avgRating || 0);

    return await localizedJson({
      reviews: reviews || [],
      stats: { avgRating: Math.round(avgRating * 10) / 10, count },
    });
  } catch (err) {
    console.error('Reviews error:', err);
    return await localizedJson({ reviews: [], stats: { avgRating: 0, count: 0 } });
  }
}

// POST /api/reviews — create a new review (unverified by default)
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 2 requests per minute per IP
    const ip = getClientIP(request);
    const rateCheck = await checkRateLimit(`reviews:${ip}`, { maxRequests: 2, windowMs: 60 * 1000 });
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetTime!);
    }

    const body = await request.json();
    const { supplier_id, client_name, client_email, rating, title, body: reviewBody } = body;

    // Validation
    if (!supplier_id || !client_name || !client_email || !rating || !title) {
      return await localizedJson({ error: 'Câmpuri obligatorii lipsă.' }, { status: 400 });
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return await localizedJson({ error: 'Rating-ul trebuie să fie între 1 și 5.' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(client_email)) {
      return await localizedJson({ error: 'Email invalid.' }, { status: 400 });
    }

    // Sanitize inputs
    const sanitize = (str: string) => str.replace(/<[^>]*>/g, '').trim();

    const supabase = getSupabase();

    // Verify supplier exists
    const { data: supplier } = await supabase
      .from('supplier_profiles')
      .select('id')
      .eq('id', supplier_id)
      .eq('status', 'approved')
      .single();

    if (!supplier) {
      return await localizedJson({ error: 'Furnizor negăsit.' }, { status: 404 });
    }

    // Check for duplicate review (same email + supplier in last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('supplier_id', supplier_id)
      .eq('client_email', client_email.toLowerCase().trim())
      .gte('created_at', oneDayAgo);

    if (existing && existing.length > 0) {
      return await localizedJson({ error: 'Ai trimis deja o recenzie pentru acest furnizor recent.' }, { status: 429 });
    }

    // Insert review (unverified)
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        supplier_id,
        client_name: sanitize(client_name).slice(0, 100),
        client_email: client_email.toLowerCase().trim(),
        rating: Math.round(rating),
        title: sanitize(title).slice(0, 200),
        body: reviewBody ? sanitize(reviewBody).slice(0, 2000) : null,
        verified: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Review insert error:', error);
      return await localizedJson({ error: 'Eroare la salvarea recenziei.' }, { status: 500 });
    }

    // Create notification for admin users about new review to moderate
    const { data: adminUsers } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(5);

    if (adminUsers && adminUsers.length > 0) {
      const notifications = adminUsers.map((admin: { id: string }) => ({
        user_id: admin.id,
        type: 'review_new',
        title: `Recenzie nouă de moderat`,
        message: `${sanitize(client_name)} a lăsat o recenzie (${rating}★)`,
        link: '/admin#reviews',
        is_read: false,
      }));
      await supabase.from('notifications').insert(notifications);
    }

    return await localizedJson({
      success: true,
      message: 'Recenzia a fost trimisă și va fi publicată după verificare.',
      review,
    });
  } catch (err) {
    console.error('Review POST error:', err);
    return await localizedJson({ error: 'Eroare internă.' }, { status: 500 });
  }
}
