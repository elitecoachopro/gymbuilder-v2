import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
        id, user_id, company_name, country, city, website, phone, description, logo_url, status, plan, created_at,
        users!inner(full_name, email, avatar_url)
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (country && country !== 'Toate') {
      query = query.eq('country', country);
    }

    if (search) {
      query = query.or(`company_name.ilike.%${search}%,description.ilike.%${search}%,city.ilike.%${search}%`);
    }

    const { data: suppliers, error } = await query;

    if (error) {
      console.error('Suppliers fetch error:', error);
      return NextResponse.json(
        { error: 'Eroare la încărcarea furnizorilor.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      suppliers: suppliers || [],
      count: suppliers?.length || 0,
    });
  } catch (error) {
    console.error('Suppliers API error:', error);
    return NextResponse.json(
      { error: 'Eroare internă.' },
      { status: 500 }
    );
  }
}
