import type { Database } from '@/types/database.generated';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

export const registrationCookie = 'registration_upload_token';
export const registrationBucket = 'registration-verifications';
export const registrationDatabase = () => createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export const tokenHash = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export async function registrationSession() {
  const token = (await cookies()).get(registrationCookie)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const hash = tokenHash(token);
  const { data } = await registrationDatabase().from('registration_upload_sessions').select('id,upload_count')
    .eq('token_hash', hash).is('claimed_by', null).gt('expires_at', new Date().toISOString()).maybeSingle();
  return data ? { ...data, hash } : null;
}
