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

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  if (!sessionToken) return false;

  try {
    const [payload] = sessionToken.split('.');
    const data = JSON.parse(Buffer.from(payload, 'base64').toString());
    if (data.role !== 'admin') return false;

    const supabase = getSupabase();
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.userId)
      .single();

    return user?.role === 'admin';
  } catch {
    return false;
  }
}

// GET /api/admin/reviews — list unverified reviews
export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Acces interzis.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'unverified'; // unverified, verified, all

  try {
    const supabase = getSupabase();

    let query = supabase
      .from('reviews')
      .select(`
        id, client_name, client_email, rating, title, body, verified, created_at,
        supplier_profiles!inner(id, company_name)
      `)
      .order('created_at', { ascending: false });

    if (status === 'unverified') {
      query = query.eq('verified', false);
    } else if (status === 'verified') {
      query = query.eq('verified', true);
    }

    const { data: reviews, error } = await query;

    if (error) {
      console.error('Admin reviews error:', error);
      return NextResponse.json({ reviews: [], pendingCount: 0 });
    }

    // Get pending count
    const { count } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('verified', false);

    return NextResponse.json({
      reviews: reviews || [],
      pendingCount: count || 0,
    });
  } catch (err) {
    console.error('Admin reviews error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}

// PATCH /api/admin/reviews — approve or reject a review
export async function PATCH(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Acces interzis.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { reviewId, action } = body; // action: 'approve' | 'reject'

    if (!reviewId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Date invalide.' }, { status: 400 });
    }

    const supabase = getSupabase();

    if (action === 'approve') {
      const { error } = await supabase
        .from('reviews')
        .update({ verified: true })
        .eq('id', reviewId);

      if (error) {
        return NextResponse.json({ error: 'Eroare la aprobare.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Recenzie aprobată.' });
    } else {
      // Delete the review
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) {
        return NextResponse.json({ error: 'Eroare la ștergere.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Recenzie ștearsă.' });
    }
  } catch (err) {
    console.error('Admin review action error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
