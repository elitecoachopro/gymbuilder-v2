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
        from: 'GymBuilder <noreply@gymbuilder.app>',
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

function getUserFromSession(): { userId: string } | null {
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
    return { userId: data.userId };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getUserFromSession();

    if (!authUser) {
      return NextResponse.json({ error: 'Neautorizat.' }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, replyMessage } = body;

    if (!requestId || !replyMessage || !replyMessage.trim()) {
      return NextResponse.json({ error: 'ID cerere și mesajul sunt obligatorii.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Verify the supplier owns this contact request
    const { data: supplierProfile } = await supabase
      .from('supplier_profiles')
      .select('id, company_name')
      .eq('user_id', authUser.userId)
      .single();

    if (!supplierProfile) {
      return NextResponse.json({ error: 'Profil furnizor negăsit.' }, { status: 403 });
    }

    // Get the contact request
    const { data: contactRequest } = await supabase
      .from('contact_requests')
      .select('id, client_name, client_email, client_id, supplier_id, product_id, message, status')
      .eq('id', requestId)
      .single();

    if (!contactRequest) {
      return NextResponse.json({ error: 'Cererea nu a fost găsită.' }, { status: 404 });
    }

    if (contactRequest.supplier_id !== supplierProfile.id) {
      return NextResponse.json({ error: 'Nu ai acces la această cerere.' }, { status: 403 });
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

    // Update status to replied
    await supabase
      .from('contact_requests')
      .update({ status: 'replied', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gymbuilder.app';

    // Send email notification to client
    await sendEmail(
      contactRequest.client_email,
      'Ai primit un răspuns pe GymBuilder',
      `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #1a1a1a; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f5c542; font-size: 28px; margin: 0;">GymBuilder</h1>
        </div>
        <div style="background: #2a2a2a; border-radius: 12px; padding: 32px; border: 1px solid #3a3a3a;">
          <h2 style="color: #4ade80; margin-top: 0;">✅ Ai primit un răspuns!</h2>
          <p style="color: #d1d5db; line-height: 1.6;">
            Bună, ${contactRequest.client_name}! Furnizorul <strong style="color: #f5c542;">${supplierProfile.company_name}</strong> a răspuns la cererea ta de ofertă.
          </p>
          ${productName ? `
          <div style="background: #1a1a1a; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
            <p style="color: #9ca3af; margin: 0; font-size: 14px;"><strong style="color: #f5c542;">Produs:</strong> ${productName}</p>
          </div>
          ` : ''}
          <div style="background: #1a1a1a; border-left: 3px solid #4ade80; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">Răspunsul furnizorului:</p>
            <p style="color: #d1d5db; margin: 0; font-size: 14px; white-space: pre-wrap;">${replyMessage}</p>
          </div>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 16px;">
            Poți continua conversația contactând direct furnizorul sau accesând dashboard-ul tău.
          </p>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${appUrl}/client/dashboard" style="display: inline-block; background: #f5c542; color: #1a1a1a; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">
              Vezi în Dashboard
            </a>
          </div>
        </div>
        <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px;">
          © ${new Date().getFullYear()} GymBuilder. Toate drepturile rezervate.
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
        link: '/client/dashboard',
        is_read: false,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reply to contact request error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
