import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    
    // Get all supplier profiles with verification_photos
    const { data: suppliers, error } = await supabase
      .from('supplier_profiles')
      .select('id, company_name, status, verification_photos, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      suppliers: suppliers?.map(s => ({
        id: s.id,
        company_name: s.company_name,
        status: s.status,
        verification_photos: s.verification_photos,
        photos_count: Array.isArray(s.verification_photos) ? s.verification_photos.length : 0,
        created_at: s.created_at,
        user_id: s.user_id,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
