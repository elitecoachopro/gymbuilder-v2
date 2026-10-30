import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST - record a unique product view per session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, session_id } = body;

    if (typeof product_id !== 'string' || !/^[a-f0-9-]{36}$/i.test(product_id) || typeof session_id !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(session_id)) {
      return await localizedJson({ error: 'product_id și session_id obligatorii' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: product } = await supabase.from('products').select('id, supplier_profiles!inner(status)').eq('id', product_id).in('status', ['active', 'featured']).eq('supplier_profiles.status', 'approved').maybeSingle();
    if (!product) return await localizedJson({ error: 'Produs negăsit.' }, { status: 404 });

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
        return await localizedJson({ recorded: false, reason: 'already_viewed' });
      }
      return await localizedJson({ error: 'Eroare la înregistrare' }, { status: 500 });
    }

    return await localizedJson({ recorded: true });
  } catch {
    return await localizedJson({ error: 'Eroare la procesare' }, { status: 500 });
  }
}
