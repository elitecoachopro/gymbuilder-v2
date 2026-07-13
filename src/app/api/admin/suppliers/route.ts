import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Verify session token and check admin role
async function verifyAdmin(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;
  if (!sessionToken) return null;

  try {
    const [payloadB64, hmac] = sessionToken.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    
    // Verify HMAC
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret';
    const expectedHmac = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    if (hmac !== expectedHmac) return null;
    
    // Check expiry
    if (Date.now() > payload.exp) return null;

    // Get user and verify admin role
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

// GET: List pending suppliers
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Acces interzis.' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';

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

  return NextResponse.json({ suppliers: suppliers || [] });
}

// PATCH: Approve or reject a supplier
export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Acces interzis.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { supplierId, action } = body;

    if (!supplierId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Parametri invalizi. Trebuie supplierId și action (approve/reject).' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { data, error } = await supabase
      .from('supplier_profiles')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', supplierId)
      .select('id, company_name, status')
      .single();

    if (error) {
      console.error('Admin supplier update error:', error);
      return NextResponse.json(
        { error: 'Eroare la actualizarea statusului.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' 
        ? `Furnizorul "${data.company_name}" a fost aprobat.`
        : `Furnizorul "${data.company_name}" a fost respins.`,
      supplier: data,
    });
  } catch (error) {
    console.error('Admin PATCH error:', error);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
