import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { validUnsubscribeToken } from '@/lib/newsletter-token';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token } = body;

    if (typeof email !== 'string' || !validUnsubscribeToken(email, token)) {
      return await localizedJson({ error: 'Email obligatoriu.' }, { status: 403 });
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
      .eq('email', email.trim().toLowerCase());

    if (error) {
      return await localizedJson({ error: 'Eroare la dezabonare.' }, { status: 500 });
    }

    return await localizedJson({ success: true });
  } catch {
    return await localizedJson({ error: 'Eroare internă.' }, { status: 500 });
  }
}
