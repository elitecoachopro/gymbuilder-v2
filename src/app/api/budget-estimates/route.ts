import type { Database, Json } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { budgetEstimateInput } from '@/lib/validation';
import { authenticateSession } from '@/lib/session-server';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getUserFromToken(token: string) { return authenticateSession(token); }

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return await localizedJson({ error: 'Neautorizat' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return await localizedJson({ error: 'Sesiune invalidă' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = budgetEstimateInput.safeParse(body);
    if (!parsed.success) return await localizedJson({ error: 'Estimare invalida.' }, { status: 400 });
    const { area, gymType, selectedZones, totalMin, totalMax, breakdown } = parsed.data;

    if (!area || !gymType || !selectedZones) {
      return await localizedJson({ error: 'Date incomplete' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase.from('budget_estimates').insert({
      user_id: user.userId || user.id,
      area_sqm: area,
      gym_type: gymType,
      selected_zones: selectedZones,
      total_min: totalMin,
      total_max: totalMax,
      breakdown: breakdown as Json,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error saving budget estimate:', error);
      return await localizedJson({ error: 'Eroare la salvare' }, { status: 500 });
    }

    return await localizedJson({ success: true });
  } catch (error) {
    console.error('Budget estimate error:', error);
    return await localizedJson({ error: 'Eroare server' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return await localizedJson({ error: 'Neautorizat' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return await localizedJson({ error: 'Sesiune invalidă' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('budget_estimates')
      .select('*')
      .eq('user_id', user.userId || user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return await localizedJson({ error: 'Eroare la citire' }, { status: 500 });
    }

    return await localizedJson({ estimates: data || [] });
  } catch {
    return await localizedJson({ error: 'Eroare server' }, { status: 500 });
  }
}
