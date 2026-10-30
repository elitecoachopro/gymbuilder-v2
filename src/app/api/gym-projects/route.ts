import type { Database, Json } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { validStudioProject } from '@/lib/gym-studio';
import { projectCreateInput, projectUpdateInput } from '@/lib/validation';
import { getSessionUser } from '@/lib/session-server';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getUser(_request?: unknown) { return getSessionUser(); }

// GET - list user's gym projects
export async function GET() {
  const user = await getUser();
  if (!user) return await localizedJson({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabase();
  const { data: projects, error } = await supabase
    .from('gym_projects')
    .select('*')
    .eq('client_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) return await localizedJson({ error: error.message }, { status: 500 });
  return await localizedJson({ projects });
}

// POST - create or update a gym project
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return await localizedJson({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return await localizedJson({ error: 'Dimensiuni sau date proiect invalide.' }, { status: 400 }); }
  const updating = body !== null && typeof body === 'object' && 'id' in body && Boolean(body.id);
  const parsed = (updating ? projectUpdateInput : projectCreateInput).safeParse(body);
  if (!parsed.success) return await localizedJson({ error: 'Dimensiuni sau date proiect invalide.' }, { status: 400 });
  const { id, name, variant, total_area, length_m, width_m, zones, status, configuration } = { id: undefined, ...parsed.data };

  const supabase = getSupabase();

  if (id) {
    // Update existing project
    const { data: existing } = await supabase
      .from('gym_projects')
      .select('*')
      .eq('id', id)
      .eq('client_id', user.id)
      .single();

    if (!existing) return await localizedJson({ error: 'Project not found' }, { status: 404 });

    if (!validStudioProject({ ...existing, ...parsed.data })) return await localizedJson({ error: 'Suprafețele sau geometria zonelor sunt inconsistente.' }, { status: 400 });
    const updateData: Database['public']['Tables']['gym_projects']['Update'] = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (variant !== undefined) updateData.variant = variant;
    if (total_area !== undefined) updateData.total_area = total_area;
    if (length_m !== undefined) updateData.length_m = length_m;
    if (width_m !== undefined) updateData.width_m = width_m;
    if (zones !== undefined) updateData.zones = zones as Json;
    if (status !== undefined) updateData.status = status;
    if (configuration !== undefined) updateData.configuration = configuration as Json;

    const { data: project, error } = await supabase
      .from('gym_projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return await localizedJson({ error: error.message }, { status: 500 });
    return await localizedJson({ project });
  } else {
    // Create new project
    if (!variant || !total_area || !length_m || !width_m) {
      return await localizedJson({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!validStudioProject({ total_area, length_m, width_m, zones, configuration })) return await localizedJson({ error: 'Suprafețele sau geometria zonelor sunt inconsistente.' }, { status: 400 });
    const { data: project, error } = await supabase
      .from('gym_projects')
      .insert({
        client_id: user.id,
        name: name || 'Proiect Sală',
        variant,
        total_area,
        length_m,
        width_m,
        zones: (zones || []) as Json,
        status: status || 'draft',
        configuration: (configuration || null) as Json,
      })
      .select()
      .single();

    if (error) return await localizedJson({ error: error.message }, { status: 500 });
    return await localizedJson({ project }, { status: 201 });
  }
}

// DELETE - delete a gym project
export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return await localizedJson({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return await localizedJson({ error: 'Missing project id' }, { status: 400 });

  const supabase = getSupabase();
  const { error } = await supabase
    .from('gym_projects')
    .delete()
    .eq('id', id)
    .eq('client_id', user.id);

  if (error) return await localizedJson({ error: error.message }, { status: 500 });
  return await localizedJson({ success: true });
}
