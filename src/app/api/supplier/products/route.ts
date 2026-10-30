import { getPlanImageLimit } from '@/lib/plans';
import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { productCreateInput, productUpdateInput } from '@/lib/validation';
import { authenticateSession } from '@/lib/session-server';
import { NextRequest } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Verify session token and get user ID
async function verifySessionToken(token: string) { return authenticateSession(token); }

// Helper: get supplier profile from session
async function getSupplierProfile(supabase: SupabaseClient<Database>, userId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', userId)
    .single();

  if (!user || user.role !== 'supplier') return null;

  const { data: profile } = await supabase
    .from('supplier_profiles')
    .select('id, status, plan')
    .eq('user_id', userId)
    .single();
  return profile;
}

async function resolveBrand(supabase: SupabaseClient<Database>, suppliedName: string) {
  const name = suppliedName === 'Altul' ? 'Altele' : suppliedName;
  const { error } = await supabase.from('brands').upsert({ name }, { onConflict: 'name', ignoreDuplicates: true });
  if (error) throw new Error('Brand could not be saved');
  const { data, error: lookupError } = await supabase.from('brands').select('id').eq('name', name).single();
  if (lookupError || !data) throw new Error('Brand could not be loaded');
  return data.id;
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!sessionToken) {
      return await localizedJson({ error: 'Trebuie să fii autentificat pentru a adăuga produse.' }, { status: 401 });
    }

    const session = await verifySessionToken(sessionToken);
    if (!session) {
      return await localizedJson({ error: 'Sesiune expirată. Te rugăm să te autentifici din nou.' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const supplierProfile = await getSupplierProfile(supabase, session.userId);

    if (!supplierProfile) {
      return await localizedJson({ error: 'Doar furnizorii pot adăuga produse.' }, { status: 403 });
    }

    if (supplierProfile.status !== 'approved') {
      return await localizedJson({ error: 'Profilul tău de furnizor nu este încă aprobat.' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = productCreateInput.safeParse(body);
    if (!parsed.success) return await localizedJson({ error: 'Date produs invalide.' }, { status: 400 });
    const { name, category, brand, condition, price_eur, description, images, images_360 } = parsed.data;

    if (images && images.length > getPlanImageLimit(supplierProfile.plan)) return await localizedJson({ error: `Pachetul permite maximum ${getPlanImageLimit(supplierProfile.plan)} imagini per produs.` }, { status: 403 });

    // Validation
    if (!name || !category || !brand || !price_eur) {
      return await localizedJson({ error: 'Completează toate câmpurile obligatorii.' }, { status: 400 });
    }

    const validCategories = ['cardio', 'strength', 'functional', 'accessories', 'wellness', 'lockers', 'reception'];
    if (!validCategories.includes(category)) {
      return await localizedJson({ error: 'Categorie invalidă.' }, { status: 400 });
    }

    const validConditions = ['new', 'used'];
    if (!validConditions.includes(condition)) {
      return await localizedJson({ error: 'Condiție invalidă.' }, { status: 400 });
    }

    if (typeof price_eur !== 'number' || price_eur <= 0) {
      return await localizedJson({ error: 'Prețul trebuie să fie un număr pozitiv.' }, { status: 400 });
    }

    const brandId = await resolveBrand(supabase, brand);
    const imageUrls = images || [];
    const image360Urls = images_360 || [];
    if (image360Urls.length && !['professional', 'enterprise'].includes(supplierProfile.plan)) return await localizedJson({ error: 'Galeria 360° este disponibilă doar pentru planurile Professional și Enterprise.' }, { status: 403 });

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
        images_360: image360Urls,
        specs: {},
        status: 'active',
      })
      .select('id, name, category, price_eur, status, images, images_360, created_at')
      .single();

    if (insertError) {
      if (insertError.code === '23514' && /limit|quota|plan/i.test(insertError.message)) return await localizedJson({ error: 'Ai atins limita de produse a planului. Arhivează un produs sau contactează-ne pentru schimbarea planului.' }, { status: 409 });
      console.error('Product insert error:', insertError);
      return await localizedJson({ error: 'Eroare la salvarea produsului. Încearcă din nou.' }, { status: 500 });
    }

    return await localizedJson({
      success: true,
      message: 'Produs adăugat cu succes!',
      product: newProduct,
    });
  } catch (error) {
    console.error('Add product error:', error);
    return await localizedJson({ error: 'Eroare internă. Încearcă din nou.' }, { status: 500 });
  }
}

// GET - List supplier's products
export async function GET(request: NextRequest) {
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

    const supabase = getSupabaseAdmin();
    const { data: supplierProfile } = await supabase
      .from('supplier_profiles')
      .select('id, plan, status')
      .eq('user_id', session.userId)
      .single();
    if (!supplierProfile) {
      return await localizedJson({ error: 'Profil de furnizor negăsit.' }, { status: 404 });
    }
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, description, category, brand_id, condition, price_eur, images, images_360, status, created_at, updated_at')
      .eq('supplier_id', supplierProfile.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Products fetch error:', error);
      return await localizedJson({ error: 'Eroare la încărcarea produselor.' }, { status: 500 });
    }
    return await localizedJson({ products: products || [], plan: supplierProfile.plan || 'free', supplierStatus: supplierProfile.status });
  } catch (error) {
    console.error('Get products error:', error);
    return await localizedJson({ error: 'Eroare internă.' }, { status: 500 });
  }
}

// PATCH - Update a product
export async function PATCH(request: NextRequest) {
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

    const supabase = getSupabaseAdmin();
    const supplierProfile = await getSupplierProfile(supabase, session.userId);
    if (!supplierProfile) {
      return await localizedJson({ error: 'Acces interzis.' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = productUpdateInput.safeParse(body);
    if (!parsed.success) return await localizedJson({ error: 'Date produs invalide.' }, { status: 400 });
    const { productId, name, category, brand, condition, price_eur, description, images, images_360, status } = parsed.data;
    if (images && images.length > getPlanImageLimit(supplierProfile.plan)) return await localizedJson({ error: `Pachetul permite maximum ${getPlanImageLimit(supplierProfile.plan)} imagini per produs.` }, { status: 403 });

    if (!productId) {
      return await localizedJson({ error: 'ID produs lipsă.' }, { status: 400 });
    }

    // Verify product belongs to this supplier
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id, supplier_id, images, price_eur, name')
      .eq('id', productId)
      .eq('supplier_id', supplierProfile.id)
      .single();

    if (!existingProduct) {
      return await localizedJson({ error: 'Produs negăsit sau nu îți aparține.' }, { status: 404 });
    }

    // Build update object
    const updateData: Database['public']['Tables']['products']['Update'] = { updated_at: new Date().toISOString() };
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (condition) updateData.condition = condition;
    if (price_eur) updateData.price_eur = price_eur;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    if (brand) updateData.brand_id = await resolveBrand(supabase, brand);
    if (images !== undefined) updateData.images = images;
    if (images_360 !== undefined) {
      if (images_360.length && !['professional', 'enterprise'].includes(supplierProfile.plan)) return await localizedJson({ error: 'Galeria 360° este disponibilă doar pentru planurile Professional și Enterprise.' }, { status: 403 });
      updateData.images_360 = images_360;
    }

    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select('id, name, category, price_eur, status, images, images_360, updated_at')
      .single();

    if (updateError) {
      console.error('Product update error:', updateError);
      return await localizedJson({ error: 'Eroare la actualizarea produsului.' }, { status: 500 });
    }

    // Check for price drop and notify users who have this product in favorites
    if (price_eur && existingProduct.price_eur && price_eur < existingProduct.price_eur) {
      await notifyPriceDrop(
        supabase,
        productId,
        existingProduct.name || name || 'Produs',
        existingProduct.price_eur,
        price_eur
      ).catch((err) => console.error('Price drop notification error:', err));
    }

    return await localizedJson({ success: true, message: 'Produs actualizat!', product: updatedProduct });
  } catch (error) {
    console.error('Update product error:', error);
    return await localizedJson({ error: 'Eroare internă.' }, { status: 500 });
  }
}

// Notify users who favorited a product when its price drops
async function notifyPriceDrop(
  supabase: SupabaseClient<Database>,
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
  const userIds = favUsers.map((f) => f.user_id);
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name')
    .in('id', userIds);

  if (usersError) throw new Error('Could not load favorite recipients');
  if (!users || users.length === 0) return;

  const title = `Prețul a scăzut la ${productName}`;
  const message = `De la €${Number(oldPrice).toLocaleString()} la €${Number(newPrice).toLocaleString()}`;
  const link = `/products/${productId}`;

  // Create in-app notifications for all users
  const notifications = users.map((u) => ({
    user_id: u.id,
    type: 'price_drop',
    title,
    message,
    link,
    is_read: false,
    created_at: new Date().toISOString(),
  }));

  const { error: notificationError } = await supabase.from('notifications').insert(notifications);
  if (notificationError) throw new Error('Could not save price drop notifications');

  // Send email notifications via Resend
  if (!process.env.RESEND_API_KEY) return;
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  for (const user of users) {
    try {
      await resend.emails.send({
        from: 'Gym Builder <noreply@gymbuilder.app>',
        to: user.email,
        subject: 'Prețul a scăzut la un produs din favoritele tale — Gym Builder',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">Prețul a scăzut! 🎉</h2>
            <p style="color: #333;">Salut${user.full_name ? ` ${escapeHtml(user.full_name)}` : ''},</p>
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
            <p style="color: #999; font-size: 12px; margin-top: 24px;">Primești acest email pentru că ai adăugat acest produs la favorite pe Gym Builder.</p>
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
      return await localizedJson({ error: 'Trebuie să fii autentificat.' }, { status: 401 });
    }

    const session = await verifySessionToken(sessionToken);
    if (!session) {
      return await localizedJson({ error: 'Sesiune expirată.' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const supplierProfile = await getSupplierProfile(supabase, session.userId);
    if (!supplierProfile) {
      return await localizedJson({ error: 'Acces interzis.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return await localizedJson({ error: 'ID produs lipsă.' }, { status: 400 });
    }

    // Verify product belongs to this supplier
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id, supplier_id')
      .eq('id', productId)
      .eq('supplier_id', supplierProfile.id)
      .single();

    if (!existingProduct) {
      return await localizedJson({ error: 'Produs negăsit sau nu îți aparține.' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      console.error('Product delete error:', deleteError);
      return await localizedJson({ error: 'Eroare la ștergerea produsului.' }, { status: 500 });
    }

    return await localizedJson({ success: true, message: 'Produs șters cu succes.' });
  } catch (error) {
    console.error('Delete product error:', error);
    return await localizedJson({ error: 'Eroare internă.' }, { status: 500 });
  }
}
