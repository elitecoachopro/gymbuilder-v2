import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { parseCSV, parseCSVPrice } from '@/lib/csv';
import { authenticateSession } from '@/lib/session-server';
import { NextRequest } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const VALID_CATEGORIES = ['cardio', 'strength', 'functional', 'accessories', 'wellness', 'lockers', 'reception'];
const VALID_CONDITIONS = ['new', 'used'];

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verifySessionToken(token: string) { return authenticateSession(token); }

async function getSupplierProfile(supabase: SupabaseClient<Database>, userId: string) {
  const { data } = await supabase
    .from('supplier_profiles')
    .select('id, user_id, plan')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .single();
  return data;
}

interface ValidatedRow {
  rowIndex: number;
  valid: boolean;
  errors: string[];
  data: {
    name: string;
    description: string;
    price_eur: number;
    category: Database['public']['Enums']['product_category'];
    condition: Database['public']['Enums']['product_condition'];
    status: Database['public']['Enums']['product_status'];
    images: string[];
  } | null;
}

function validateRow(headers: string[], values: string[], rowIndex: number): ValidatedRow {
  const errors: string[] = [];
  const get = (col: string) => {
    const idx = headers.indexOf(col);
    return idx >= 0 && idx < values.length ? values[idx].trim() : '';
  };

  const name = get('nume') || get('name');
  const description = get('descriere') || get('description') || '';
  const priceStr = get('pret') || get('preț') || get('price') || get('pret_eur') || get('price_eur');
  const category = get('categorie') || get('category');
  const condition = get('stare') || get('condition');
  const imageUrl = get('imagine_url') || get('image_url') || get('imagine') || get('image');

  // Validate required fields
  if (!name) errors.push('Numele este obligatoriu');
  if (!priceStr) errors.push('Prețul este obligatoriu');
  if (!category) errors.push('Categoria este obligatorie');

  // Validate price
  const price = parseCSVPrice(priceStr);
  if (priceStr && (isNaN(price) || price <= 0)) {
    errors.push(`Preț invalid: "${priceStr}" (trebuie să fie un număr pozitiv)`);
  }

  // Validate category
  const normalizedCategory = category.toLowerCase().trim();
  const categoryMap: Record<string, string> = {
    'cardio': 'cardio',
    'forta': 'strength', 'forță': 'strength', 'strength': 'strength',
    'functional': 'functional', 'funcțional': 'functional',
    'accesorii': 'accessories', 'accessories': 'accessories',
    'wellness': 'wellness', 'spa': 'wellness',
    'vestiare': 'lockers', 'lockers': 'lockers',
    'receptie': 'reception', 'recepție': 'reception', 'reception': 'reception',
  };
  const mappedCategory = categoryMap[normalizedCategory] || normalizedCategory;
  if (category && !VALID_CATEGORIES.includes(mappedCategory)) {
    errors.push(`Categorie invalidă: "${category}" (valide: cardio, strength/forță, functional, accessories/accesorii, wellness, lockers/vestiare, reception/recepție)`);
  }

  // Validate condition
  const conditionMap: Record<string, string> = {
    'nou': 'new', 'new': 'new', 'noi': 'new',
    'sh': 'used', 'second-hand': 'used', 'second hand': 'used', 'used': 'used', 'folosit': 'used',
  };
  const normalizedCondition = (condition || 'new').toLowerCase().trim();
  const mappedCondition = conditionMap[normalizedCondition] || normalizedCondition;
  if (condition && !VALID_CONDITIONS.includes(mappedCondition)) {
    errors.push(`Stare invalidă: "${condition}" (valide: nou/new, sh/second-hand/used)`);
  }

  // Validate image URL
  if (imageUrl && !imageUrl.startsWith('http')) {
    errors.push(`URL imagine invalid: "${imageUrl}" (trebuie să înceapă cu http)`);
  }

  if (errors.length > 0) {
    return { rowIndex, valid: false, errors, data: null };
  }

  return {
    rowIndex,
    valid: true,
    errors: [],
    data: {
      name,
      description,
      price_eur: price,
      category: mappedCategory as Database['public']['Enums']['product_category'],
      condition: mappedCondition as Database['public']['Enums']['product_condition'],
      status: 'active',
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

// POST - Validate CSV and return preview
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!sessionToken) {
      return await localizedJson({ error: 'Trebuie să fii autentificat.' }, { status: 401 });
    }

    const session = await verifySessionToken(sessionToken);
    if (!session) {
      return await localizedJson({ error: 'Sesiune expirată.' }, { status: 401 });
    }
    if (!['supplier', 'admin'].includes(session.role)) return await localizedJson({ error: 'Acces interzis.' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    const supplierProfile = await getSupplierProfile(supabase, session.userId);
    if (!supplierProfile) {
      return await localizedJson({ error: 'Acces interzis.' }, { status: 403 });
    }

    const body = await request.json();
    const { csvContent, confirm } = body;

    if (typeof csvContent !== 'string' || !csvContent.trim() || csvContent.length > 1048576) {
      return await localizedJson({ error: 'Conținut CSV lipsă.' }, { status: 400 });
    }

    let headers: string[], rows: string[][];
    try { ({ headers, rows } = parseCSV(csvContent)); } catch (error) { return await localizedJson({ error: error instanceof Error ? error.message : 'CSV invalid.' }, { status: 400 }); }

    if (rows.length === 0) {
      return await localizedJson({ error: 'Fișierul CSV nu conține rânduri de date.' }, { status: 400 });
    }

    if (rows.length > 100) {
      return await localizedJson({ error: 'Maximum 100 de produse per import.' }, { status: 400 });
    }

    // Validate all rows
    const validated: ValidatedRow[] = rows.map((row, idx) => validateRow(headers, row, idx + 2));
    const validRows = validated.filter(r => r.valid);
    const invalidRows = validated.filter(r => !r.valid);

    // If not confirming, return preview
    if (!confirm) {
      return await localizedJson({
        preview: true,
        total: rows.length,
        valid: validRows.length,
        invalid: invalidRows.length,
        validRows: validRows.map(r => ({ rowIndex: r.rowIndex, data: r.data })),
        invalidRows: invalidRows.map(r => ({ rowIndex: r.rowIndex, errors: r.errors })),
      });
    }

    // Confirm: insert valid products
    if (validRows.length === 0) {
      return await localizedJson({ error: 'Nu există rânduri valide de importat.' }, { status: 400 });
    }

    const productLimits: Record<string, number> = { free: 3, starter: 25, professional: 100, enterprise: Infinity };
    const { count, error: countError } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('supplier_id', supplierProfile.id);
    if (countError) return await localizedJson({ error: 'Limita de produse nu a putut fi verificata.' }, { status: 500 });
    if ((count || 0) + validRows.length > (productLimits[supplierProfile.plan] ?? 3)) {
      return await localizedJson({ error: 'Importul depaseste limita de produse a pachetului.' }, { status: 403 });
    }

    // Get or create a default brand for CSV imports
    let brandId: string | null = null;
    const { data: defaultBrand } = await supabase
      .from('brands')
      .select('id')
      .eq('name', 'Altele')
      .single();
    brandId = defaultBrand?.id || null;

    const productsToInsert = validRows.map(r => ({
      supplier_id: supplierProfile.id,
      name: r.data!.name,
      description: r.data!.description || null,
      price_eur: r.data!.price_eur,
      category: r.data!.category,
      condition: r.data!.condition,
      status: r.data!.status,
      images: r.data!.images,
      brand_id: brandId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('products')
      .insert(productsToInsert)
      .select('id, name');

    if (insertError) {
      console.error('CSV import insert error:', insertError);
      return await localizedJson({ error: 'Eroare la salvarea produselor.' }, { status: 500 });
    }

    return await localizedJson({
      success: true,
      imported: inserted?.length || 0,
      skipped: invalidRows.length,
      message: `${inserted?.length || 0} produse importate cu succes!${invalidRows.length > 0 ? ` ${invalidRows.length} rânduri cu erori au fost ignorate.` : ''}`,
    });
  } catch (error) {
    console.error('CSV import error:', error);
    return await localizedJson({ error: 'Eroare internă.' }, { status: 500 });
  }
}
