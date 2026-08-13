import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: 'public' }, auth: { persistSession: false } }
    );

    const results: string[] = [];

    // Emails to delete
    const emailsToDelete = [
      'contact@proelitecoach.com',
      'supplier_audit@test.com',
      'testclient_audit@test.com',
      'test-supplier-audit@gymbuilder.test',
      'nasseronlinecoach@gmail.com',
      'nasser.nsy85@gmail.com',
    ];

    // Supplier IDs to delete
    const supplierIdsToDelete = [
      '99242916-25ec-4919-9c63-5823c9d17dae',
      'd80f981a-3d78-45c4-a481-c59fb453e802',
      '6dff1e30-e60a-4bb2-806e-92bd39b30dd3',
      'cdac3ccb-24ea-476e-a3a8-8b74bc726ed6',
      'ba9b91d3-494c-4097-8d0b-73809cb9cc1d',
    ];

    // Contact request IDs to delete (only Aug 4 ones)
    const crIdsToDelete = [
      '79d2ba1a-e308-4391-8b11-75d90f328cd8',
      'dc2a185e-a853-4ceb-b9d5-fe86d378dbd4',
    ];

    // 1. Delete ALL notifications
    const r1 = await supabase.from('notifications').delete().gte('created_at', '2000-01-01');
    results.push(`Notifications: ${r1.error ? 'ERROR: ' + r1.error.message : 'deleted ✓'} (count: ${r1.count})`);

    // 2. Delete contact_requests (Aug 4 only)
    const r2 = await supabase.from('contact_requests').delete().in('id', crIdsToDelete);
    results.push(`Contact requests (Aug 4): ${r2.error ? 'ERROR: ' + r2.error.message : 'deleted ✓'} (count: ${r2.count})`);

    // 3. Delete product
    const r3 = await supabase.from('products').delete().eq('id', '555e17bd-1f71-4831-b962-bd42fc64bcdd');
    results.push(`Product Life Fitness: ${r3.error ? 'ERROR: ' + r3.error.message : 'deleted ✓'} (count: ${r3.count})`);

    // 4. Delete supplier profiles
    for (const sid of supplierIdsToDelete) {
      const r = await supabase.from('supplier_profiles').delete().eq('id', sid);
      results.push(`Supplier ${sid.slice(0,8)}: ${r.error ? 'ERROR: ' + r.error.message : 'deleted ✓'}`);
    }

    // 5. Delete users by email
    for (const email of emailsToDelete) {
      const r = await supabase.from('users').delete().eq('email', email);
      results.push(`User ${email}: ${r.error ? 'ERROR: ' + r.error.message : 'deleted ✓'}`);
    }

    // 6. Delete contact_messages (all)
    const r6 = await supabase.from('contact_messages').delete().gte('created_at', '2000-01-01');
    results.push(`Contact messages: ${r6.error ? 'ERROR: ' + r6.error.message : 'deleted ✓'}`);

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
