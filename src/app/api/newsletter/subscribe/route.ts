import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 requests per minute per IP
    const ip = getClientIP(request);
    const rateCheck = await checkRateLimit(`newsletter-subscribe:${ip}`, { maxRequests: 3, windowMs: 60 * 1000 });
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetTime);
    }

    const body = await request.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return await localizedJson({ error: 'Email-ul este obligatoriu.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return await localizedJson({ error: 'Email invalid.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const normalizedEmail = email.trim().toLowerCase();

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      if (existing.status === 'active') {
        return await localizedJson({ message: 'Ești deja abonat la newsletter!' });
      }
      // Re-subscribe
      await supabase
        .from('newsletter_subscribers')
        .update({ status: 'active', unsubscribed_at: null })
        .eq('id', existing.id);
      return await localizedJson({ message: 'Te-ai reabonat cu succes!' });
    }

    // New subscriber
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: normalizedEmail, status: 'active' });

    if (error) {
      console.error('Newsletter subscribe error:', error);
      return await localizedJson({ error: 'Eroare la abonare.' }, { status: 500 });
    }

    return await localizedJson({ message: 'Te-ai abonat cu succes la newsletter!' });
  } catch (err) {
    console.error('Newsletter API error:', err);
    return await localizedJson({ error: 'Eroare internă.' }, { status: 500 });
  }
}
