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
    const { data: ofertaRaw, error: ofertaError } = await supabase
      .from('promotions')
      .select('id, title, description, price_eur, type, supplier_id, product_id, image_url, starts_at, ends_at, status')
      .eq('type', 'oferta_zilei')
      .eq('status', 'active')
      .lte('starts_at', now)
      .gte('ends_at', now)
      .order('starts_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch active "Anunțurile Zilei" (max 5)
    const { data: anunturiRaw, error: anunturiError } = await supabase
      .from('promotions')
      .select('id, title, description, price_eur, type, supplier_id, product_id, image_url, starts_at, ends_at, status')
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
      console.error('Anunturi Zilei fetch error:', anunturiError);
    }

    // Enrich with supplier and product info
    const allPromos = [...(ofertaRaw ? [ofertaRaw] : []), ...(anunturiRaw || [])];
    const supplierIds = Array.from(new Set(allPromos.map(p => p.supplier_id).filter(Boolean)));
    const productIds = Array.from(new Set(allPromos.map(p => p.product_id).filter(Boolean)));

    let supplierMap = new Map();
    let productMap = new Map();

    if (supplierIds.length > 0) {
      const { data: suppliers } = await supabase
        .from('supplier_profiles')
        .select('id, company_name, country')
        .in('id', supplierIds);
      supplierMap = new Map((suppliers || []).map(s => [s.id, s]));
    }

    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from('products')
        .select('id, name, category, images, brand_id')
        .in('id', productIds);
      productMap = new Map((products || []).map(p => [p.id, p]));
    }

    // Enrich oferta
    let ofertaZilei = null;
    if (ofertaRaw) {
      ofertaZilei = {
        ...ofertaRaw,
        supplier: supplierMap.get(ofertaRaw.supplier_id) || null,
        product: productMap.get(ofertaRaw.product_id) || null,
      };
    }

    // Enrich anunturi
    const anunturiZilei = (anunturiRaw || []).map(a => ({
      ...a,
      supplier: supplierMap.get(a.supplier_id) || null,
      product: productMap.get(a.product_id) || null,
    }));

    return NextResponse.json({
      ofertaZilei,
      anunturiZilei,
    });
  } catch (error) {
    console.error('Promotions API error:', error);
    return NextResponse.json(
      { ofertaZilei: null, anunturiZilei: [] },
      { status: 200 } // Return empty data instead of error to not break homepage
    );
  }
}
