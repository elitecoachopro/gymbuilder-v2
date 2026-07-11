import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Verify session token and get user ID
function verifySessionToken(token: string): { userId: string } | null {
  try {
    const [payloadB64, hmac] = token.split('.');
    if (!payloadB64 || !hmac) return null;

    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret';
    const payload = Buffer.from(payloadB64, 'base64').toString();
    const expectedHmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (hmac !== expectedHmac) return null;

    const parsed = JSON.parse(payload);
    if (parsed.exp < Date.now()) return null;

    return { userId: parsed.userId };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie or authorization header
    const sessionToken = request.cookies.get('session_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Trebuie să fii autentificat pentru a adăuga produse.' },
        { status: 401 }
      );
    }

    const session = verifySessionToken(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Sesiune expirată. Te rugăm să te autentifici din nou.' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify user is a supplier with approved status
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', session.userId)
      .single();

    if (!user || user.role !== 'supplier') {
      return NextResponse.json(
        { error: 'Doar furnizorii pot adăuga produse.' },
        { status: 403 }
      );
    }

    // Get supplier profile
    const { data: supplierProfile } = await supabase
      .from('supplier_profiles')
      .select('id, status')
      .eq('user_id', session.userId)
      .single();

    if (!supplierProfile || supplierProfile.status !== 'approved') {
      return NextResponse.json(
        { error: 'Profilul tău de furnizor nu este încă aprobat.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, category, brand, condition, price_eur, description, images } = body;

    // Validation
    if (!name || !category || !brand || !price_eur) {
      return NextResponse.json(
        { error: 'Completează toate câmpurile obligatorii.' },
        { status: 400 }
      );
    }

    const validCategories = ['cardio', 'strength', 'functional', 'accessories', 'wellness', 'lockers', 'reception'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Categorie invalidă.' },
        { status: 400 }
      );
    }

    const validConditions = ['new', 'used'];
    if (!validConditions.includes(condition)) {
      return NextResponse.json(
        { error: 'Condiție invalidă.' },
        { status: 400 }
      );
    }

    if (typeof price_eur !== 'number' || price_eur <= 0) {
      return NextResponse.json(
        { error: 'Prețul trebuie să fie un număr pozitiv.' },
        { status: 400 }
      );
    }

    // Find brand_id from brands table (optional - if brand exists)
    let brandId = null;
    const { data: brandRecord } = await supabase
      .from('brands')
      .select('id')
      .eq('name', brand)
      .single();

    if (brandRecord) {
      brandId = brandRecord.id;
    }

    // Store images as array of strings (base64 or URLs)
    // In production, these would be uploaded to storage first
    const imageUrls = Array.isArray(images) ? images.slice(0, 6) : [];

    // Insert product
    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert({
        supplier_id: supplierProfile.id,
        name,
        category,
        brand_id: brandId,
        condition,
        price_eur,
        description: description || null,
        images: imageUrls,
        specs: {},
        status: 'active',
      })
      .select('id, name, category, price_eur, status')
      .single();

    if (insertError) {
      console.error('Product insert error:', insertError);
      return NextResponse.json(
        { error: 'Eroare la salvarea produsului. Încearcă din nou.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Produs adăugat cu succes!',
      product: newProduct,
    });
  } catch (error) {
    console.error('Add product error:', error);
    return NextResponse.json(
      { error: 'Eroare internă. Încearcă din nou.' },
      { status: 500 }
    );
  }
}

// GET - List supplier's products
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Trebuie să fii autentificat.' },
        { status: 401 }
      );
    }

    const session = verifySessionToken(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Sesiune expirată.' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get supplier profile
    const { data: supplierProfile } = await supabase
      .from('supplier_profiles')
      .select('id')
      .eq('user_id', session.userId)
      .single();

    if (!supplierProfile) {
      return NextResponse.json(
        { error: 'Profil de furnizor negăsit.' },
        { status: 404 }
      );
    }

    // Get products
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('supplier_id', supplierProfile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Products fetch error:', error);
      return NextResponse.json(
        { error: 'Eroare la încărcarea produselor.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Eroare internă.' },
      { status: 500 }
    );
  }
}
