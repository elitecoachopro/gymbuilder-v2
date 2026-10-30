import { z } from 'zod';
import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

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

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 requests per minute per IP
    const ip = getClientIP(request);
    const result = await checkRateLimit(`contact:${ip}`, { maxRequests: 5, windowMs: 60000 });
    if (!result.allowed) {
      return rateLimitResponse(result.resetTime);
    }

    const parsed = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(254).transform(value => value.toLowerCase()), subject: z.string().trim().min(1).max(200), message: z.string().trim().min(1).max(5000), idempotencyKey: z.string().uuid().optional() }).safeParse(await request.json());
    if (!parsed.success) return await localizedJson({ error: 'Datele cererii sunt invalide.' }, { status: 400 });
    const { name, email, subject, message, idempotencyKey } = parsed.data;
    const supabase = getSupabase();
    if (idempotencyKey) {
      const { data: existing } = await supabase.from('contact_messages').select('id,email').eq('idempotency_key', idempotencyKey).maybeSingle();
      if (existing) return existing.email === email ? await localizedJson({ success: true, requestId: existing.id, message: 'Mesajul a fost înregistrat.' }) : await localizedJson({ error: 'Identificator de cerere deja folosit.' }, { status: 409 });
    }
    const { data: savedMsg, error: saveError } = await supabase.from('contact_messages').insert({ name, email, subject, message, status: 'unread', idempotency_key: idempotencyKey }).select('id').single();
    if (saveError?.code === '23505' && idempotencyKey) {
      const { data: existing } = await supabase.from('contact_messages').select('id').eq('idempotency_key', idempotencyKey).eq('email', email).maybeSingle();
      if (existing) return await localizedJson({ success: true, requestId: existing.id, message: 'Mesajul a fost înregistrat.' });
    }
    if (saveError || !savedMsg) return await localizedJson({ error: 'Cererea nu a putut fi salvata. Incearca din nou.' }, { status: 500 });
    const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
    if (admins?.length) {
      const { error } = await supabase.from('notifications').insert(admins.map(admin => ({ user_id: admin.id, type: 'contact_message', title: `Mesaj contact: ${subject.slice(0,60)}`, message: `De la ${name} (${email}): ${message.slice(0,120)}`, link: '/admin?tab=contact', is_read: false })));
      if (error) console.error('Contact notification could not be saved');
    }

    // Send email via Resend
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return await localizedJson({ success: true, requestId: savedMsg.id, emailSent: false, message: 'Mesajul a fost înregistrat.' });
    let emailSent = false;
    try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Gym Builder Contact <noreply@gymbuilder.app>',
        to: ['contact@gymbuilder.app'],
        reply_to: email.trim(),
        subject: `[Contact] ${escapeHtml(subject.trim())}`,
        html: `
          <h2>Mesaj nou prin formularul de contact</h2>
          <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; width: 120px;">Nume</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${escapeHtml(name.trim())}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold;">Email</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;"><a href="mailto:${escapeHtml(email.trim())}">${escapeHtml(email.trim())}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold;">Subiect</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${escapeHtml(subject.trim())}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; vertical-align: top;">Mesaj</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd; white-space: pre-wrap;">${escapeHtml(message.trim())}</td>
            </tr>
          </table>
          <p style="margin-top: 16px; color: #666; font-size: 12px;">
            Trimis de pe gymbuilder.app la ${new Date().toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' })}
          </p>
        `,
      }),
    });

    emailSent = res.ok;
    } catch { console.error('Contact email delivery unavailable'); }
    return await localizedJson({ success: true, requestId: savedMsg.id, emailSent, message: 'Mesajul a fost înregistrat.' });
  } catch (error) {
    console.error('Contact form error:', error);
    return await localizedJson(
      { error: 'Eroare internă. Încearcă din nou.' },
      { status: 500 }
    );
  }
}
