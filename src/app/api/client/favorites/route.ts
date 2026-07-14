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

async function getUserId(): Promise<string | null> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  if (!sessionToken) return null;

  try {
    const [payload, signature] = sessionToken.split('.');
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.JWT_SECRET || '';
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    if (signature !== expected) return null;

    const data = JSON.parse(Buffer.from(payload, 'base64').toString());
    if (data.exp && data.exp < Date.now()) return null;
    return data.userId;
  } catch {
    return null;
  }
}

// POST /api/client/favorites — toggle favorite
export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Neautentificat.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { product_id } = body;

    if (!product_id) {
      return NextResponse.json({ error: 'product_id obligatoriu.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Check if already favorited
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', product_id)
      .single();

    if (existing) {
      // Remove favorite
      await supabase
        .from('favorites')
        .delete()
        .eq('id', existing.id);

      return NextResponse.json({ favorited: false, message: 'Produs eliminat din favorite.' });
    } else {
      // Add favorite
      await supabase
        .from('favorites')
        .insert({ user_id: userId, product_id });

      return NextResponse.json({ favorited: true, message: 'Produs adăugat la favorite.' });
    }
  } catch (err) {
    console.error('Favorites error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
