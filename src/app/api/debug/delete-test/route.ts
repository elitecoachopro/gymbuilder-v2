import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find the test supplier "sc impex srl"
    const { data: supplier } = await supabase
      .from('supplier_profiles')
      .select('id, user_id, company_name')
      .ilike('company_name', '%impex%')
      .single();

    if (!supplier) {
      return NextResponse.json({ message: 'Test supplier not found - already deleted' });
    }

    const results: string[] = [];

    // Delete notifications for this user
    const { count: notifCount } = await supabase
      .from('notifications')
      .delete({ count: 'exact' })
      .eq('user_id', supplier.user_id);
    results.push(`Deleted ${notifCount || 0} notifications`);

    // Delete the supplier profile
    const { error: supplierErr } = await supabase
      .from('supplier_profiles')
      .delete()
      .eq('id', supplier.id);
    results.push(supplierErr ? `Supplier delete error: ${supplierErr.message}` : `Deleted supplier: ${supplier.company_name}`);

    // Delete the user account
    const { error: userErr } = await supabase
      .from('users')
      .delete()
      .eq('id', supplier.user_id);
    results.push(userErr ? `User delete error: ${userErr.message}` : `Deleted user: ${supplier.user_id}`);

    return NextResponse.json({ success: true, results, supplier });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
