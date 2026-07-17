import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const VALID_CATEGORIES = ['cardio', 'strength', 'functional', 'accessories', 'wellness', 'lockers', 'reception'];
const VALID_CONDITIONS = ['new', 'used'];

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function verifySessionToken(token: string): { userId: string } | null {
  try {
    const [payloadB64, hmac] = token.split('.');
    if (!payloadB64 || !hmac) return null;
    const expected = crypto.createHmac('sha256', process.env.JWT_SECRET || 'dev-secret')
      .update(payloadB64).digest('hex');
    if (hmac !== expected) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp && payload.exp < Date.now() / 1000) return null;
    return { userId: payload.userId || payload.id || payload.sub };
  } catch {
    return null;
  }
}

async function getSupplierProfile(supabase: any, userId: string) {
  const { data } = await supabase
    .from('supplier_profiles')
    .select('id, user_id')
    .eq('user_id', userId)
    .single();
  return data;
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const rows = lines.slice(1).map(line => {
    // Simple CSV parsing that handles quoted fields
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
  
  return { headers, rows };
}

interface ValidatedRow {
  rowIndex: number;
  valid: boolean;
  errors: string[];
  data: {
    name: string;
    description: string;
    price_eur: number;
    category: string;
    condition: string;
    status: string;
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
  const price = parseFloat(priceStr.replace(/[€,\s]/g, ''));
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
      category: mappedCategory,
      condition: mappedCondition,
      status: 'available',
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
      return NextResponse.json({ error: 'Trebuie să fii autentificat.' }, { status: 401 });
    }

    const session = verifySessionToken(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Sesiune expirată.' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const supplierProfile = await getSupplierProfile(supabase, session.userId);
    if (!supplierProfile) {
      return NextResponse.json({ error: 'Acces interzis.' }, { status: 403 });
    }

    const body = await request.json();
    const { csvContent, confirm } = body;

    if (!csvContent) {
      return NextResponse.json({ error: 'Conținut CSV lipsă.' }, { status: 400 });
    }

    const { headers, rows } = parseCSV(csvContent);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Fișierul CSV nu conține rânduri de date.' }, { status: 400 });
    }

    if (rows.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 de produse per import.' }, { status: 400 });
    }

    // Validate all rows
    const validated: ValidatedRow[] = rows.map((row, idx) => validateRow(headers, row, idx + 2));
    const validRows = validated.filter(r => r.valid);
    const invalidRows = validated.filter(r => !r.valid);

    // If not confirming, return preview
    if (!confirm) {
      return NextResponse.json({
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
      return NextResponse.json({ error: 'Nu există rânduri valide de importat.' }, { status: 400 });
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
      return NextResponse.json({ error: 'Eroare la salvarea produselor.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imported: inserted?.length || 0,
      skipped: invalidRows.length,
      message: `${inserted?.length || 0} produse importate cu succes!${invalidRows.length > 0 ? ` ${invalidRows.length} rânduri cu erori au fost ignorate.` : ''}`,
    });
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
