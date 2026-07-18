import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Validate file by checking magic bytes (binary signature)
function validateMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 8) return false;
  // JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
      buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A) return true;
  // WebP
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer.length >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return true;
  // GIF
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38 &&
      (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61) return true;
  return false;
}

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

    // Validate magic bytes
    if (!validateMagicBytes(buffer)) return null;

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
      .select('id, supplier_id, images, price_eur, name')
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

    // Check for price drop and notify users who have this product in favorites
    if (price_eur && existingProduct.price_eur && price_eur < existingProduct.price_eur) {
      notifyPriceDrop(
        supabase,
        productId,
        existingProduct.name || name || 'Produs',
        existingProduct.price_eur,
        price_eur
      ).catch((err) => console.error('Price drop notification error:', err));
    }

    return NextResponse.json({ success: true, message: 'Produs actualizat!', product: updatedProduct });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}

// Notify users who favorited a product when its price drops
async function notifyPriceDrop(
  supabase: any,
  productId: string,
  productName: string,
  oldPrice: number,
  newPrice: number
) {
  // Get all users who have this product in favorites
  const { data: favUsers } = await supabase
    .from('favorites')
    .select('user_id')
    .eq('product_id', productId);

  if (!favUsers || favUsers.length === 0) return;

  // Get user emails for sending Resend notifications
  const userIds = favUsers.map((f: any) => f.user_id);
  const { data: users } = await supabase
    .from('users')
    .select('id, email, name')
    .in('id', userIds);

  if (!users || users.length === 0) return;

  const title = `Prețul a scăzut la ${productName}`;
  const message = `De la €${Number(oldPrice).toLocaleString()} la €${Number(newPrice).toLocaleString()}`;
  const link = `/products/${productId}`;

  // Create in-app notifications for all users
  const notifications = users.map((u: any) => ({
    user_id: u.id,
    type: 'price_drop',
    title,
    message,
    link,
    is_read: false,
    created_at: new Date().toISOString(),
  }));

  await supabase.from('notifications').insert(notifications);

  // Send email notifications via Resend
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  for (const user of users) {
    try {
      await resend.emails.send({
        from: 'GymBuilder <noreply@gymbuilder.app>',
        to: user.email,
        subject: 'Prețul a scăzut la un produs din favoritele tale — GymBuilder',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">Prețul a scăzut! 🎉</h2>
            <p style="color: #333;">Salut${user.name ? ` ${escapeHtml(user.name)}` : ''},</p>
            <p style="color: #333;">Un produs din favoritele tale a primit o reducere de preț:</p>
            <div style="background: #f8f8f8; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <h3 style="margin: 0 0 8px 0; color: #1a1a1a;">${escapeHtml(productName)}</h3>
              <p style="margin: 0; font-size: 14px;">
                <span style="color: #999; text-decoration: line-through;">€${Number(oldPrice).toLocaleString()}</span>
                &nbsp;&nbsp;
                <span style="color: #16a34a; font-weight: bold; font-size: 18px;">€${Number(newPrice).toLocaleString()}</span>
              </p>
              <p style="margin: 8px 0 0 0; color: #16a34a; font-size: 13px;">Economisești €${Number(oldPrice - newPrice).toLocaleString()}!</p>
            </div>
            <a href="https://gymbuilder.app/products/${productId}" style="display: inline-block; background: #d4a843; color: #1a1a1a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">Vezi Produsul</a>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">Primești acest email pentru că ai adăugat acest produs la favorite pe GymBuilder.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error(`Failed to send price drop email to ${user.email}:`, emailErr);
    }
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
