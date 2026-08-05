import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import crypto from 'crypto';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getUserFromSession(): { userId: string; role?: string } | null {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    if (!sessionToken) return null;
    const [payloadB64, signature] = sessionToken.split('.');
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.JWT_SECRET || '';
    const decodedPayload = Buffer.from(payloadB64, 'base64').toString();
    const expected = crypto.createHmac('sha256', secret).update(decodedPayload).digest('hex');
    if (signature !== expected) return null;
    const data = JSON.parse(decodedPayload);
    if (data.exp && data.exp < Date.now()) return null;
    return { userId: data.userId, role: data.role };
  } catch {
    return null;
  }
}

async function verifyAdmin(): Promise<boolean> {
  const session = getUserFromSession();
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
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contact messages:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Mark message as read/unread
export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status || !['read', 'unread'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Reply to a contact message
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, reply } = body;

    if (!id || !reply?.trim()) {
      return NextResponse.json({ error: 'ID și răspunsul sunt obligatorii' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Get the original message to know recipient email
    const { data: msg, error: fetchError } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !msg) {
      return NextResponse.json({ error: 'Mesajul nu a fost găsit' }, { status: 404 });
    }

    // Send reply email via Resend
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'GymBuilder <noreply@gymbuilder.app>',
        to: [msg.email],
        reply_to: 'contact@gymbuilder.app',
        subject: `Re: ${msg.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px; border-radius: 8px 8px 0 0;">
              <h2 style="color: #d4af37; margin: 0;">GymBuilder</h2>
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
                — Echipa GymBuilder<br/>
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
      return NextResponse.json({ error: 'Eroare la trimiterea emailului' }, { status: 500 });
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

    return NextResponse.json({ success: true, message: 'Răspuns trimis cu succes' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
