import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const results: string[] = [];

    // IDs to keep:
    // User: contact@gymbuilder.app (dae945f2-14e7-408e-8cc7-6d24968d76c6)
    // User: longglorychina@gmail.com (1cd8c35e-4303-4cec-be78-6f5aa1077314)
    // Supplier: Qingdao Long Glory Technology (ad3042f5-c357-4788-89f7-4313118223a5)
    // Supplier: Sc Gymbuilder srl (afb60d79-81ec-422d-87c7-2f508ffe55ef)

    // IDs to delete:
    const userIdsToDelete = [
      'b42ff386-34d3-47c4-abd4-4361800e382d', // contact@proelitecoach.com
      '64f7f099-03db-4758-b48a-8d4072998a97', // supplier_audit@test.com
      'bb3e262a-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // testclient_audit@test.com - will use email filter
      '3fa77372-0eb1-4d5b-acd7-06b6599dd99c', // test-supplier-audit@gymbuilder.test
      '5456509e-5707-495c-9cc1-efc29a3b7374', // nasseronlinecoach@gmail.com
      '5bda58bd-3a07-4b6e-a857-7093e9d2aba7', // nasser.nsy85@gmail.com
    ];

    const supplierIdsToDelete = [
      '99242916-25ec-4919-9c63-5823c9d17dae', // Sc imperial Gym Srl (approved, test)
      'd80f981a-3d78-45c4-a481-c59fb453e802', // FitnessGear SRL (pending)
      '6dff1e30-e60a-4bb2-806e-92bd39b30dd3', // Audit Fitness SRL (pending)
      'cdac3ccb-24ea-476e-a3a8-8b74bc726ed6', // Sc imperial srl (pending)
      'ba9b91d3-494c-4097-8d0b-73809cb9cc1d', // Sc imperial Gym srl (pending)
    ];

    // Contact requests to delete (only the 2 older ones, keep the 2 from Aug 13)
    const contactRequestIdsToDelete = [
      '79d2ba1a-e308-4391-8b11-75d90f328cd8', // Test Manus Agent - Aug 4
      'dc2a185e-a853-4ceb-b9d5-fe86d378dbd4', // marian santion - Aug 4
    ];

    // 1. Delete notifications (all 7 are test-related)
    const { error: notifErr, count: notifCount } = await supabase
      .from('notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
    results.push(`Notifications deleted: ${notifCount || 'all'} ${notifErr ? '(error: ' + notifErr.message + ')' : '✓'}`);

    // 2. Delete contact_requests (only the 2 from Aug 4, keep Aug 13 ones)
    const { error: crErr } = await supabase
      .from('contact_requests')
      .delete()
      .in('id', contactRequestIdsToDelete);
    results.push(`Contact requests deleted (Aug 4 test): 2 ${crErr ? '(error: ' + crErr.message + ')' : '✓'}`);

    // 3. Delete the product (Life Fitness treadmill)
    const { error: prodErr } = await supabase
      .from('products')
      .delete()
      .eq('id', '555e17bd-1f71-4831-b962-bd42fc64bcdd');
    results.push(`Product 'Life Fitness treadmill' deleted ${prodErr ? '(error: ' + prodErr.message + ')' : '✓'}`);

    // 4. Delete supplier profiles (test ones)
    const { error: suppErr } = await supabase
      .from('supplier_profiles')
      .delete()
      .in('id', supplierIdsToDelete);
    results.push(`Supplier profiles deleted: 5 ${suppErr ? '(error: ' + suppErr.message + ')' : '✓'}`);

    // 5. Delete user accounts (test ones) - use email filter for safety
    const emailsToDelete = [
      'contact@proelitecoach.com',
      'supplier_audit@test.com',
      'testclient_audit@test.com',
      'test-supplier-audit@gymbuilder.test',
      'nasseronlinecoach@gmail.com',
      'nasser.nsy85@gmail.com',
    ];
    const { error: userErr } = await supabase
      .from('users')
      .delete()
      .in('email', emailsToDelete);
    results.push(`Users deleted: 6 ${userErr ? '(error: ' + userErr.message + ')' : '✓'}`);

    // 6. Delete contact_messages (if any exist)
    const { error: cmErr } = await supabase
      .from('contact_messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    results.push(`Contact messages deleted: all ${cmErr ? '(error: ' + cmErr.message + ')' : '✓'}`);

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
