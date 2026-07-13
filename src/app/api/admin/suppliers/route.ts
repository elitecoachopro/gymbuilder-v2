import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Send email via Resend
async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }

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

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Email send error:', err);
    return false;
  }
}

// Verify session token and check admin role
async function verifyAdmin(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;
  if (!sessionToken) return null;

  try {
    const [payloadB64, hmac] = sessionToken.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret';
    const expectedHmac = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    if (hmac !== expectedHmac) return null;
    
    if (Date.now() > payload.exp) return null;

    const supabase = getSupabaseAdmin();
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', payload.userId)
      .single();

    if (!user || user.role !== 'admin') return null;
    return user;
  } catch {
    return null;
  }
}

// GET: List suppliers by status + count pending
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Acces interzis.' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';

  // Get suppliers with the requested status
  const { data: suppliers, error } = await supabase
    .from('supplier_profiles')
    .select(`
      id, user_id, company_name, country, city, website, phone, description, status, plan, created_at,
      users!inner(full_name, email)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Admin suppliers fetch error:', error);
    return NextResponse.json({ error: 'Eroare la încărcarea furnizorilor.' }, { status: 500 });
  }

  // Get pending count for badge
  const { count: pendingCount } = await supabase
    .from('supplier_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  return NextResponse.json({ 
    suppliers: suppliers || [],
    pendingCount: pendingCount || 0,
  });
}

// PATCH: Approve or reject a supplier + send email notification
export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Acces interzis.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { supplierId, action, reason } = body;

    if (!supplierId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Parametri invalizi. Trebuie supplierId și action (approve/reject).' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Get supplier info with user email before updating
    const { data: supplierInfo } = await supabase
      .from('supplier_profiles')
      .select(`
        id, company_name, user_id,
        users!inner(full_name, email)
      `)
      .eq('id', supplierId)
      .single();

    if (!supplierInfo) {
      return NextResponse.json({ error: 'Furnizor negăsit.' }, { status: 404 });
    }

    // Update status
    const { data, error } = await supabase
      .from('supplier_profiles')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', supplierId)
      .select('id, company_name, status')
      .single();

    if (error) {
      console.error('Admin supplier update error:', error);
      return NextResponse.json({ error: 'Eroare la actualizarea statusului.' }, { status: 500 });
    }

    // Send email notification
    const userEmail = (supplierInfo.users as any)?.email;
    const userName = (supplierInfo.users as any)?.full_name || 'Furnizor';
    const companyName = supplierInfo.company_name;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gymbuilder.app';

    if (userEmail) {
      if (action === 'approve') {
        await sendEmail(
          userEmail,
          'Contul tău GymBuilder a fost aprobat',
          `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #1a1a1a; color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f5c542; font-size: 28px; margin: 0;">GymBuilder</h1>
            </div>
            <div style="background: #2a2a2a; border-radius: 12px; padding: 32px; border: 1px solid #3a3a3a;">
              <h2 style="color: #4ade80; margin-top: 0;">✅ Felicitări, ${userName}!</h2>
              <p style="color: #d1d5db; line-height: 1.6;">
                Contul tău de furnizor <strong style="color: #f5c542;">${companyName}</strong> a fost aprobat cu succes pe platforma GymBuilder.
              </p>
              <p style="color: #d1d5db; line-height: 1.6;">
                Acum poți:
              </p>
              <ul style="color: #d1d5db; line-height: 2;">
                <li>Adăuga produse și echipamente pe platformă</li>
                <li>Primi cereri de ofertă de la clienți</li>
                <li>Gestiona profilul tău de furnizor</li>
              </ul>
              <div style="text-align: center; margin-top: 24px;">
                <a href="${appUrl}/login" style="display: inline-block; background: #f5c542; color: #1a1a1a; font-weight: bold; padding: 14px 28px; border-radius: 8px; text-decoration: none;">
                  Accesează Dashboard-ul
                </a>
              </div>
            </div>
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px;">
              © ${new Date().getFullYear()} GymBuilder. Toate drepturile rezervate.
            </p>
          </div>
          `
        );
      } else {
        await sendEmail(
          userEmail,
          'Cererea ta a fost respinsă',
          `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #1a1a1a; color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f5c542; font-size: 28px; margin: 0;">GymBuilder</h1>
            </div>
            <div style="background: #2a2a2a; border-radius: 12px; padding: 32px; border: 1px solid #3a3a3a;">
              <h2 style="color: #f87171; margin-top: 0;">Cererea ta a fost respinsă</h2>
              <p style="color: #d1d5db; line-height: 1.6;">
                Bună, ${userName},
              </p>
              <p style="color: #d1d5db; line-height: 1.6;">
                Din păcate, cererea de înregistrare pentru compania <strong style="color: #f5c542;">${companyName}</strong> nu a fost aprobată.
              </p>
              ${reason ? `
              <div style="background: #1a1a1a; border-left: 3px solid #f87171; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                <p style="color: #9ca3af; margin: 0; font-size: 14px;"><strong>Motiv:</strong> ${reason}</p>
              </div>
              ` : ''}
              <p style="color: #d1d5db; line-height: 1.6;">
                Dacă consideri că este o eroare sau dorești să trimiți informații suplimentare, te rugăm să ne contactezi la <a href="mailto:contact@gymbuilder.app" style="color: #f5c542;">contact@gymbuilder.app</a>.
              </p>
              <p style="color: #d1d5db; line-height: 1.6;">
                Poți oricând să te reînregistrezi cu informații actualizate.
              </p>
              <div style="text-align: center; margin-top: 24px;">
                <a href="${appUrl}/register/supplier" style="display: inline-block; background: #f5c542; color: #1a1a1a; font-weight: bold; padding: 14px 28px; border-radius: 8px; text-decoration: none;">
                  Înregistrează-te din nou
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
    }

    // Get updated pending count
    const { count: pendingCount } = await supabase
      .from('supplier_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    return NextResponse.json({
      success: true,
      message: action === 'approve' 
        ? `Furnizorul "${data.company_name}" a fost aprobat. Email trimis.`
        : `Furnizorul "${data.company_name}" a fost respins. Email trimis.`,
      supplier: data,
      pendingCount: pendingCount || 0,
      emailSent: !!userEmail,
    });
  } catch (error) {
    console.error('Admin PATCH error:', error);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
