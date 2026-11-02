import { NextRequest } from 'next/server';
import { localizedJson } from '@/lib/json-response';
import { getSessionUser } from '@/lib/session-server';
import { analyticsPeriod } from '@/lib/analytics/input';
import { analyticsDatabase, analyticsEnvironment } from '@/lib/analytics/server';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return localizedJson({ error: 'Autentificare necesară.' }, { status: 401 });
  if (!['admin', 'supplier'].includes(user.role)) return localizedJson({ error: 'Acces interzis.' }, { status: 403 });
  const days = analyticsPeriod(request.nextUrl.searchParams.get('days'));
  if (!days) return localizedJson({ error: 'Perioadă invalidă.' }, { status: 400 });
  const db = analyticsDatabase();
  let supplierId: string | null = null;
  if (user.role === 'supplier') {
    const { data, error } = await db.from('supplier_profiles').select('id').eq('user_id', user.userId).maybeSingle();
    if (error) return localizedJson({ error: 'Statisticile nu sunt disponibile.' }, { status: 503 });
    if (!data) return localizedJson({ error: 'Profil furnizor negăsit.' }, { status: 404 });
    supplierId = data.id;
  }
  const environment = analyticsEnvironment();
  const { data, error } = await db.rpc('traffic_summary', { p_days: days, p_environment: environment, p_supplier_id: supplierId });
  if (error) return localizedJson({ error: 'Statisticile nu sunt disponibile.' }, { status: 503 });
  return localizedJson({ stats: data, days, environment }, { headers: { 'Cache-Control': 'private, no-store' } });
}
