import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
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
        from: 'Gym Builder <contact@gymbuilder.app>',
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

async function getUserFromSession(_request?: unknown) { return getSessionUser(); }

export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromSession();

    if (!authUser) {
      return await localizedJson({ error: 'Neautorizat.' }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, replyMessage } = body;

    if (typeof requestId !== 'string' || typeof replyMessage !== 'string' || !replyMessage.trim() || replyMessage.length > 5000) {
      return await localizedJson({ error: 'ID cerere și mesajul sunt obligatorii.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Verify the supplier owns this contact request
    const { data: supplierProfile } = await supabase
      .from('supplier_profiles')
      .select('id, company_name')
      .eq('user_id', authUser.userId)
      .single();

    if (!supplierProfile) {
      return await localizedJson({ error: 'Profil furnizor negăsit.' }, { status: 403 });
    }

    // Get the contact request
    const { data: contactRequest } = await supabase
      .from('contact_requests')
      .select('id, client_name, client_email, client_id, supplier_id, product_id, message, status')
      .eq('id', requestId)
      .single();

    if (!contactRequest) {
      return await localizedJson({ error: 'Cererea nu a fost găsită.' }, { status: 404 });
    }

    if (contactRequest.supplier_id !== supplierProfile.id) {
      return await localizedJson({ error: 'Nu ai acces la această cerere.' }, { status: 403 });
    }

    // Get product info if available
    let productName = '';
    if (contactRequest.product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('id', contactRequest.product_id)
        .single();
      if (product) productName = product.name;
    }

    // Persist reply and update request status in one transaction.
    const { error: replyError } = await supabase.rpc('send_request_message', {
      p_request_id: requestId, p_user_id: authUser.id, p_content: replyMessage.trim(),
    });
    if (replyError) return await localizedJson({ error: 'Raspunsul nu a putut fi salvat.' }, { status: 500 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gymbuilder.app';

    // Send email notification to client
    const emailSent = await sendEmail(
      contactRequest.client_email,
      'Ai primit un răspuns pe Gym Builder',
      `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #1a1a1a; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f5c542; font-size: 28px; margin: 0;">Gym Builder</h1>
        </div>
        <div style="background: #2a2a2a; border-radius: 12px; padding: 32px; border: 1px solid #3a3a3a;">
          <h2 style="color: #4ade80; margin-top: 0;">✅ Ai primit un răspuns!</h2>
          <p style="color: #d1d5db; line-height: 1.6;">
            Bună, ${escapeHtml(contactRequest.client_name)}! Furnizorul <strong style="color: #f5c542;">${escapeHtml(supplierProfile.company_name)}</strong> a răspuns la cererea ta de ofertă.
          </p>
          ${productName ? `
          <div style="background: #1a1a1a; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
            <p style="color: #9ca3af; margin: 0; font-size: 14px;"><strong style="color: #f5c542;">Produs:</strong> ${escapeHtml(productName)}</p>
          </div>
          ` : ''}
          <div style="background: #1a1a1a; border-left: 3px solid #4ade80; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">Răspunsul furnizorului:</p>
            <p style="color: #d1d5db; margin: 0; font-size: 14px; white-space: pre-wrap;">${escapeHtml(replyMessage)}</p>
          </div>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 16px;">
            Poți continua conversația contactând direct furnizorul sau accesând dashboard-ul tău.
          </p>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${appUrl}/client/dashboard?chat=${encodeURIComponent(requestId)}#cereri" style="display: inline-block; background: #f5c542; color: #1a1a1a; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">
              Vezi în Dashboard
            </a>
          </div>
        </div>
        <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px;">
          © ${new Date().getFullYear()} Gym Builder. Toate drepturile rezervate.
        </p>
      </div>
      `
    );

    // Create in-app notification for client
    if (contactRequest.client_id) {
      await supabase.from('notifications').insert({
        user_id: contactRequest.client_id,
        type: 'reply_received',
        title: `Răspuns de la ${supplierProfile.company_name}`,
        message: productName ? `Produs: ${productName}` : replyMessage.substring(0, 100),
        link: `/client/dashboard?chat=${encodeURIComponent(requestId)}#cereri`,
        is_read: false,
      });
    }

    return await localizedJson({ success: true, recorded: true, emailSent });
  } catch (err) {
    console.error('Reply to contact request error:', err);
    return await localizedJson({ error: 'Eroare internă.' }, { status: 500 });
  }
}
