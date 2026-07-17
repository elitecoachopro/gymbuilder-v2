import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST - record a unique product view per session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, session_id } = body;

    if (!product_id || !session_id) {
      return NextResponse.json({ error: 'product_id și session_id obligatorii' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Use upsert with the unique constraint on (product_id, session_id)
    // This ensures only one view per session per product
    const { error } = await supabase
      .from('product_views')
      .upsert(
        { product_id, session_id },
        { onConflict: 'product_id,session_id', ignoreDuplicates: true }
      );

    if (error) {
      // Ignore duplicate key errors silently
      if (error.code === '23505') {
        return NextResponse.json({ recorded: false, reason: 'already_viewed' });
      }
      return NextResponse.json({ error: 'Eroare la înregistrare' }, { status: 500 });
    }

    return NextResponse.json({ recorded: true });
  } catch {
    return NextResponse.json({ error: 'Eroare la procesare' }, { status: 500 });
  }
}
