import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contact@gymbuilder.app';

function getUserFromSession(): { userId: string; email?: string; role?: string } | null {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  if (!sessionToken) return null;
  try {
    const [payloadB64, signature] = sessionToken.split('.');
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.JWT_SECRET || '';
    const decodedPayload = Buffer.from(payloadB64, 'base64').toString();
    const expected = crypto.createHmac('sha256', secret).update(decodedPayload).digest('hex');
    if (signature !== expected) return null;
    const data = JSON.parse(decodedPayload);
    if (data.exp && data.exp < Date.now()) return null;
    return { userId: data.userId, email: data.email, role: data.role };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const { reason } = await request.json().catch(() => ({ reason: '' }));

    // Try to log the deletion request in the database (works even if table doesn't exist)
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabaseAdmin
        .from('account_deletion_requests')
        .insert({
          user_id: user.userId,
          user_email: user.email || 'unknown',
          user_role: user.role || 'unknown',
          reason: reason || null,
          status: 'pending',
        });
    } catch (dbError) {
      console.error('Error logging deletion request (non-blocking):', dbError);
    }

    // Send notification email to admin via Resend
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'GymBuilder <noreply@gymbuilder.app>',
            to: [ADMIN_EMAIL],
            subject: `[GDPR] Cerere ștergere cont - ${user.email || user.userId}`,
            html: `
              <h2>Cerere de ștergere cont (GDPR Art. 17)</h2>
              <p><strong>Email utilizator:</strong> ${user.email || 'N/A'}</p>
              <p><strong>ID utilizator:</strong> ${user.userId}</p>
              <p><strong>Rol:</strong> ${user.role || 'N/A'}</p>
              <p><strong>Motiv:</strong> ${reason || 'Nu a fost specificat'}</p>
              <p><strong>Data cererii:</strong> ${new Date().toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' })}</p>
              <hr />
              <p><em>Conform GDPR Art. 17, această cerere trebuie procesată în maxim 30 de zile.</em></p>
            `,
          }),
        });
      }
    } catch (emailError) {
      console.error('Email notification failed (deletion request still logged):', emailError);
    }

    return NextResponse.json({
      message: 'Cererea de ștergere a fost înregistrată. Vei primi o confirmare pe email în maxim 30 de zile.',
    });
  } catch (error) {
    console.error('Account deletion request error:', error);
    return NextResponse.json({ error: 'Eroare internă' }, { status: 500 });
  }
}
