import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { getSessionUser } from '@/lib/session-server';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Verify session token
async function verifySession(_request?: unknown) { return (await getSessionUser())?.id ?? null; }

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Validate file by checking magic bytes (binary signature)
function validateMagicBytes(buffer: Buffer): { valid: boolean; detectedType: string | null } {
  if (buffer.length < 8) return { valid: false, detectedType: null };

  // JPEG: starts with FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, detectedType: 'image/jpeg' };
  }

  // PNG: starts with 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
      buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A) {
    return { valid: true, detectedType: 'image/png' };
  }

  // WebP: starts with RIFF....WEBP (bytes 0-3: RIFF, bytes 8-11: WEBP)
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer.length >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return { valid: true, detectedType: 'image/webp' };
  }

  // GIF: starts with GIF87a or GIF89a
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38 &&
      (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61) {
    return { valid: true, detectedType: 'image/gif' };
  }

  return { valid: false, detectedType: null };
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifySession(request);
    if (!userId) {
      return await localizedJson({ error: 'Autentificare necesară.' }, { status: 401 });
    }

    const quota = await checkRateLimit(`image-upload:${userId}`, { maxRequests: 60, windowMs: 60000 });
    if (!quota.allowed) return rateLimitResponse(quota.resetTime);
    const dailyQuota = await checkRateLimit(`image-upload-day:${userId}`, { maxRequests: 500, windowMs: 86400000 });
    if (!dailyQuota.allowed) return rateLimitResponse(dailyQuota.resetTime);
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'general';

    if (!(file instanceof File) || !['products', 'products-360', 'general'].includes(folder)) {
      return await localizedJson({ error: 'Niciun fișier selectat.' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return await localizedJson(
        { error: 'Tip de fișier neacceptat. Acceptăm: JPG, PNG, WebP, GIF.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return await localizedJson(
        { error: 'Fișierul depășește limita de 5MB.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Generate unique filename
    const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' } as Record<string, string>)[file.type];
    const uniqueName = `${folder}/${userId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;

    // Convert file to buffer
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

    // Upload to Supabase Storage
    const { error } = await supabase.storage
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
          const { error: retryError } = await supabase.storage
            .from('uploads')
            .upload(uniqueName, buffer, {
              contentType: file.type,
              upsert: false,
            });

          if (retryError) {
            return await localizedJson(
              { error: 'Eroare la încărcarea fișierului. Încearcă din nou.' },
              { status: 500 }
            );
          }

          const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(uniqueName);
          return await localizedJson({
            success: true,
            url: urlData.publicUrl,
            path: uniqueName,
          });
        }
      }

      return await localizedJson(
        { error: 'Eroare la încărcarea fișierului. Încearcă din nou.' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(uniqueName);

    return await localizedJson({
      success: true,
      url: urlData.publicUrl,
      path: uniqueName,
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return await localizedJson(
      { error: 'Eroare internă la upload.' },
      { status: 500 }
    );
  }
}
