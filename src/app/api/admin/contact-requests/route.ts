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
  if (session.role === 'admin') return true;
  const supabase = getSupabase();
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.userId)
    .single();
  return data?.role === 'admin';
}

// GET: List all contact requests (admin only) with supplier info
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();

    // Get all contact_requests with supplier company name
    const { data: requests, error } = await supabase
      .from('contact_requests')
      .select('id, client_name, client_email, client_phone, message, product_id, supplier_id, status, created_at, viewed_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get supplier names for all unique supplier_ids
    const supplierIds = Array.from(new Set((requests || []).map((r: any) => r.supplier_id).filter(Boolean)));
    let supplierMap: Record<string, string> = {};
    if (supplierIds.length > 0) {
      const { data: suppliers } = await supabase
        .from('supplier_profiles')
        .select('id, company_name')
        .in('id', supplierIds);
      if (suppliers) {
        supplierMap = Object.fromEntries(suppliers.map((s: any) => [s.id, s.company_name]));
      }
    }

    // Enrich requests with supplier name
    const enrichedRequests = (requests || []).map((r: any) => ({
      ...r,
      supplier_name: supplierMap[r.supplier_id] || 'Necunoscut',
    }));

    return NextResponse.json({ requests: enrichedRequests });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
