import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message, supplierId, supplier_id } = body;
    const resolvedSupplierId = supplierId || supplier_id;

    if (!name || !email || !message || !resolvedSupplierId) {
      return NextResponse.json({ error: 'Câmpuri obligatorii lipsă.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Get supplier info
    const { data: supplier } = await supabase
      .from('supplier_profiles')
      .select('id, company_name, user_id')
      .eq('id', resolvedSupplierId)
      .single();

    // Get supplier user email
    let supplierEmail = null;
    if (supplier) {
      const { data: userData } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', supplier.user_id)
        .single();
      supplierEmail = userData?.email;
    }

    if (!supplier) {
      return NextResponse.json({ error: 'Furnizor negăsit.' }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gymbuilder.app';

    // Save contact request to database
    const { productId, product_id: productIdAlt } = body;
    const resolvedProductId = productId || productIdAlt || null;
    await supabase.from('contact_requests').insert({
      client_name: name,
      client_email: email,
      client_phone: phone || null,
      supplier_id: resolvedSupplierId,
      product_id: resolvedProductId,
      message: message,
      status: 'sent',
    });

    // Get product info if available
    let productName = '';
    let productCategory = '';
    if (resolvedProductId) {
      const { data: productData } = await supabase
        .from('products')
        .select('name, category')
        .eq('id', resolvedProductId)
        .single();
      if (productData) {
        productName = productData.name;
        productCategory = productData.category || '';
      }
    }

    // Send email to supplier
    if (supplierEmail) {
      await sendEmail(
        supplierEmail,
        'Ai o cerere nouă pe GymBuilder',
        `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #1a1a1a; color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f5c542; font-size: 28px; margin: 0;">GymBuilder</h1>
          </div>
          <div style="background: #2a2a2a; border-radius: 12px; padding: 32px; border: 1px solid #3a3a3a;">
            <h2 style="color: #f5c542; margin-top: 0;">📩 Ai o cerere nouă pe GymBuilder</h2>
            <p style="color: #d1d5db; line-height: 1.6;">
              Un client a trimis o cerere de ofertă pe platforma GymBuilder.
            </p>
            <div style="background: #1a1a1a; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="color: #9ca3af; margin: 4px 0; font-size: 14px;"><strong style="color: #f5c542;">Client:</strong> ${escapeHtml(name)}</p>
              <p style="color: #9ca3af; margin: 4px 0; font-size: 14px;"><strong style="color: #f5c542;">Email:</strong> ${escapeHtml(email)}</p>
              ${phone ? `<p style="color: #9ca3af; margin: 4px 0; font-size: 14px;"><strong style="color: #f5c542;">Telefon:</strong> ${escapeHtml(phone)}</p>` : ''}
              ${productName ? `<p style="color: #9ca3af; margin: 4px 0; font-size: 14px;"><strong style="color: #f5c542;">Produs solicitat:</strong> ${escapeHtml(productName)}${productCategory ? ` (${escapeHtml(productCategory)})` : ''}</p>` : ''}
            </div>
            ${message ? `
            <div style="background: #1a1a1a; border-left: 3px solid #f5c542; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">Mesajul clientului:</p>
              <p style="color: #d1d5db; margin: 0; font-size: 14px; white-space: pre-wrap;">${escapeHtml(message)}</p>
            </div>
            ` : ''}
            <p style="color: #9ca3af; font-size: 13px; margin-top: 16px;">
              Răspunde direct la <a href="mailto:${escapeHtml(email)}" style="color: #f5c542;">${escapeHtml(email)}</a> sau accesează dashboard-ul pentru a vedea toate cererile.
            </p>
            <div style="text-align: center; margin-top: 24px;">
              <a href="${appUrl}/supplier/dashboard#cereri" style="display: inline-block; background: #f5c542; color: #1a1a1a; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">
                Vezi Cererea în Dashboard
              </a>
            </div>
          </div>
          <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px;">
            © ${new Date().getFullYear()} GymBuilder. Toate drepturile rezervate.
          </p>
        </div>
        `
      );
    }

    // Also send confirmation to the requester
    await sendEmail(
      email,
      `Cererea ta a fost trimisă către ${supplier.company_name}`,
      `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #1a1a1a; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f5c542; font-size: 28px; margin: 0;">GymBuilder</h1>
        </div>
        <div style="background: #2a2a2a; border-radius: 12px; padding: 32px; border: 1px solid #3a3a3a;">
          <h2 style="color: #4ade80; margin-top: 0;">✅ Cerere trimisă cu succes!</h2>
          <p style="color: #d1d5db; line-height: 1.6;">
            Bună, ${escapeHtml(name)}! Cererea ta de ofertă a fost trimisă către <strong style="color: #f5c542;">${escapeHtml(supplier.company_name)}</strong>.
          </p>
          <p style="color: #d1d5db; line-height: 1.6;">
            Furnizorul va primi notificarea și te va contacta la adresa ${escapeHtml(email)} în cel mai scurt timp posibil.
          </p>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${appUrl}/suppliers" style="display: inline-block; background: #f5c542; color: #1a1a1a; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">
              Explorează alți furnizori
            </a>
          </div>
        </div>
        <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px;">
          © ${new Date().getFullYear()} GymBuilder. Toate drepturile rezervate.
        </p>
      </div>
      `
    );

    // Create in-app notification for supplier
    if (supplier?.user_id) {
      await supabase.from('notifications').insert({
        user_id: supplier.user_id,
        type: 'new_request',
        title: `Cerere nouă de la ${name}`,
        message: productName ? `Produs solicitat: ${productName}` : (message ? message.substring(0, 100) : null),
        link: '/supplier/dashboard#cereri',
        is_read: false,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contact supplier error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
