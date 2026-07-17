import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email-ul este obligatoriu.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Email invalid.' }, { status: 400 });
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
        return NextResponse.json({ message: 'Ești deja abonat la newsletter!' });
      }
      // Re-subscribe
      await supabase
        .from('newsletter_subscribers')
        .update({ status: 'active', unsubscribed_at: null })
        .eq('id', existing.id);
      return NextResponse.json({ message: 'Te-ai reabonat cu succes!' });
    }

    // New subscriber
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: normalizedEmail, status: 'active' });

    if (error) {
      console.error('Newsletter subscribe error:', error);
      return NextResponse.json({ error: 'Eroare la abonare.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Te-ai abonat cu succes la newsletter!' });
  } catch (err) {
    console.error('Newsletter API error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
