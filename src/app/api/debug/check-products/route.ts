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
    
    // Get all products with their supplier_id
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, category, status, supplier_id, price_eur, condition, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get all supplier IDs that exist
    const { data: suppliers } = await supabase
      .from('supplier_profiles')
      .select('id, company_name');

    const supplierMap = new Map((suppliers || []).map(s => [s.id, s.company_name]));

    const enrichedProducts = (products || []).map(p => ({
      ...p,
      supplier_name: p.supplier_id ? (supplierMap.get(p.supplier_id) || 'ORPHAN - supplier not found') : 'NO SUPPLIER_ID',
      is_orphan: p.supplier_id ? !supplierMap.has(p.supplier_id) : true,
    }));

    return NextResponse.json({
      total_products: products?.length || 0,
      orphan_count: enrichedProducts.filter(p => p.is_orphan).length,
      valid_count: enrichedProducts.filter(p => !p.is_orphan).length,
      products: enrichedProducts,
      existing_suppliers: suppliers,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
