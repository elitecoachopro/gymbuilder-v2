import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { getSessionUser } from '@/lib/session-server';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

// Validate file by checking magic bytes (binary signature)
function validateMagicBytes(buffer: Buffer): { valid: boolean; detectedType: string | null } {
  if (buffer.length < 8) return { valid: false, detectedType: null };
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, detectedType: 'image/jpeg' };
  }
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
      buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A) {
    return { valid: true, detectedType: 'image/png' };
  }
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer.length >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return { valid: true, detectedType: 'image/webp' };
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38 &&
      (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61) {
    return { valid: true, detectedType: 'image/gif' };
  }
  return { valid: false, detectedType: null };
}

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getUserFromSession(_request?: unknown) { return getSessionUser(); }

// GET - list gallery images for a supplier
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const supplierId = searchParams.get('supplier_id');

  const supabase = getSupabase();

  // If supplier_id provided, return public gallery for that supplier
  if (supplierId) {
    const { data: profile } = await supabase.from('supplier_profiles').select('status, user_id').eq('id', supplierId).maybeSingle();
    if (!profile) return await localizedJson({ error: 'Furnizor negasit.' }, { status: 404 });
    if (profile.status !== 'approved') {
      const user = await getSessionUser();
      if (!user || (user.id !== profile.user_id && user.role !== 'admin')) return await localizedJson({ error: 'Furnizor negasit.' }, { status: 404 });
    }
    const { data, error } = await supabase
      .from('supplier_gallery')
      .select('id, image_url, caption, created_at')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) {
      return await localizedJson({ error: 'Eroare la încărcarea galeriei' }, { status: 500 });
    }

    return await localizedJson({ images: data || [] });
  }

  // Otherwise, return gallery for logged-in supplier
  const session = await getUserFromSession();
  if (!session) {
    return await localizedJson({ error: 'Neautorizat' }, { status: 401 });
  }

  const { data: supplier } = await supabase
    .from('supplier_profiles')
    .select('id')
    .eq('user_id', session.userId)
    .single();

  if (!supplier) {
    return await localizedJson({ error: 'Profil furnizor negăsit' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('supplier_gallery')
    .select('id, image_url, caption, created_at')
    .eq('supplier_id', supplier.id)
    .order('created_at', { ascending: false });

  if (error) {
    return await localizedJson({ error: 'Eroare la încărcarea galeriei' }, { status: 500 });
  }

  return await localizedJson({ images: data || [] });
}

// POST - upload a new gallery image
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

  // Check current count (max 10)
  const { count } = await supabase
    .from('supplier_gallery')
    .select('*', { count: 'exact', head: true })
    .eq('supplier_id', supplier.id);

  if ((count || 0) >= 10) {
    return await localizedJson({ error: 'Limita de 10 imagini a fost atinsă' }, { status: 400 });
  }

  // Handle file upload
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const caption = (formData.get('caption') as string) || '';
  if (typeof caption !== 'string') return await localizedJson({ error: 'Descriere invalida.' }, { status: 400 });

  if (!file) {
    return await localizedJson({ error: 'Niciun fișier selectat' }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return await localizedJson({ error: 'Format invalid. Acceptăm: JPG, PNG, WebP, GIF' }, { status: 400 });
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return await localizedJson({ error: 'Fișierul depășește 5MB' }, { status: 400 });
  }

  // Upload to Supabase Storage
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Validate magic bytes (real file signature)
  const magicCheck = validateMagicBytes(buffer);
  if (!magicCheck.valid || magicCheck.detectedType !== file.type) {
    return await localizedJson(
      { error: 'Fișierul nu este o imagine validă. Semnătura binară nu corespunde unui format acceptat (JPEG, PNG, WebP, GIF).' },
      { status: 400 }
    );
  }
  const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' } as Record<string, string>)[file.type];
  const fileName = `gallery/${supplier.id}/${randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('supplier-assets')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return await localizedJson({ error: 'Eroare la upload: ' + uploadError.message }, { status: 500 });
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
    await supabase.storage.from('supplier-assets').remove([fileName]);
    return await localizedJson({ error: 'Eroare la salvare: ' + insertError.message }, { status: 500 });
  }

  return await localizedJson({ image: inserted }, { status: 201 });
}

// DELETE - remove a gallery image
export async function DELETE(request: NextRequest) {
  const session = await getUserFromSession();
  if (!session) {
    return await localizedJson({ error: 'Neautorizat' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get('id');

  if (!imageId) {
    return await localizedJson({ error: 'ID imagine lipsă' }, { status: 400 });
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
  const { data: image } = await supabase
    .from('supplier_gallery')
    .select('id, image_url')
    .eq('id', imageId)
    .eq('supplier_id', supplier.id)
    .single();

  if (!image) {
    return await localizedJson({ error: 'Imagine negăsită' }, { status: 404 });
  }

  const url = new URL(image.image_url);
  const storageOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
  const objectPath = decodeURIComponent(url.pathname.split('/storage/v1/object/public/supplier-assets/')[1] || '');
  if (url.origin === storageOrigin && objectPath.startsWith(`gallery/${supplier.id}/`)) {
    const { error: storageError } = await supabase.storage.from('supplier-assets').remove([objectPath]);
    if (storageError) return await localizedJson({ error: 'Fisierul nu a putut fi sters.' }, { status: 500 });
  }
  const { error: deleteError } = await supabase
    .from('supplier_gallery')
    .delete()
    .eq('id', imageId);
  if (deleteError) return await localizedJson({ error: 'Imaginea nu a putut fi stearsa.' }, { status: 500 });

  return await localizedJson({ success: true });
}
