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

// Helper: get supplier profile from session
async function getSupplierProfile(supabase: any, userId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', userId)
    .single();

  if (!user || user.role !== 'supplier') return null;

  const { data: profile } = await supabase
    .from('supplier_profiles')
    .select('id, status')
    .eq('user_id', userId)
    .single();

  return profile;
}

// Helper: upload base64 image to Supabase Storage
async function uploadImage(supabase: any, base64Data: string, supplierId: string, index: number): Promise<string | null> {
  try {
    // Extract mime type and data from base64
    const match = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return null;

    const mimeType = match[1];
    const data = match[2];
    const ext = mimeType.split('/')[1] || 'jpg';
    const buffer = Buffer.from(data, 'base64');

    // Max 5MB
    if (buffer.length > 5 * 1024 * 1024) return null;

    const fileName = `products/${supplierId}/${Date.now()}-${index}-${crypto.randomBytes(4).toString('hex')}.${ext}`;

    // Ensure bucket exists
    const { error: bucketError } = await supabase.storage.getBucket('uploads');
    if (bucketError) {
      await supabase.storage.createBucket('uploads', {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      });
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, buffer, { contentType: mimeType, upsert: false });

    if (uploadError) {
      console.error('Image upload error:', uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
    return urlData.publicUrl;
  } catch (err) {
    console.error('Upload image exception:', err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!sessionToken) {
      return NextResponse.json({ error: 'Trebuie să fii autentificat pentru a adăuga produse.' }, { status: 401 });
    }

    const session = verifySessionToken(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Sesiune expirată. Te rugăm să te autentifici din nou.' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const supplierProfile = await getSupplierProfile(supabase, session.userId);

    if (!supplierProfile) {
      return NextResponse.json({ error: 'Doar furnizorii pot adăuga produse.' }, { status: 403 });
    }

    if (supplierProfile.status !== 'approved') {
      return NextResponse.json({ error: 'Profilul tău de furnizor nu este încă aprobat.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, category, brand, condition, price_eur, description, images } = body;

    // Validation
    if (!name || !category || !brand || !price_eur) {
      return NextResponse.json({ error: 'Completează toate câmpurile obligatorii.' }, { status: 400 });
    }

    const validCategories = ['cardio', 'strength', 'functional', 'accessories', 'wellness', 'lockers', 'reception'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Categorie invalidă.' }, { status: 400 });
    }

    const validConditions = ['new', 'used'];
    if (!validConditions.includes(condition)) {
      return NextResponse.json({ error: 'Condiție invalidă.' }, { status: 400 });
    }

    if (typeof price_eur !== 'number' || price_eur <= 0) {
      return NextResponse.json({ error: 'Prețul trebuie să fie un număr pozitiv.' }, { status: 400 });
    }

    // Find brand_id from brands table
    let brandId = null;
    const { data: brandRecord } = await supabase
      .from('brands')
      .select('id')
      .eq('name', brand)
      .single();

    if (brandRecord) {
      brandId = brandRecord.id;
    }

    // Upload images to Supabase Storage
    const imageUrls: string[] = [];
    if (Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < Math.min(images.length, 6); i++) {
        const img = images[i];
        if (typeof img === 'string') {
          if (img.startsWith('data:image/')) {
            // Base64 image - upload to storage
            const url = await uploadImage(supabase, img, supplierProfile.id, i);
            if (url) imageUrls.push(url);
          } else if (img.startsWith('http')) {
            // Already a URL - keep as is
            imageUrls.push(img);
          }
        }
      }
    }

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
      .select('id, name, category, price_eur, status, images, created_at')
      .single();

    if (insertError) {
      console.error('Product insert error:', insertError);
      return NextResponse.json({ error: 'Eroare la salvarea produsului. Încearcă din nou.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Produs adăugat cu succes!',
      product: newProduct,
    });
  } catch (error) {
    console.error('Add product error:', error);
    return NextResponse.json({ error: 'Eroare internă. Încearcă din nou.' }, { status: 500 });
  }
}

// GET - List supplier's products
export async function GET(request: NextRequest) {
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

    const { data: supplierProfile } = await supabase
      .from('supplier_profiles')
      .select('id')
      .eq('user_id', session.userId)
      .single();

    if (!supplierProfile) {
      return NextResponse.json({ error: 'Profil de furnizor negăsit.' }, { status: 404 });
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, description, category, brand_id, condition, price_eur, images, status, created_at, updated_at')
      .eq('supplier_id', supplierProfile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Products fetch error:', error);
      return NextResponse.json({ error: 'Eroare la încărcarea produselor.' }, { status: 500 });
    }

    return NextResponse.json({ products: products || [] });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}

// PATCH - Update a product
export async function PATCH(request: NextRequest) {
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
    const { productId, name, category, brand, condition, price_eur, description, images, status } = body;

    if (!productId) {
      return NextResponse.json({ error: 'ID produs lipsă.' }, { status: 400 });
    }

    // Verify product belongs to this supplier
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id, supplier_id, images')
      .eq('id', productId)
      .eq('supplier_id', supplierProfile.id)
      .single();

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produs negăsit sau nu îți aparține.' }, { status: 404 });
    }

    // Build update object
    const updateData: any = { updated_at: new Date().toISOString() };
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (condition) updateData.condition = condition;
    if (price_eur) updateData.price_eur = price_eur;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    // Handle brand
    if (brand) {
      const { data: brandRecord } = await supabase.from('brands').select('id').eq('name', brand).single();
      updateData.brand_id = brandRecord?.id || null;
    }

    // Handle images (upload new ones, keep existing URLs)
    if (Array.isArray(images)) {
      const imageUrls: string[] = [];
      for (let i = 0; i < Math.min(images.length, 6); i++) {
        const img = images[i];
        if (typeof img === 'string') {
          if (img.startsWith('data:image/')) {
            const url = await uploadImage(supabase, img, supplierProfile.id, i);
            if (url) imageUrls.push(url);
          } else if (img.startsWith('http')) {
            imageUrls.push(img);
          }
        }
      }
      updateData.images = imageUrls;
    }

    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select('id, name, category, price_eur, status, images, updated_at')
      .single();

    if (updateError) {
      console.error('Product update error:', updateError);
      return NextResponse.json({ error: 'Eroare la actualizarea produsului.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Produs actualizat!', product: updatedProduct });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}

// DELETE - Delete a product
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json({ error: 'ID produs lipsă.' }, { status: 400 });
    }

    // Verify product belongs to this supplier
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id, supplier_id')
      .eq('id', productId)
      .eq('supplier_id', supplierProfile.id)
      .single();

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produs negăsit sau nu îți aparține.' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      console.error('Product delete error:', deleteError);
      return NextResponse.json({ error: 'Eroare la ștergerea produsului.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Produs șters cu succes.' });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
