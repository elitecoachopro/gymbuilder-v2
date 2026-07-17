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
  } catch {
    return null;
  }
}

// GET - list gallery images for a supplier
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const supplierId = searchParams.get('supplier_id');

  const supabase = getSupabase();

  // If supplier_id provided, return public gallery for that supplier
  if (supplierId) {
    const { data, error } = await supabase
      .from('supplier_gallery')
      .select('id, image_url, caption, created_at')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Eroare la încărcarea galeriei' }, { status: 500 });
    }

    return NextResponse.json({ images: data || [] });
  }

  // Otherwise, return gallery for logged-in supplier
  const session = getUserFromSession();
  if (!session) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
  }

  const { data: supplier } = await supabase
    .from('supplier_profiles')
    .select('id')
    .eq('user_id', session.userId)
    .single();

  if (!supplier) {
    return NextResponse.json({ error: 'Profil furnizor negăsit' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('supplier_gallery')
    .select('id, image_url, caption, created_at')
    .eq('supplier_id', supplier.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Eroare la încărcarea galeriei' }, { status: 500 });
  }

  return NextResponse.json({ images: data || [] });
}

// POST - upload a new gallery image
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

  // Check current count (max 10)
  const { count } = await supabase
    .from('supplier_gallery')
    .select('*', { count: 'exact', head: true })
    .eq('supplier_id', supplier.id);

  if ((count || 0) >= 10) {
    return NextResponse.json({ error: 'Limita de 10 imagini a fost atinsă' }, { status: 400 });
  }

  // Handle file upload
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const caption = (formData.get('caption') as string) || '';

  if (!file) {
    return NextResponse.json({ error: 'Niciun fișier selectat' }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Format invalid. Acceptăm: JPG, PNG, WebP, GIF' }, { status: 400 });
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Fișierul depășește 5MB' }, { status: 400 });
  }

  // Upload to Supabase Storage
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `gallery/${supplier.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from('supplier-assets')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: 'Eroare la upload: ' + uploadError.message }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('supplier-assets')
    .getPublicUrl(fileName);

  const imageUrl = urlData.publicUrl;

  // Save to database
  const { data: inserted, error: insertError } = await supabase
    .from('supplier_gallery')
    .insert({
      supplier_id: supplier.id,
      image_url: imageUrl,
      caption: caption.slice(0, 200),
    })
    .select('id, image_url, caption, created_at')
    .single();

  if (insertError) {
    return NextResponse.json({ error: 'Eroare la salvare: ' + insertError.message }, { status: 500 });
  }

  return NextResponse.json({ image: inserted }, { status: 201 });
}

// DELETE - remove a gallery image
export async function DELETE(request: NextRequest) {
  const session = getUserFromSession();
  if (!session) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get('id');

  if (!imageId) {
    return NextResponse.json({ error: 'ID imagine lipsă' }, { status: 400 });
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
  const { data: image } = await supabase
    .from('supplier_gallery')
    .select('id, image_url')
    .eq('id', imageId)
    .eq('supplier_id', supplier.id)
    .single();

  if (!image) {
    return NextResponse.json({ error: 'Imagine negăsită' }, { status: 404 });
  }

  // Delete from database
  await supabase
    .from('supplier_gallery')
    .delete()
    .eq('id', imageId);

  return NextResponse.json({ success: true });
}
