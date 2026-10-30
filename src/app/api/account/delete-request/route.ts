import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { getSessionUser } from '@/lib/session-server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeString } from '@/lib/sanitize';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contact@gymbuilder.app';

async function getUserFromSession(_request?: unknown) { return getSessionUser(); }

export async function POST(request: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return await localizedJson({ error: 'Neautorizat' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const reason = body?.reason ?? '';
    if (!body || typeof reason !== 'string' || reason.length > 2000) {
      return await localizedJson({ error: 'Motiv invalid (maxim 2000 de caractere).' }, { status: 400 });
    }

    // Success requires a durable request, even when email delivery is unavailable.
      const supabaseAdmin = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { error: persistenceError } = await supabaseAdmin
        .from('account_deletion_requests')
        .insert({
          user_id: user.userId,
          user_email: user.email,
          user_role: user.role,
          reason: reason.trim() || null,
          status: 'pending',
        });
    if (persistenceError) {
      return await localizedJson({ error: 'Cererea nu a putut fi inregistrata. Incearca din nou.' }, { status: 500 });
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
            from: 'Gym Builder <noreply@gymbuilder.app>',
            to: [ADMIN_EMAIL],
            subject: `[GDPR] Cerere ștergere cont - ${user.email || user.userId}`,
            html: `
              <h2>Cerere de ștergere cont (GDPR Art. 17)</h2>
              <p><strong>Email utilizator:</strong> ${user.email || 'N/A'}</p>
              <p><strong>ID utilizator:</strong> ${user.userId}</p>
              <p><strong>Rol:</strong> ${user.role || 'N/A'}</p>
              <p><strong>Motiv:</strong> ${sanitizeString(reason) || 'Nu a fost specificat'}</p>
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

    return await localizedJson({
      message: 'Cererea de ștergere a fost înregistrată pentru procesare de către echipă.',
    });
  } catch (error) {
    console.error('Account deletion request error:', error);
    return await localizedJson({ error: 'Eroare internă' }, { status: 500 });
  }
}
