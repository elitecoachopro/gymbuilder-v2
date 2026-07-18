import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 requests per minute per IP
    const ip = getClientIP(request);
    const allowed = checkRateLimit(`contact:${ip}`, 5, 60000);
    if (!allowed) {
      return rateLimitResponse();
    }

    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validation
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Toate câmpurile sunt obligatorii.' },
        { status: 400 }
      );
    }

    if (name.length > 100 || email.length > 100 || subject.length > 200 || message.length > 5000) {
      return NextResponse.json(
        { error: 'Unul sau mai multe câmpuri depășesc lungimea maximă permisă.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Adresa de email nu este validă.' },
        { status: 400 }
      );
    }

    // Send email via Resend
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY not configured');
      return NextResponse.json(
        { error: 'Serviciul de email nu este configurat.' },
        { status: 500 }
      );
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'GymBuilder Contact <noreply@gymbuilder.app>',
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

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Resend API error:', errorData);
      return NextResponse.json(
        { error: 'Eroare la trimiterea mesajului. Încearcă din nou.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Mesajul a fost trimis cu succes!' });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Eroare internă. Încearcă din nou.' },
      { status: 500 }
    );
  }
}
