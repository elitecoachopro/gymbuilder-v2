import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.generated';
import { getSessionUser } from '@/lib/session-server';
import { localizedJson } from '@/lib/json-response';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { serviceProfileSchema, serviceProfileColumns } from '@/lib/gym-services';

const fields = 'id, company_name, status, business_type, service_categories, service_areas, service_brands';
const database = () => createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET() {
  const user = await getSessionUser();
  if (!user) return localizedJson({ error: 'Autentificare necesară.' }, { status: 401 });
  if (user.role !== 'supplier') return localizedJson({ error: 'Acces interzis.' }, { status: 403 });
  const { data, error } = await database().from('supplier_profiles').select(fields).eq('user_id', user.id).maybeSingle();
  if (error) return localizedJson({ error: 'Eroare la încărcarea profilului.' }, { status: 500 });
  if (!data) return localizedJson({ error: 'Profil furnizor negăsit.' }, { status: 404 });
  return localizedJson({ supplier: data }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return localizedJson({ error: 'Autentificare necesară.' }, { status: 401 });
  if (user.role !== 'supplier') return localizedJson({ error: 'Acces interzis.' }, { status: 403 });
  const limit = await checkRateLimit(`supplier-services:${user.id}`, { maxRequests: 20, windowMs: 60000 });
  if (!limit.allowed) return rateLimitResponse(limit.resetTime);
  const body = await request.json().catch(() => null);
  const parsed = serviceProfileSchema.safeParse(body);
  if (!parsed.success || !body || !Object.hasOwn(body, 'businessType')) {
    return localizedJson({ error: 'Selectează serviciile și completează zona de acoperire.' }, { status: 400 });
  }
  const { data, error } = await database().from('supplier_profiles')
    .update({ ...serviceProfileColumns(parsed.data), updated_at: new Date().toISOString() })
    .eq('user_id', user.id).select(fields).maybeSingle();
  if (error) return localizedJson({ error: 'Profilul de service nu a putut fi salvat.' }, { status: 500 });
  if (!data) return localizedJson({ error: 'Profil furnizor negăsit.' }, { status: 404 });
  return localizedJson({ success: true, supplier: data });
}
