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
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    // Fetch active "Oferta Zilei" (only 1, most recent)
    const { data: ofertaZilei, error: ofertaError } = await supabase
      .from('promotions')
      .select(`
        id, title, description, price_eur, type, starts_at, ends_at, status,
        supplier_profiles(company_name, country),
        products(name, brand, images, category)
      `)
      .eq('type', 'oferta_zilei')
      .eq('status', 'active')
      .lte('starts_at', now)
      .gte('ends_at', now)
      .order('starts_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch active "Anunțurile Zilei" (max 5)
    const { data: anunturiZilei, error: anunturiError } = await supabase
      .from('promotions')
      .select(`
        id, title, description, price_eur, type, starts_at, ends_at, status,
        supplier_profiles(company_name, country),
        products(name, brand, images, category)
      `)
      .eq('type', 'anunturile_zilei')
      .eq('status', 'active')
      .lte('starts_at', now)
      .gte('ends_at', now)
      .order('starts_at', { ascending: false })
      .limit(5);

    if (ofertaError) {
      console.error('Oferta Zilei fetch error:', ofertaError);
    }
    if (anunturiError) {
      console.error('Anunțuri Zilei fetch error:', anunturiError);
    }

    return NextResponse.json({
      ofertaZilei: ofertaZilei || null,
      anunturiZilei: anunturiZilei || [],
    });
  } catch (error) {
    console.error('Promotions API error:', error);
    return NextResponse.json(
      { ofertaZilei: null, anunturiZilei: [] },
      { status: 200 } // Return empty data instead of error to not break homepage
    );
  }
}
