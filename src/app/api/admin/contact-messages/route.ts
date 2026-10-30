import { getErrorMessage } from '@/lib/error-message';
import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { getSessionUser } from '@/lib/session-server';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getUserFromSession(_request?: unknown) { return getSessionUser(); }

async function verifyAdmin(): Promise<boolean> {
  const session = await getUserFromSession();
  if (!session) return false;
  
  // Check role from session token first
  if (session.role === 'admin') return true;
  
  // Fallback: check in database
  const supabase = getSupabase();
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.userId)
    .single();
  
  return data?.role === 'admin';
}

// GET: List all contact messages (admin only)
export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return await localizedJson({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contact messages:', error);
      return await localizedJson({ error: error.message }, { status: 500 });
    }

    return await localizedJson({ messages: data || [] });
  } catch (err) {
    return await localizedJson({ error: getErrorMessage(err) }, { status: 500 });
  }
}

// PATCH: Mark message as read/unread
export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return await localizedJson({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status || !['read', 'unread'].includes(status)) {
      return await localizedJson({ error: 'Invalid request' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id);

    if (error) {
      return await localizedJson({ error: error.message }, { status: 500 });
    }

    return await localizedJson({ success: true });
  } catch (err) {
    return await localizedJson({ error: getErrorMessage(err) }, { status: 500 });
  }
}

// POST: Reply to a contact message
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return await localizedJson({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, reply } = body;

    if (!id || !reply?.trim()) {
      return await localizedJson({ error: 'ID și răspunsul sunt obligatorii' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Get the original message to know recipient email
    const { data: msg, error: fetchError } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !msg) {
      return await localizedJson({ error: 'Mesajul nu a fost găsit' }, { status: 404 });
    }

    // Send reply email via Resend
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return await localizedJson({ error: 'Email service not configured' }, { status: 500 });
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Gym Builder <noreply@gymbuilder.app>',
        to: [msg.email],
        reply_to: 'contact@gymbuilder.app',
        subject: `Re: ${msg.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px; border-radius: 8px 8px 0 0;">
              <h2 style="color: #d4af37; margin: 0;">Gym Builder</h2>
              <p style="color: #ccc; margin: 8px 0 0;">Răspuns la mesajul tău</p>
            </div>
            <div style="padding: 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="color: #333; font-size: 14px; margin-bottom: 8px;"><strong>Bună ${msg.name},</strong></p>
              <div style="background: #f8f9fa; padding: 16px; border-radius: 6px; border-left: 4px solid #d4af37; margin: 16px 0;">
                <p style="color: #333; white-space: pre-wrap; margin: 0;">${reply.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
              </div>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
              <p style="color: #999; font-size: 12px;">Mesajul tău original: "${msg.subject}"</p>
              <p style="color: #999; font-size: 12px; margin-top: 16px;">
                — Echipa Gym Builder<br/>
                <a href="https://www.gymbuilder.app" style="color: #d4af37;">www.gymbuilder.app</a>
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errData = await emailRes.json().catch(() => ({}));
      console.error('Resend error:', errData);
      return await localizedJson({ error: 'Eroare la trimiterea emailului' }, { status: 500 });
    }

    // Update message status to 'replied'
    await supabase
      .from('contact_messages')
      .update({ 
        status: 'replied', 
        admin_reply: reply.trim(),
        replied_at: new Date().toISOString()
      })
      .eq('id', id);

    return await localizedJson({ success: true, message: 'Răspuns trimis cu succes' });
  } catch (err) {
    return await localizedJson({ error: getErrorMessage(err) }, { status: 500 });
  }
}
