import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function validateMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 8) return false;
  // JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
  // WebP
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer.length >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return true;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const registrationToken = formData.get('token') as string;

    if (!file) {
      return NextResponse.json({ error: 'Niciun fișier selectat.' }, { status: 400 });
    }

    if (!registrationToken || registrationToken.length < 16) {
      return NextResponse.json({ error: 'Token de înregistrare invalid.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tip neacceptat. Acceptăm: JPG, PNG, WebP.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Fișierul depășește 5MB.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!validateMagicBytes(buffer)) {
      return NextResponse.json({ error: 'Fișierul nu este o imagine validă.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const ext = file.name.split('.').pop() || 'jpg';
    const uniqueName = `registration/${registrationToken}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;

    const { error } = await supabase.storage
      .from('uploads')
      .upload(uniqueName, buffer, { contentType: file.type, upsert: false });

    if (error) {
      // Try creating bucket if it doesn't exist
      if (error.message?.includes('not found') || error.message?.includes('Bucket')) {
        await supabase.storage.createBucket('uploads', { public: true, fileSizeLimit: MAX_FILE_SIZE, allowedMimeTypes: ALLOWED_TYPES });
        const { error: retryError } = await supabase.storage.from('uploads').upload(uniqueName, buffer, { contentType: file.type, upsert: false });
        if (retryError) {
          return NextResponse.json({ error: 'Eroare la upload. Încearcă din nou.' }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: 'Eroare la upload. Încearcă din nou.' }, { status: 500 });
      }
    }

    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(uniqueName);

    return NextResponse.json({ success: true, url: urlData.publicUrl, path: uniqueName });
  } catch (err) {
    console.error('Registration upload error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
