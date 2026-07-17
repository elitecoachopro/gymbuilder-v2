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

function getUserFromSession(): { userId: string } | null {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  if (!sessionToken) return null;
  try {
    const [payload, signature] = sessionToken.split('.');
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.JWT_SECRET || '';
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    if (signature !== expected) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64').toString());
    if (data.exp && data.exp < Date.now()) return null;
    return { userId: data.userId };
  } catch { return null; }
}

// GET - list variants for a product (public or authenticated)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('product_id');

  if (!productId) {
    return NextResponse.json({ error: 'product_id obligatoriu' }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('product_variants')
    .select('id, label, price_override, description_override, image_url, sort_order, created_at')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Eroare la încărcarea variantelor' }, { status: 500 });
  }

  return NextResponse.json({ variants: data || [] });
}

// POST - create a new variant
export async function POST(request: NextRequest) {
  const session = getUserFromSession();
  if (!session) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
  }

  const supabase = getSupabase();

  const { data: supplier } = await supabase
    .from('supplier_profiles')
    .select('id')
    .eq('user_id', session.userId)
    .single();

  if (!supplier) {
    return NextResponse.json({ error: 'Profil furnizor negăsit' }, { status: 404 });
  }

  const body = await request.json();
  const { product_id, label, price_override, description_override, image_url } = body;

  if (!product_id || !label) {
    return NextResponse.json({ error: 'product_id și label sunt obligatorii' }, { status: 400 });
  }

  // Verify product belongs to this supplier
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', product_id)
    .eq('supplier_id', supplier.id)
    .single();

  if (!product) {
    return NextResponse.json({ error: 'Produs negăsit sau nu vă aparține' }, { status: 404 });
  }

  // Check max 10 variants per product
  const { count } = await supabase
    .from('product_variants')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', product_id);

  if ((count || 0) >= 10) {
    return NextResponse.json({ error: 'Maxim 10 variante per produs' }, { status: 400 });
  }

  const { data: variant, error } = await supabase
    .from('product_variants')
    .insert({
      product_id,
      label: label.slice(0, 100),
      price_override: price_override || null,
      description_override: description_override?.slice(0, 500) || null,
      image_url: image_url || null,
      sort_order: (count || 0) + 1,
    })
    .select('id, label, price_override, description_override, image_url, sort_order, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Eroare la creare: ' + error.message }, { status: 500 });
  }

  return NextResponse.json({ variant }, { status: 201 });
}

// PATCH - update a variant
export async function PATCH(request: NextRequest) {
  const session = getUserFromSession();
  if (!session) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
  }

  const supabase = getSupabase();

  const { data: supplier } = await supabase
    .from('supplier_profiles')
    .select('id')
    .eq('user_id', session.userId)
    .single();

  if (!supplier) {
    return NextResponse.json({ error: 'Profil furnizor negăsit' }, { status: 404 });
  }

  const body = await request.json();
  const { variant_id, label, price_override, description_override, image_url } = body;

  if (!variant_id) {
    return NextResponse.json({ error: 'variant_id obligatoriu' }, { status: 400 });
  }

  // Verify ownership through product
  const { data: variant } = await supabase
    .from('product_variants')
    .select('id, product_id')
    .eq('id', variant_id)
    .single();

  if (!variant) {
    return NextResponse.json({ error: 'Variantă negăsită' }, { status: 404 });
  }

  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', variant.product_id)
    .eq('supplier_id', supplier.id)
    .single();

  if (!product) {
    return NextResponse.json({ error: 'Nu aveți acces la acest produs' }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  if (label !== undefined) updates.label = label.slice(0, 100);
  if (price_override !== undefined) updates.price_override = price_override || null;
  if (description_override !== undefined) updates.description_override = description_override?.slice(0, 500) || null;
  if (image_url !== undefined) updates.image_url = image_url || null;

  const { data: updated, error } = await supabase
    .from('product_variants')
    .update(updates)
    .eq('id', variant_id)
    .select('id, label, price_override, description_override, image_url, sort_order, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Eroare la actualizare' }, { status: 500 });
  }

  return NextResponse.json({ variant: updated });
}

// DELETE - remove a variant
export async function DELETE(request: NextRequest) {
  const session = getUserFromSession();
  if (!session) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const variantId = searchParams.get('id');

  if (!variantId) {
    return NextResponse.json({ error: 'ID variantă lipsă' }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: supplier } = await supabase
    .from('supplier_profiles')
    .select('id')
    .eq('user_id', session.userId)
    .single();

  if (!supplier) {
    return NextResponse.json({ error: 'Profil furnizor negăsit' }, { status: 404 });
  }

  // Verify ownership
  const { data: variant } = await supabase
    .from('product_variants')
    .select('id, product_id')
    .eq('id', variantId)
    .single();

  if (!variant) {
    return NextResponse.json({ error: 'Variantă negăsită' }, { status: 404 });
  }

  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', variant.product_id)
    .eq('supplier_id', supplier.id)
    .single();

  if (!product) {
    return NextResponse.json({ error: 'Nu aveți acces' }, { status: 403 });
  }

  await supabase.from('product_variants').delete().eq('id', variantId);

  return NextResponse.json({ success: true });
}
