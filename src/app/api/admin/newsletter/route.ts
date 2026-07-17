import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import * as crypto from 'crypto';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAdminUser(): Promise<{ id: string; role: string } | null> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  if (!sessionToken) return null;
  try {
    const [payload, signature] = sessionToken.split('.');
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.JWT_SECRET || '';
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    if (signature !== expected) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64').toString());
    if (data.exp && data.exp < Date.now()) return null;

    const supabase = getSupabase();
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', data.userId)
      .single();

    if (!user || user.role !== 'admin') return null;
    return user;
  } catch {
    return null;
  }
}

// GET - List subscribers with stats
export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Neautorizat.' }, { status: 401 });
  }

  const supabase = getSupabase();

  // Get all subscribers
  const { data: subscribers, error } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, status, subscribed_at, unsubscribed_at')
    .order('subscribed_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Eroare la încărcarea abonaților.' }, { status: 500 });
  }

  const activeCount = (subscribers || []).filter(s => s.status === 'active').length;
  const unsubscribedCount = (subscribers || []).filter(s => s.status === 'unsubscribed').length;

  return NextResponse.json({
    subscribers: subscribers || [],
    stats: {
      total: (subscribers || []).length,
      active: activeCount,
      unsubscribed: unsubscribedCount,
    },
  });
}

// POST - Send newsletter email to all active subscribers
export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Neautorizat.' }, { status: 401 });
  }

  const body = await request.json();
  const { subject, content } = body;

  if (!subject || !subject.trim()) {
    return NextResponse.json({ error: 'Subiectul este obligatoriu.' }, { status: 400 });
  }
  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'Conținutul este obligatoriu.' }, { status: 400 });
  }

  const supabase = getSupabase();
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Cheia API Resend nu este configurată.' }, { status: 500 });
  }

  // Get all active subscribers
  const { data: subscribers } = await supabase
    .from('newsletter_subscribers')
    .select('email')
    .eq('status', 'active');

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ error: 'Nu există abonați activi.' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gymbuilder.app';

  // Send emails in batches of 50 (Resend batch limit)
  const emails = subscribers.map(s => s.email);
  let sentCount = 0;
  let failedCount = 0;

  const batchSize = 50;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    // Send individually via Resend (batch API requires specific format)
    for (const recipientEmail of batch) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'GymBuilder <noreply@gymbuilder.app>',
            to: [recipientEmail],
            subject: subject.trim(),
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #1a1a1a; color: #ffffff;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #f5c542; font-size: 28px; margin: 0;">GymBuilder</h1>
                </div>
                <div style="background: #2a2a2a; border-radius: 12px; padding: 32px; border: 1px solid #3a3a3a;">
                  <h2 style="color: #ffffff; margin-top: 0;">${subject.trim()}</h2>
                  <div style="color: #d1d5db; line-height: 1.8; font-size: 15px; white-space: pre-wrap;">${content.trim()}</div>
                </div>
                <div style="text-align: center; margin-top: 24px;">
                  <a href="${appUrl}" style="color: #f5c542; text-decoration: none; font-size: 14px;">Vizitează GymBuilder →</a>
                </div>
                <p style="color: #6b7280; font-size: 11px; text-align: center; margin-top: 24px;">
                  Primești acest email deoarece te-ai abonat la newsletter-ul GymBuilder.<br/>
                  <a href="${appUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}" style="color: #6b7280; text-decoration: underline;">Dezabonare</a>
                </p>
              </div>
            `,
          }),
        });
        if (res.ok) {
          sentCount++;
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: `Newsletter trimis! ${sentCount} email-uri trimise cu succes${failedCount > 0 ? `, ${failedCount} eșuate` : ''}.`,
    sentCount,
    failedCount,
  });
}
