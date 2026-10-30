import { jsonObject } from '@/lib/database-values';
import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase.rpc('public_marketplace_stats');
    if (error) return await localizedJson({ error: 'Statisticile nu au putut fi incarcate.' }, { status: 500 });
    const stats = jsonObject(data);
    return await localizedJson({ products: Number(stats.products || 0), suppliers: Number(stats.suppliers || 0), brands: Number(stats.brands || 0) });
  } catch (error) {
    console.error('Stats API error:', error);
    return await localizedJson({ error: 'Statisticile nu au putut fi incarcate.' }, { status: 500 });
  }
}
