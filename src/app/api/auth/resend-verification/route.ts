import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { sendVerificationEmail } from '@/lib/email';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeEmail, isValidEmail } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = sanitizeEmail(body?.email);
  if (!isValidEmail(email)) return await localizedJson({ error: 'Adresa de email este invalida.' }, { status: 400 });
  const limit = await checkRateLimit(`verify-email:${getClientIP(request)}:${email}`, { maxRequests: 3, windowMs: 3600000 });
  if (!limit.allowed) return rateLimitResponse(limit.resetTime);
  if (!process.env.RESEND_API_KEY) return await localizedJson({ error: 'Serviciul de email nu este configurat. Incearca mai tarziu.' }, { status: 503 });
  const database = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: user, error } = await database.from('users')
    .select('id, full_name, email_verified, verification_token, verification_token_expires_at').eq('email', email).maybeSingle();
  if (error) return await localizedJson({ error: 'Eroare la verificarea contului.' }, { status: 500 });
  if (user && !user.email_verified) {
    const reuse = user.verification_token && user.verification_token_expires_at && new Date(user.verification_token_expires_at).getTime() > Date.now();
    const token = reuse && user.verification_token ? user.verification_token : crypto.randomBytes(32).toString('hex');
    if (!reuse) {
      const { error: updateError } = await database.from('users').update({
        verification_token: token, verification_token_expires_at: new Date(Date.now() + 86400000).toISOString(),
      }).eq('id', user.id).eq('email_verified', false);
      if (updateError) return await localizedJson({ error: 'Eroare la pregatirea confirmarii.' }, { status: 500 });
    }
    try { await sendVerificationEmail(email, token, user.full_name.split(' ')[0]); }
    catch { return await localizedJson({ error: 'Emailul nu a putut fi trimis. Incearca din nou mai tarziu.' }, { status: 502 }); }
  }
  return await localizedJson({ success: true, message: 'Daca adresa are un cont neconfirmat, vei primi un email de verificare.' });
}
