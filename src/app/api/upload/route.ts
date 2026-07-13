import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Verify session token
function verifySession(request: NextRequest): string | null {
  const sessionToken = request.cookies.get('session_token')?.value;
  if (!sessionToken) return null;

  try {
    const [payloadB64, hmac] = sessionToken.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret';
    const expectedHmac = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    if (hmac !== expectedHmac) return null;
    if (Date.now() > payload.exp) return null;

    return payload.userId;
  } catch {
    return null;
  }
}

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const userId = verifySession(request);
    if (!userId) {
      return NextResponse.json({ error: 'Autentificare necesară.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'Niciun fișier selectat.' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tip de fișier neacceptat. Acceptăm: JPG, PNG, WebP, GIF.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Fișierul depășește limita de 5MB.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const uniqueName = `${folder}/${userId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(uniqueName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      
      // If bucket doesn't exist, try to create it
      if (error.message?.includes('not found') || error.message?.includes('Bucket')) {
        const { error: bucketError } = await supabase.storage.createBucket('uploads', {
          public: true,
          fileSizeLimit: MAX_FILE_SIZE,
          allowedMimeTypes: ALLOWED_TYPES,
        });

        if (!bucketError) {
          // Retry upload
          const { data: retryData, error: retryError } = await supabase.storage
            .from('uploads')
            .upload(uniqueName, buffer, {
              contentType: file.type,
              upsert: false,
            });

          if (retryError) {
            return NextResponse.json(
              { error: 'Eroare la încărcarea fișierului. Încearcă din nou.' },
              { status: 500 }
            );
          }

          const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(uniqueName);
          return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            path: uniqueName,
          });
        }
      }

      return NextResponse.json(
        { error: 'Eroare la încărcarea fișierului. Încearcă din nou.' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(uniqueName);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: uniqueName,
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Eroare internă la upload.' },
      { status: 500 }
    );
  }
}
