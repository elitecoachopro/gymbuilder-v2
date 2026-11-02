import type { Database } from '@/types/database.generated';
import { createClient } from '@supabase/supabase-js';

export function analyticsDatabase() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// Never accept the environment from a browser, query string or payload.
export function analyticsEnvironment() {
  return process.env.VERCEL_ENV === 'production' ? 'production' : process.env.VERCEL_ENV === 'preview' ? 'preview' : 'development';
}
