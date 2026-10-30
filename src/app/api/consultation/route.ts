import { z } from 'zod';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Gym Builder <noreply@gymbuilder.app>',
        to: [to],
        subject,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Simple sanitize to prevent XSS
function sanitize(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export async function POST(request: NextRequest) {
  try {
    const quota = await checkRateLimit(`consultation:${getClientIP(request)}`, { maxRequests: 5, windowMs: 60000 });
    if (!quota.allowed) return rateLimitResponse(quota.resetTime);
    const parsed = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(254), phone: z.string().trim().min(3).max(30), businessStage: z.enum(['idee', 'în pregătire', 'deja deschis']), budget: z.string().max(100).optional(), message: z.string().max(5000).optional() }).safeParse(await request.json());
    if (!parsed.success) return await localizedJson({ error: 'Datele cererii sunt invalide.' }, { status: 400 });
    const { name, email, phone, businessStage, budget, message } = parsed.data;

    const supabase = getSupabase();

    // Save to consultation_requests table
    const { error: dbError } = await supabase.from('consultation_requests').insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || null,
      business_stage: businessStage,
      message: `Buget estimat: ${budget || 'Nespecificat'}\n\n${message || ''}`.trim(),
      status: 'new',
    });

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return await localizedJson(
        { error: 'Eroare la salvarea cererii. Te rugăm să încerci din nou.' },
        { status: 500 }
      );
    }

    // Sanitize for email HTML
    const safeName = sanitize(name);
    const safeEmail = sanitize(email);
    const safePhone = sanitize(phone || '');
    const safeStage = sanitize(businessStage);
    const safeBudget = sanitize(budget || 'Nespecificat');
    const safeMessage = sanitize(message || 'Fără mesaj suplimentar');

    // Email 1: Send to contact@gymbuilder.app with all details
    await sendEmail(
      'contact@gymbuilder.app',
      `Cerere consultanță nouă de la ${safeName}`,
      `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #1a1a1a; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f5c542; font-size: 28px; margin: 0;">Gym Builder</h1>
        </div>
        <div style="background: #2a2a2a; border-radius: 12px; padding: 32px; border: 1px solid #3a3a3a;">
          <h2 style="color: #f5c542; margin-top: 0;">📋 Cerere Consultanță Nouă</h2>
          <p style="color: #d1d5db; line-height: 1.6;">
            O cerere de consultanță a fost primită prin formularul de pe site.
          </p>
          <div style="background: #1a1a1a; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="color: #9ca3af; margin: 8px 0; font-size: 14px;"><strong style="color: #f5c542;">Nume:</strong> ${safeName}</p>
            <p style="color: #9ca3af; margin: 8px 0; font-size: 14px;"><strong style="color: #f5c542;">Email:</strong> ${safeEmail}</p>
            <p style="color: #9ca3af; margin: 8px 0; font-size: 14px;"><strong style="color: #f5c542;">Telefon:</strong> ${safePhone}</p>
            <p style="color: #9ca3af; margin: 8px 0; font-size: 14px;"><strong style="color: #f5c542;">Stadiul afacerii:</strong> ${safeStage}</p>
            <p style="color: #9ca3af; margin: 8px 0; font-size: 14px;"><strong style="color: #f5c542;">Buget estimat:</strong> ${safeBudget}</p>
          </div>
          <div style="background: #1a1a1a; border-left: 3px solid #f5c542; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase;">Mesaj:</p>
            <p style="color: #d1d5db; margin: 0; font-size: 14px; white-space: pre-wrap;">${safeMessage}</p>
          </div>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 16px;">
            Răspunde direct la <a href="mailto:${safeEmail}" style="color: #f5c542;">${safeEmail}</a> sau sună la ${safePhone}.
          </p>
        </div>
        <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px;">
          © ${new Date().getFullYear()} Gym Builder. Toate drepturile rezervate.
        </p>
      </div>
      `
    );

    // Email 2: Confirmation to client
    const emailSent = await sendEmail(
      email,
      'Cererea ta de consultanță a fost primită',
      `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #1a1a1a; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f5c542; font-size: 28px; margin: 0;">Gym Builder</h1>
        </div>
        <div style="background: #2a2a2a; border-radius: 12px; padding: 32px; border: 1px solid #3a3a3a;">
          <h2 style="color: #4ade80; margin-top: 0;">✅ Cerere primită cu succes!</h2>
          <p style="color: #d1d5db; line-height: 1.6;">
            Bună, ${safeName}! Cererea ta de consultanță a fost înregistrată cu succes.
          </p>
          <p style="color: #d1d5db; line-height: 1.6;">
            Echipa noastră de experți te va contacta în maxim <strong style="color: #f5c542;">24 de ore</strong> pentru a programa sesiunea de consultanță.
          </p>
          <div style="background: #1a1a1a; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="color: #f5c542; font-weight: bold; margin: 0 0 10px 0;">Rezumatul cererii:</p>
            <p style="color: #9ca3af; margin: 4px 0; font-size: 14px;">📌 Stadiu: ${safeStage}</p>
            <p style="color: #9ca3af; margin: 4px 0; font-size: 14px;">💰 Buget: ${safeBudget}</p>
            <p style="color: #9ca3af; margin: 4px 0; font-size: 14px;">💲 Preț consultanță: €99/sesiune</p>
          </div>
          <p style="color: #d1d5db; line-height: 1.6; font-size: 14px;">
            Sesiunea include: consultanță video 60 min, plan de echipare personalizat (PDF), 
            lista de echipamente recomandate cu prețuri, și follow-up gratuit 7 zile.
          </p>
          <div style="text-align: center; margin-top: 24px;">
            <a href="https://gymbuilder.app/products" style="display: inline-block; background: #f5c542; color: #1a1a1a; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">
              Explorează Echipamente
            </a>
          </div>
        </div>
        <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px;">
          © ${new Date().getFullYear()} Gym Builder. Toate drepturile rezervate.
        </p>
      </div>
      `
    );

    return await localizedJson({ success: true, emailSent });
  } catch (err) {
    console.error('Consultation request error:', err);
    return await localizedJson(
      { error: 'Eroare internă. Te rugăm să încerci din nou.' },
      { status: 500 }
    );
  }
}
