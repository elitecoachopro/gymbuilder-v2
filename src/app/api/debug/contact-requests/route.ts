import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== 'gymbuilder-debug-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('contact_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  // Also check Resend emails
  let resendEmails = null;
  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
    });
    if (resendRes.ok) {
      resendEmails = await resendRes.json();
    } else {
      resendEmails = { error: `Resend API returned ${resendRes.status}` };
    }
  } catch (e: any) {
    resendEmails = { error: e.message };
  }

  // Also get the supplier's user email
  let supplierEmail = null;
  if (data && data.length > 0 && data[0].supplier_id) {
    const { data: profile } = await supabase
      .from('supplier_profiles')
      .select('id, company_name, user_id')
      .eq('id', data[0].supplier_id)
      .single();
    if (profile?.user_id) {
      const { data: user } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('id', profile.user_id)
        .single();
      supplierEmail = user;
    }
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contact_requests: data, resend_emails: resendEmails, supplier_user: supplierEmail });
}
