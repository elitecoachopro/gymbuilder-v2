import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { getSessionUser } from '@/lib/session-server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getUserFromSession(_request?: unknown) { return getSessionUser(); }

export async function GET() {
  const session = await getUserFromSession();
  if (!session) {
    return await localizedJson({ error: 'Neautorizat' }, { status: 401 });
  }

  const supabase = getSupabase();

  // Get supplier profile
  const { data: supplier } = await supabase
    .from('supplier_profiles')
    .select('id')
    .eq('user_id', session.userId)
    .single();

  if (!supplier) {
    return await localizedJson({ error: 'Profil furnizor negăsit' }, { status: 404 });
  }

  const { data: analytics, error } = await supabase.rpc('supplier_product_analytics', { p_supplier_id: supplier.id });
  if (error) return await localizedJson({ error: 'Statisticile nu au putut fi incarcate.' }, { status: 500 });
  return await localizedJson({ analytics: analytics || [] });
}
