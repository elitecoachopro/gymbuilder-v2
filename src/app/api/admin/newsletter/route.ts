import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { unsubscribeToken } from '@/lib/newsletter-token';
import { loadNewsletterSubscribers } from '@/lib/newsletter-server';
import { getSessionUser } from '@/lib/session-server';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAdminUser(_request?: unknown) { const user = await getSessionUser(); return user?.role === 'admin' ? user : null; }

// GET - List subscribers with stats
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return await localizedJson({ error: 'Neautorizat.' }, { status: 401 });
  }

  const supabase = getSupabase();

  // Get all subscribers
  const { data: subscribers, error } = await loadNewsletterSubscribers(supabase);

  if (error) {
    return await localizedJson({ error: 'Eroare la încărcarea abonaților.' }, { status: 500 });
  }

  const activeCount = (subscribers || []).filter(s => s.status === 'active').length;
  const unsubscribedCount = (subscribers || []).filter(s => s.status === 'unsubscribed').length;

  return await localizedJson({
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
    return await localizedJson({ error: 'Neautorizat.' }, { status: 401 });
  }

  const body = await request.json();
  const { subject, content } = body;

  if (!subject || !subject.trim()) {
    return await localizedJson({ error: 'Subiectul este obligatoriu.' }, { status: 400 });
  }
  if (!content || !content.trim()) {
    return await localizedJson({ error: 'Conținutul este obligatoriu.' }, { status: 400 });
  }

  const supabase = getSupabase();
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return await localizedJson({ error: 'Cheia API Resend nu este configurată.' }, { status: 500 });
  }

  // Get all active subscribers
  const { data: subscribers, error: subscribersError } = await loadNewsletterSubscribers(supabase, true);
  if (subscribersError) return await localizedJson({ error: 'Abonatii nu au putut fi incarcati.' }, { status: 500 });

  if (!subscribers || subscribers.length === 0) {
    return await localizedJson({ error: 'Nu există abonați activi.' }, { status: 400 });
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
            from: 'Gym Builder <noreply@gymbuilder.app>',
            to: [recipientEmail],
            subject: subject.trim(),
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #1a1a1a; color: #ffffff;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #f5c542; font-size: 28px; margin: 0;">Gym Builder</h1>
                </div>
                <div style="background: #2a2a2a; border-radius: 12px; padding: 32px; border: 1px solid #3a3a3a;">
                  <h2 style="color: #ffffff; margin-top: 0;">${escapeHtml(subject.trim())}</h2>
                  <div style="color: #d1d5db; line-height: 1.8; font-size: 15px; white-space: pre-wrap;">${escapeHtml(content.trim())}</div>
                </div>
                <div style="text-align: center; margin-top: 24px;">
                  <a href="${appUrl}" style="color: #f5c542; text-decoration: none; font-size: 14px;">Vizitează Gym Builder →</a>
                </div>
                <p style="color: #6b7280; font-size: 11px; text-align: center; margin-top: 24px;">
                  Primești acest email deoarece te-ai abonat la newsletter-ul Gym Builder.<br/>
                  <a href="${appUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}&token=${unsubscribeToken(recipientEmail)}" style="color: #6b7280; text-decoration: underline;">Dezabonare</a>
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

  return await localizedJson({
    success: true,
    message: `Newsletter trimis! ${sentCount} email-uri trimise cu succes${failedCount > 0 ? `, ${failedCount} eșuate` : ''}.`,
    sentCount,
    failedCount,
  });
}
