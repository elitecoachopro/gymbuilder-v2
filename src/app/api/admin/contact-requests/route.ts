import { getErrorMessage } from '@/lib/error-message';
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

async function verifyAdmin(): Promise<boolean> {
  const session = await getUserFromSession();
  if (!session) return false;
  if (session.role === 'admin') return true;
  const supabase = getSupabase();
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.userId)
    .single();
  return data?.role === 'admin';
}

// GET: List all contact requests (admin only) with supplier info
export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return await localizedJson({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();

    const page = Math.max(1, Math.min(10000, Number.parseInt(new URL(request.url).searchParams.get('page') || '1', 10) || 1));
    const from = (page - 1) * 100;
    // Get all contact_requests with supplier company name
    const { data: requests, error, count } = await supabase
      .from('contact_requests')
      .select('id, client_name, client_email, client_phone, message, product_id, supplier_id, status, created_at, viewed_at', { count: 'exact' })
      .order('created_at', { ascending: false }).order('id', { ascending: false })
      .range(from, from + 99);

    if (error) {
      return await localizedJson({ error: error.message }, { status: 500 });
    }

    const pending = await supabase.from('contact_requests').select('id', { count: 'exact', head: true }).eq('status', 'sent');
    if (pending.error) return await localizedJson({ error: 'Eroare la încărcarea datelor.' }, { status: 500 });
    // Get supplier names for all unique supplier_ids
    const supplierIds = Array.from(new Set((requests || []).map((r) => r.supplier_id).filter(Boolean)));
    let supplierMap: Record<string, string> = {};
    if (supplierIds.length > 0) {
      const { data: suppliers } = await supabase
        .from('supplier_profiles')
        .select('id, company_name')
        .in('id', supplierIds);
      if (suppliers) {
        supplierMap = Object.fromEntries(suppliers.map((s) => [s.id, s.company_name]));
      }
    }

    // Enrich requests with supplier name
    const enrichedRequests = (requests || []).map((r) => ({
      ...r,
      supplier_name: supplierMap[r.supplier_id] || 'Necunoscut',
    }));

    return await localizedJson({ requests: enrichedRequests, total: count || 0, pendingTotal: pending.count || 0, pagination: { page, hasNext: (count || 0) > from + 100 } });
  } catch (err) {
    return await localizedJson({ error: getErrorMessage(err) }, { status: 500 });
  }
}
