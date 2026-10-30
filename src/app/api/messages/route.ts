import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { getSessionUser } from '@/lib/session-server';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Escape HTML for safe insertion into email templates
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

// GET - Fetch messages for a specific contact request
export async function GET(request: NextRequest) {
  const user = await getUserFromSession();
  if (!user) {
    return await localizedJson({ error: 'Neautorizat' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get('request_id');

  if (!requestId) {
    return await localizedJson({ error: 'request_id obligatoriu' }, { status: 400 });
  }

  const supabase = getSupabase();

  // Verify user has access to this request (either as client or supplier)
  const { data: contactRequest } = await supabase
    .from('contact_requests')
    .select('id, client_id, supplier_id')
    .eq('id', requestId)
    .single();

  if (!contactRequest) {
    return await localizedJson({ error: 'Cererea nu a fost găsită' }, { status: 404 });
  }

  // Check if user is the client
  const isClient = contactRequest.client_id === user.userId;

  // Check if user is the supplier
  let isSupplier = false;
  if (!isClient) {
    const { data: supplierProfile } = await supabase
      .from('supplier_profiles')
      .select('id')
      .eq('user_id', user.userId)
      .single();
    if (supplierProfile && supplierProfile.id === contactRequest.supplier_id) {
      isSupplier = true;
    }
  }

  if (!isClient && !isSupplier) {
    return await localizedJson({ error: 'Nu ai acces la această conversație' }, { status: 403 });
  }

  // Fetch messages
  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, sender_type, sender_name, content, created_at')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true });

  if (error) {
    return await localizedJson({ error: 'Eroare la încărcarea mesajelor' }, { status: 500 });
  }

  return await localizedJson({
    messages: messages || [],
    userRole: isClient ? 'client' : 'supplier',
  });
}

// POST - Send a new message in a contact request conversation
export async function POST(request: NextRequest) {
  const user = await getUserFromSession();
  if (!user) {
    return await localizedJson({ error: 'Neautorizat' }, { status: 401 });
  }

  const body = await request.json();
  const { request_id, content } = body;

  if (typeof request_id !== 'string' || typeof content !== 'string' || !content.trim() || content.length > 5000) {
    return await localizedJson({ error: 'request_id și content obligatorii' }, { status: 400 });
  }

  // Sanitize content before saving
  const sanitizedContent = content.trim();
  if (!sanitizedContent) {
    return await localizedJson({ error: 'Conținutul mesajului este invalid' }, { status: 400 });
  }

  const supabase = getSupabase();

  // Get the contact request with details
  const { data: contactRequest } = await supabase
    .from('contact_requests')
    .select('id, client_id, client_name, client_email, supplier_id, product_id, message')
    .eq('id', request_id)
    .single();

  if (!contactRequest) {
    return await localizedJson({ error: 'Cererea nu a fost găsită' }, { status: 404 });
  }

  // Determine sender role and verify access
  const isClient = contactRequest.client_id === user.userId;
  let isSupplier = false;
  let supplierProfile: Pick<Database['public']['Tables']['supplier_profiles']['Row'], 'id' | 'company_name' | 'user_id'> | null = null;

  if (!isClient) {
    const { data: sp } = await supabase
      .from('supplier_profiles')
      .select('id, company_name, user_id')
      .eq('user_id', user.userId)
      .single();
    if (sp && sp.id === contactRequest.supplier_id) {
      isSupplier = true;
      supplierProfile = sp;
    }
  }

  if (!isClient && !isSupplier) {
    return await localizedJson({ error: 'Nu ai acces la această conversație' }, { status: 403 });
  }

  // Get sender info
  let senderName = '';

  if (isClient) {
    senderName = contactRequest.client_name;
    // Get the current sender name from users
    const { data: userData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.userId)
      .single();
    if (userData) {
      senderName = userData.full_name || contactRequest.client_name;
    }
  } else {
    senderName = supplierProfile?.company_name || user.full_name;
  }

  // Insert message
  const { data: newMessage, error } = await supabase
    .rpc('send_request_message', { p_request_id: request_id, p_user_id: user.id, p_content: sanitizedContent })
    .select('id, sender_type, sender_name, content, created_at')
    .single();

  if (error) {
    console.error('Message insert error:', error);
    return await localizedJson({ error: 'Eroare la trimiterea mesajului' }, { status: 500 });
  }

  // Get product name if available
  let productName = '';
  if (contactRequest.product_id) {
    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', contactRequest.product_id)
      .single();
    if (product) productName = product.name;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gymbuilder.app';

  // Send notifications to the OTHER party
  if (isClient) {
    // Notify supplier
    const { data: supplierData } = await supabase
      .from('supplier_profiles')
      .select('user_id, company_name')
      .eq('id', contactRequest.supplier_id)
      .single();

    if (supplierData?.user_id) {
      // In-app notification
      await supabase.from('notifications').insert({
        user_id: supplierData.user_id,
        type: 'new_message',
        title: `Mesaj nou de la ${senderName}`,
        message: productName ? `Produs: ${productName} — "${sanitizedContent.substring(0, 80)}"` : sanitizedContent.substring(0, 100),
        link: `/supplier/dashboard?chat=${request_id}#cereri`,
        is_read: false,
      });

      // Email notification to supplier
      const { data: supplierUser } = await supabase
        .from('users')
        .select('email')
        .eq('id', supplierData.user_id)
        .single();

      if (supplierUser) {
        await sendEmail(
          supplierUser.email,
          `Mesaj nou pe Gym Builder de la ${senderName}`,
          `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #1a1a1a; color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f5c542; font-size: 28px; margin: 0;">Gym Builder</h1>
            </div>
            <div style="background: #2a2a2a; border-radius: 12px; padding: 32px; border: 1px solid #3a3a3a;">
              <h2 style="color: #60a5fa; margin-top: 0;">💬 Mesaj nou!</h2>
              <p style="color: #d1d5db; line-height: 1.6;">
                <strong style="color: #f5c542;">${escapeHtml(senderName)}</strong> ți-a trimis un mesaj${productName ? ` referitor la produsul <strong>${escapeHtml(productName)}</strong>` : ''}.
              </p>
              <div style="background: #1a1a1a; border-left: 3px solid #60a5fa; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                <p style="color: #d1d5db; margin: 0; font-size: 14px; white-space: pre-wrap;">${escapeHtml(sanitizedContent)}</p>
              </div>
              <div style="text-align: center; margin-top: 24px;">
                <a href="${appUrl}/supplier/dashboard?chat=${request_id}#cereri" style="display: inline-block; background: #f5c542; color: #1a1a1a; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">
                  Răspunde pe Gym Builder
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
    }
  } else {
    // Notify client
    if (contactRequest.client_id) {
      // In-app notification
      await supabase.from('notifications').insert({
        user_id: contactRequest.client_id,
        type: 'new_message',
        title: `Mesaj nou de la ${senderName}`,
        message: productName ? `Produs: ${productName} — "${sanitizedContent.substring(0, 80)}"` : sanitizedContent.substring(0, 100),
        link: `/client/dashboard?chat=${request_id}#cereri`,
        is_read: false,
      });

      // Email notification to client
      await sendEmail(
        contactRequest.client_email,
        `Mesaj nou pe Gym Builder de la ${senderName}`,
        `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #1a1a1a; color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f5c542; font-size: 28px; margin: 0;">Gym Builder</h1>
          </div>
          <div style="background: #2a2a2a; border-radius: 12px; padding: 32px; border: 1px solid #3a3a3a;">
            <h2 style="color: #60a5fa; margin-top: 0;">💬 Mesaj nou!</h2>
            <p style="color: #d1d5db; line-height: 1.6;">
              <strong style="color: #f5c542;">${escapeHtml(senderName)}</strong> ți-a trimis un mesaj${productName ? ` referitor la produsul <strong>${escapeHtml(productName)}</strong>` : ''}.
            </p>
            <div style="background: #1a1a1a; border-left: 3px solid #60a5fa; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
              <p style="color: #d1d5db; margin: 0; font-size: 14px; white-space: pre-wrap;">${escapeHtml(sanitizedContent)}</p>
            </div>
            <div style="text-align: center; margin-top: 24px;">
              <a href="${appUrl}/client/dashboard?chat=${request_id}#cereri" style="display: inline-block; background: #f5c542; color: #1a1a1a; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">
                Răspunde pe Gym Builder
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
  }

  return await localizedJson({ message: newMessage });
}
