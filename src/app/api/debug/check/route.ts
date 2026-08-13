import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get recent contact_requests (last 10)
    const { data: requests, error: reqError } = await supabase
      .from('contact_requests')
      .select('id, client_name, client_email, supplier_id, product_id, status, created_at, message')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get the supplier profile for the product's supplier
    const { data: supplierProfile } = await supabase
      .from('supplier_profiles')
      .select('id, user_id, company_name, status')
      .eq('id', '99242916-25ec-4919-9c63-5823c9d17dae')
      .single();

    // Get recent notifications for this supplier
    const { data: notifications } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, link, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // Check what the supplier dashboard query would return
    let dashboardRequests = null;
    if (supplierProfile) {
      const { data: dashReqs, error: dashErr } = await supabase
        .from('contact_requests')
        .select('id, client_name, client_email, client_phone, message, product_id, status, created_at, viewed_at')
        .eq('supplier_id', supplierProfile.id)
        .order('created_at', { ascending: false })
        .limit(50);
      dashboardRequests = { data: dashReqs, error: dashErr?.message };
    }

    // Check what user/supplier is associated with contact@gymbuilder.app
    const { data: userByEmail } = await supabase
      .from('users')
      .select('id, email, role, full_name')
      .eq('email', 'contact@gymbuilder.app')
      .single();

    let supplierForUser = null;
    if (userByEmail) {
      const { data: sp } = await supabase
        .from('supplier_profiles')
        .select('id, company_name, status, user_id')
        .eq('user_id', userByEmail.id)
        .single();
      supplierForUser = sp;
    }

    // Also list ALL supplier profiles
    const { data: allSuppliers } = await supabase
      .from('supplier_profiles')
      .select('id, company_name, user_id, status')
      .limit(10);

    return NextResponse.json({
      contact_requests: requests,
      reqError: reqError?.message,
      supplierProfile,
      notifications,
      dashboardRequests,
      userByEmail,
      supplierForUser,
      allSuppliers,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
