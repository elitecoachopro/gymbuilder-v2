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

async function getUserId(_request?: unknown) { return (await getSessionUser())?.id ?? null; }

// POST /api/client/favorites — toggle favorite
export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return await localizedJson({ error: 'Neautentificat.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { product_id } = body;

    if (typeof product_id !== 'string' || !/^[a-f0-9-]{36}$/i.test(product_id)) {
      return await localizedJson({ error: 'product_id obligatoriu.' }, { status: 400 });
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
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', existing.id);

      if (error) return await localizedJson({ error: 'Favoritele nu au putut fi salvate.' }, { status: 500 });
      return await localizedJson({ favorited: false, message: 'Produs eliminat din favorite.' });
    } else {
      // Add favorite
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, product_id });

      if (error) return await localizedJson({ error: 'Favoritele nu au putut fi salvate.' }, { status: 500 });
      return await localizedJson({ favorited: true, message: 'Produs adăugat la favorite.' });
    }
  } catch (err) {
    console.error('Favorites error:', err);
    return await localizedJson({ error: 'Eroare internă.' }, { status: 500 });
  }
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return await localizedJson({ error: 'Neautentificat.' }, { status: 401 });
  const { data, error } = await getSupabase().from('favorites').select('product_id').eq('user_id', userId);
  if (error) return await localizedJson({ error: 'Favoritele nu au putut fi încărcate.' }, { status: 500 });
  return await localizedJson({ ids: (data || []).map(row => row.product_id) });
}
