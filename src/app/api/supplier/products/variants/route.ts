import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { variantCreateInput, variantUpdateInput } from '@/lib/validation';
import { getSessionUser } from '@/lib/session-server';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getUserFromSession(_request?: unknown) { return getSessionUser(); }

// GET - list variants for a product (public or authenticated)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('product_id');

  if (!productId) {
    return await localizedJson({ error: 'product_id obligatoriu' }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: product } = await supabase.from('products').select('supplier_id, status').eq('id', productId).maybeSingle();
  if (!product) return await localizedJson({ error: 'Produs negasit.' }, { status: 404 });
  const { data: supplier } = await supabase.from('supplier_profiles').select('status, user_id').eq('id', product.supplier_id).maybeSingle();
  if (!supplier) return await localizedJson({ error: 'Produs negasit.' }, { status: 404 });
  if (!['active', 'featured'].includes(product.status) || supplier.status !== 'approved') {
    const user = await getSessionUser();
    if (!user || (user.id !== supplier.user_id && user.role !== 'admin')) return await localizedJson({ error: 'Produs negasit.' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('product_variants')
    .select('id, label, price_override, description_override, image_url, sort_order, created_at')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (error) {
    return await localizedJson({ error: 'Eroare la încărcarea variantelor' }, { status: 500 });
  }

  return await localizedJson({ variants: data || [] });
}

// POST - create a new variant
export async function POST(request: NextRequest) {
  const session = await getUserFromSession();
  if (!session) {
    return await localizedJson({ error: 'Neautorizat' }, { status: 401 });
  }

  const supabase = getSupabase();

  const { data: supplier } = await supabase
    .from('supplier_profiles')
    .select('id')
    .eq('user_id', session.userId)
    .single();

  if (!supplier) {
    return await localizedJson({ error: 'Profil furnizor negăsit' }, { status: 404 });
  }

  const body = await request.json();
  const parsed = variantCreateInput.safeParse(body);
  if (!parsed.success) return await localizedJson({ error: 'Date varianta invalide.' }, { status: 400 });
  const { product_id, label, price_override, description_override, image_url } = parsed.data;

  if (!product_id || !label) {
    return await localizedJson({ error: 'product_id și label sunt obligatorii' }, { status: 400 });
  }

  // Verify product belongs to this supplier
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', product_id)
    .eq('supplier_id', supplier.id)
    .single();

  if (!product) {
    return await localizedJson({ error: 'Produs negăsit sau nu vă aparține' }, { status: 404 });
  }

  // Check max 10 variants per product
  const { count } = await supabase
    .from('product_variants')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', product_id);

  if ((count || 0) >= 10) {
    return await localizedJson({ error: 'Maxim 10 variante per produs' }, { status: 400 });
  }

  const { data: variant, error } = await supabase
    .from('product_variants')
    .insert({
      product_id,
      label: label.slice(0, 100),
      price_override: price_override ?? null,
      description_override: description_override?.slice(0, 500) || null,
      image_url: image_url || null,
      sort_order: (count || 0) + 1,
    })
    .select('id, label, price_override, description_override, image_url, sort_order, created_at')
    .single();

  if (error) {
    return await localizedJson({ error: 'Eroare la creare: ' + error.message }, { status: 500 });
  }

  return await localizedJson({ variant }, { status: 201 });
}

// PATCH - update a variant
export async function PATCH(request: NextRequest) {
  const session = await getUserFromSession();
  if (!session) {
    return await localizedJson({ error: 'Neautorizat' }, { status: 401 });
  }

  const supabase = getSupabase();

  const { data: supplier } = await supabase
    .from('supplier_profiles')
    .select('id')
    .eq('user_id', session.userId)
    .single();

  if (!supplier) {
    return await localizedJson({ error: 'Profil furnizor negăsit' }, { status: 404 });
  }

  const body = await request.json();
  const parsed = variantUpdateInput.safeParse(body);
  if (!parsed.success) return await localizedJson({ error: 'Date varianta invalide.' }, { status: 400 });
  const { variant_id, label, price_override, description_override, image_url } = parsed.data;

  if (!variant_id) {
    return await localizedJson({ error: 'variant_id obligatoriu' }, { status: 400 });
  }

  // Verify ownership through product
  const { data: variant } = await supabase
    .from('product_variants')
    .select('id, product_id')
    .eq('id', variant_id)
    .single();

  if (!variant) {
    return await localizedJson({ error: 'Variantă negăsită' }, { status: 404 });
  }

  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', variant.product_id)
    .eq('supplier_id', supplier.id)
    .single();

  if (!product) {
    return await localizedJson({ error: 'Nu aveți acces la acest produs' }, { status: 403 });
  }

  const updates: Database['public']['Tables']['product_variants']['Update'] = {};
  if (label !== undefined) updates.label = label.slice(0, 100);
  if (price_override !== undefined) updates.price_override = price_override ?? null;
  if (description_override !== undefined) updates.description_override = description_override?.slice(0, 500) || null;
  if (image_url !== undefined) updates.image_url = image_url || null;

  const { data: updated, error } = await supabase
    .from('product_variants')
    .update(updates)
    .eq('id', variant_id)
    .select('id, label, price_override, description_override, image_url, sort_order, created_at')
    .single();

  if (error) {
    return await localizedJson({ error: 'Eroare la actualizare' }, { status: 500 });
  }

  return await localizedJson({ variant: updated });
}

// DELETE - remove a variant
export async function DELETE(request: NextRequest) {
  const session = await getUserFromSession();
  if (!session) {
    return await localizedJson({ error: 'Neautorizat' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const variantId = searchParams.get('id');

  if (!variantId) {
    return await localizedJson({ error: 'ID variantă lipsă' }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: supplier } = await supabase
    .from('supplier_profiles')
    .select('id')
    .eq('user_id', session.userId)
    .single();

  if (!supplier) {
    return await localizedJson({ error: 'Profil furnizor negăsit' }, { status: 404 });
  }

  // Verify ownership
  const { data: variant } = await supabase
    .from('product_variants')
    .select('id, product_id')
    .eq('id', variantId)
    .single();

  if (!variant) {
    return await localizedJson({ error: 'Variantă negăsită' }, { status: 404 });
  }

  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', variant.product_id)
    .eq('supplier_id', supplier.id)
    .single();

  if (!product) {
    return await localizedJson({ error: 'Nu aveți acces' }, { status: 403 });
  }

  const { error: deleteError } = await supabase.from('product_variants').delete().eq('id', variantId);
  if (deleteError) return await localizedJson({ error: 'Varianta nu a putut fi stearsa.' }, { status: 500 });

  return await localizedJson({ success: true });
}
