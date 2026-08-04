import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizePostgrestSearch } from '@/lib/sanitize';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    if (category && category !== 'all' && category !== 'Toate') {
      query = query.eq('category', category.toLowerCase());
    }

    if (search) {
      const safeSearch = sanitizePostgrestSearch(search);
      query = query.or(`name.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Products count error:', error);
      return NextResponse.json({ count: 0 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Products count API error:', error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
