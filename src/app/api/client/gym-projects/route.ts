import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import * as crypto from 'crypto';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getClientUser(): Promise<{ id: string; email: string; full_name: string; role: string } | null> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  if (!sessionToken) return null;
  try {
    const [payloadB64, signature] = sessionToken.split('.');
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.JWT_SECRET || '';
    const decodedPayload = Buffer.from(payloadB64, 'base64').toString();
    const expected = crypto.createHmac('sha256', secret).update(decodedPayload).digest('hex');
    if (signature !== expected) return null;
    const data = JSON.parse(decodedPayload);
    if (data.exp && data.exp < Date.now()) return null;
    const supabase = getSupabase();
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', data.userId)
      .single();
    return user;
  } catch {
    return null;
  }
}

// GET - list client's gym projects
export async function GET() {
  const user = await getClientUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabase();
  const { data: projects, error } = await supabase
    .from('gym_projects')
    .select('*')
    .eq('client_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ projects });
}

// POST - create or update a gym project
export async function POST(request: NextRequest) {
  const user = await getClientUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, name, variant, total_area, length_m, width_m, zones, status } = body;

  const supabase = getSupabase();

  if (id) {
    // Update existing project
    const { data: existing } = await supabase
      .from('gym_projects')
      .select('id')
      .eq('id', id)
      .eq('client_id', user.id)
      .single();

    if (!existing) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (variant !== undefined) updateData.variant = variant;
    if (total_area !== undefined) updateData.total_area = total_area;
    if (length_m !== undefined) updateData.length_m = length_m;
    if (width_m !== undefined) updateData.width_m = width_m;
    if (zones !== undefined) updateData.zones = zones;
    if (status !== undefined) updateData.status = status;

    const { data: project, error } = await supabase
      .from('gym_projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ project });
  } else {
    // Create new project
    if (!variant || !total_area || !length_m || !width_m) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: project, error } = await supabase
      .from('gym_projects')
      .insert({
        client_id: user.id,
        name: name || 'Proiect Sală',
        variant,
        total_area,
        length_m,
        width_m,
        zones: zones || [],
        status: status || 'draft',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ project }, { status: 201 });
  }
}

// DELETE - delete a gym project
export async function DELETE(request: NextRequest) {
  const user = await getClientUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing project id' }, { status: 400 });

  const supabase = getSupabase();
  const { error } = await supabase
    .from('gym_projects')
    .delete()
    .eq('id', id)
    .eq('client_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
