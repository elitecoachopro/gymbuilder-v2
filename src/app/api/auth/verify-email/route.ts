import type { Database } from '@/types/database.generated';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const destination = new URL('/login', appUrl);
  const token = request.nextUrl.searchParams.get('token');
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    destination.searchParams.set('error', 'Token invalid sau expirat');
    return NextResponse.redirect(destination);
  }
  const database = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await database.from('users').update({
    email_verified: true, verification_token: null, verification_token_expires_at: null,
    updated_at: new Date().toISOString(),
  }).eq('verification_token', token).eq('email_verified', false)
    .gt('verification_token_expires_at', new Date().toISOString()).select('id').maybeSingle();
  if (error || !data) destination.searchParams.set('error', 'Token invalid sau expirat');
  else destination.searchParams.set('verified', 'true');
  return NextResponse.redirect(destination);
}
