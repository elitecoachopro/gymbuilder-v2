import type { Database } from '@/types/database.generated';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { verifySessionToken } from '@/lib/session';
import type { UserRole } from '@/types/database';

export interface AuthenticatedUser {
  id: string;
  userId: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export async function authenticateSession(token: string): Promise<AuthenticatedUser | null> {
  const payload = verifySessionToken(token);
  if (!payload) return null;
  const database = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await database.from('users')
    .select('id, email, full_name, role, email_verified, session_version')
    .eq('id', payload.userId).single();
  if (error || !data || !data.email_verified || data.session_version !== payload.version) return null;
  return { id: data.id, userId: data.id, email: data.email, full_name: data.full_name, role: data.role };
}

export async function getSessionUser(): Promise<AuthenticatedUser | null> {
  const store = await cookies();
  const token = store.get('session_token')?.value;
  return token ? authenticateSession(token) : null;
}
