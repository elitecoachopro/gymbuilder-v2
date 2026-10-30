import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { getSessionUser } from '@/lib/session-server';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { z } from 'zod';

const enquiryInput = z.object({
  idempotencyKey: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  phone: z.string().trim().max(30).nullish(),
  message: z.string().trim().min(1).max(5000),
  supplierId: z.string().uuid(),
  productId: z.string().uuid().nullish(),
});

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

async function getUserFromSession(_request?: unknown) { return getSessionUser(); }

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = enquiryInput.safeParse({ ...body, supplierId: body.supplierId || body.supplier_id, productId: body.productId || body.product_id || null });
    if (!parsed.success) return await localizedJson({ error: 'Datele cererii sunt invalide.' }, { status: 400 });
    // Limit repeated contact with the same supplier while allowing a multi-supplier basket.
    const ip = getClientIP(request);
    const rateCheck = await checkRateLimit(`contact-supplier:${ip}:${parsed.data.supplierId}`, { maxRequests: 3, windowMs: 60 * 1000 });
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetTime!);
    }

    const { idempotencyKey, name, email, phone, message, supplierId: resolvedSupplierId, productId: resolvedProductId } = parsed.data;

    const supabase = getSupabase();

    if (idempotencyKey) {
      const { data: existing } = await supabase.from('contact_requests').select('id,client_email,supplier_id').eq('idempotency_key', idempotencyKey).maybeSingle();
      if (existing) return existing.client_email === email && existing.supplier_id === resolvedSupplierId
        ? await localizedJson({ success: true, requestId: existing.id })
        : await localizedJson({ error: 'Identificator de cerere deja folosit.' }, { status: 409 });
    }

    // Get supplier info
    const { data: supplier } = await supabase
      .from('supplier_profiles')
      .select('id, company_name, user_id')
      .eq('id', resolvedSupplierId)
      .eq('status', 'approved')
      .single();

    if (supplier && !supplier.user_id) return await localizedJson({ error: 'Contactează furnizorul direct folosind datele de contact oficiale din profil.' }, { status: 400 });

    // Get supplier user email
    let supplierEmail = null;
    if (supplier?.user_id) {
      const { data: userData } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', supplier.user_id)
        .single();
      supplierEmail = userData?.email;
    }

    if (!supplier) {
      return await localizedJson({ error: 'Furnizor negăsit.' }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gymbuilder.app';

    // Save contact request to database
    if (resolvedProductId) {
      const { data: product } = await supabase.from('products').select('id')
        .eq('id', resolvedProductId).eq('supplier_id', resolvedSupplierId).in('status', ['active', 'featured']).maybeSingle();
      if (!product) return await localizedJson({ error: 'Produsul nu este disponibil la acest furnizor.' }, { status: 400 });
    }

    // Try to get logged-in user's ID to link the contact request
    const session = await getUserFromSession();
    const clientId = session?.userId || null;

    const { data: insertedRequest, error: insertError } = await supabase.from('contact_requests').insert({
      idempotency_key: idempotencyKey,
      client_name: name,
      client_email: email,
      client_phone: phone || null,
      client_id: clientId,
      supplier_id: resolvedSupplierId,
      product_id: resolvedProductId,
      message: message,
      status: 'sent',
    }).select('id').single();
    if (insertError?.code === '23505' && idempotencyKey) {
      const { data: existing } = await supabase.from('contact_requests').select('id').eq('idempotency_key', idempotencyKey).eq('client_email', email).eq('supplier_id', resolvedSupplierId).maybeSingle();
      if (existing) return await localizedJson({ success: true, requestId: existing.id });
    }
    if (insertError || !insertedRequest) return await localizedJson({ error: 'Cererea nu a putut fi salvata. Incearca din nou.' }, { status: 500 });
    const requestId = insertedRequest.id;
    let supplierEmailSent = false;

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
      supplierEmailSent = await sendEmail(
        supplierEmail,
        'Ai o cerere nouă pe Gym Builder',
        `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #1a1a1a; color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f5c542; font-size: 28px; margin: 0;">Gym Builder</h1>
          </div>
          <div style="background: #2a2a2a; border-radius: 12px; padding: 32px; border: 1px solid #3a3a3a;">
            <h2 style="color: #f5c542; margin-top: 0;">📩 Ai o cerere nouă pe Gym Builder</h2>
            <p style="color: #d1d5db; line-height: 1.6;">
              Un client a trimis o cerere de ofertă pe platforma Gym Builder.
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
            © ${new Date().getFullYear()} Gym Builder. Toate drepturile rezervate.
          </p>
        </div>
        `
      );
    }

    // Also send confirmation to the requester
    const confirmationEmailSent = await sendEmail(
      email,
      `Cererea ta a fost trimisă către ${supplier.company_name}`,
      `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #1a1a1a; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f5c542; font-size: 28px; margin: 0;">Gym Builder</h1>
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
          © ${new Date().getFullYear()} Gym Builder. Toate drepturile rezervate.
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
        message: productName ? `Produs solicitat: ${productName}` : (message ? message.substring(0, 100) : 'Cerere nouă'),
        link: `/supplier/dashboard#cereri-${requestId}`,
        is_read: false,
      });
    }

    return await localizedJson({ success: true, requestId, recorded: true, supplierEmailSent, confirmationEmailSent });
  } catch (err) {
    console.error('Contact supplier error:', err);
    return await localizedJson({ error: 'Eroare internă.' }, { status: 500 });
  }
}
