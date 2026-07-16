import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/reviews?supplier_id=X — returns verified reviews for a supplier
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const supplierId = searchParams.get('supplier_id');

  if (!supplierId) {
    return NextResponse.json({ error: 'supplier_id este obligatoriu.' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('id, client_name, rating, title, body, created_at, verified')
      .eq('supplier_id', supplierId)
      .eq('verified', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Reviews fetch error:', error);
      return NextResponse.json({ reviews: [], stats: { avgRating: 0, count: 0 } });
    }

    // Calculate stats
    const count = reviews?.length || 0;
    const avgRating = count > 0
      ? reviews!.reduce((sum, r) => sum + r.rating, 0) / count
      : 0;

    return NextResponse.json({
      reviews: reviews || [],
      stats: { avgRating: Math.round(avgRating * 10) / 10, count },
    });
  } catch (err) {
    console.error('Reviews error:', err);
    return NextResponse.json({ reviews: [], stats: { avgRating: 0, count: 0 } });
  }
}

// POST /api/reviews — create a new review (unverified by default)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supplier_id, client_name, client_email, rating, title, body: reviewBody } = body;

    // Validation
    if (!supplier_id || !client_name || !client_email || !rating || !title) {
      return NextResponse.json({ error: 'Câmpuri obligatorii lipsă.' }, { status: 400 });
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating-ul trebuie să fie între 1 și 5.' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(client_email)) {
      return NextResponse.json({ error: 'Email invalid.' }, { status: 400 });
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
      return NextResponse.json({ error: 'Furnizor negăsit.' }, { status: 404 });
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
      return NextResponse.json({ error: 'Ai trimis deja o recenzie pentru acest furnizor recent.' }, { status: 429 });
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
      return NextResponse.json({ error: 'Eroare la salvarea recenziei.' }, { status: 500 });
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

    return NextResponse.json({
      success: true,
      message: 'Recenzia a fost trimisă și va fi publicată după verificare.',
      review,
    });
  } catch (err) {
    console.error('Review POST error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
