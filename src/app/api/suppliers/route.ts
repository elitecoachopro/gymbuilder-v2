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
    const country = searchParams.get('country');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('supplier_profiles')
      .select(`
        id, company_name, country, city, website, phone, description, logo_url, status, plan, verified, created_at
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (country && country !== 'Toate' && country !== 'all') {
      query = query.eq('country', country);
    }

    if (search) {
      const safeSearch = sanitizePostgrestSearch(search);
      query = query.or(`company_name.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%,city.ilike.%${safeSearch}%`);
    }

    const { data: suppliers, error } = await query;

    if (error) {
      console.error('Suppliers fetch error:', error);
      return NextResponse.json({
        suppliers: [],
        count: 0,
        source: 'error',
        debug: error.message,
      });
    }

    return NextResponse.json({
      suppliers: suppliers || [],
      count: suppliers?.length || 0,
      source: 'supabase',
    });
  } catch (error) {
    console.error('Suppliers API error:', error);
    return NextResponse.json({
      suppliers: [],
      count: 0,
      source: 'error',
    });
  }
}
