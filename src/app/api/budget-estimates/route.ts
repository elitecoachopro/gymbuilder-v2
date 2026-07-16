import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getUserFromToken(token: string) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    const data = `${headerB64}.${payloadB64}`;
    const signature = Buffer.from(signatureB64, 'base64url');
    const expected = crypto.createHmac('sha256', process.env.JWT_SECRET || 'dev-secret')
      .update(data)
      .digest();
    if (!crypto.timingSafeEqual(signature, expected)) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Sesiune invalidă' }, { status: 401 });
    }

    const body = await request.json();
    const { area, gymType, selectedZones, totalMin, totalMax, breakdown } = body;

    if (!area || !gymType || !selectedZones || !totalMin || !totalMax) {
      return NextResponse.json({ error: 'Date incomplete' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase.from('budget_estimates').insert({
      user_id: user.userId || user.id,
      area_sqm: area,
      gym_type: gymType,
      selected_zones: selectedZones,
      total_min: totalMin,
      total_max: totalMax,
      breakdown: breakdown,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error saving budget estimate:', error);
      return NextResponse.json({ error: 'Eroare la salvare' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Budget estimate error:', error);
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Sesiune invalidă' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('budget_estimates')
      .select('*')
      .eq('user_id', user.userId || user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: 'Eroare la citire' }, { status: 500 });
    }

    return NextResponse.json({ estimates: data || [] });
  } catch {
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 });
  }
}
