import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { registrationBucket } from '@/lib/registration-upload-server';
import { getSessionUser } from '@/lib/session-server';
import { sendSupplierEmail, supplierDecisionResult } from '@/lib/supplier-decision';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// Verify session token and check admin role
async function verifyAdmin(_request?: unknown) { const user = await getSessionUser(); return user?.role === 'admin' ? user : null; }

// GET: List suppliers by status + count pending
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return await localizedJson({ error: 'Acces interzis.' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';

  if (!['pending', 'approved', 'rejected'].includes(status)) return await localizedJson({ error: 'Date invalide.' }, { status: 400 });
  // Get suppliers with the requested status (no join to avoid FK detection issues)
  const { data: suppliers, error } = await supabase
    .from('supplier_profiles')
    .select('id, user_id, company_name, country, city, website, phone, description, status, plan, verified, created_at, verification_photos, requested_plan')
    .eq('status', status as Database['public']['Enums']['supplier_status'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Admin suppliers fetch error:', error);
    return await localizedJson({ error: 'Eroare la incarcarea furnizorilor.', debug: error.message }, { status: 500 });
  }

  // Enrich with user info via separate query
  const enrichedSuppliers = [];
  if (suppliers && suppliers.length > 0) {
    const userIds = suppliers.map(s => s.user_id).filter((id): id is string => !!id);
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds);

    const userMap = new Map((users || []).map(u => [u.id, u]));

    for (const supplier of suppliers) {
      const user = userMap.get(supplier.user_id || '');
      const paths = Array.isArray(supplier.verification_photos) ? supplier.verification_photos.filter((path: unknown): path is string => typeof path === 'string') : [];
      const verificationPhotos = await Promise.all(paths.map(async (path: string) => {
        if (/^https?:\/\//.test(path)) return path;
        const { data } = await supabase.storage.from(registrationBucket).createSignedUrl(path, 3600);
        return data?.signedUrl || null;
      }));
      enrichedSuppliers.push({
        ...supplier,
        verification_photos: verificationPhotos.filter(Boolean),
        full_name: user?.full_name || 'N/A',
        email: user?.email || 'N/A',
      });
    }
  }

  // Get pending count for badge
  const { count: pendingCount } = await supabase
    .from('supplier_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  return await localizedJson({
    suppliers: enrichedSuppliers,
    pendingCount: pendingCount || 0,
  });
}

// PATCH: Approve or reject a supplier + send email notification
export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return await localizedJson({ error: 'Acces interzis.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { supplierId, action, reason } = body;

    if (!supplierId || !['approve', 'reject', 'verify', 'unverify'].includes(action)) {
      return await localizedJson(
        { error: 'Parametri invalizi. Trebuie supplierId si action (approve/reject/verify/unverify).' },
        { status: 400 }
      );
    }

    // Handle verify/unverify action
    if (action === 'verify' || action === 'unverify') {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('supplier_profiles')
        .update({ verified: action === 'verify', updated_at: new Date().toISOString() })
        .eq('id', supplierId)
        .select('id, company_name, verified')
        .single();

      if (error) {
        return await localizedJson({ error: 'Eroare la actualizare.' }, { status: 500 });
      }

      return await localizedJson({
        success: true,
        message: action === 'verify'
          ? `Furnizorul "${data.company_name}" a fost marcat ca verificat.`
          : `Furnizorul "${data.company_name}" nu mai este verificat.`,
        supplier: data,
      });
    }

    const supabase = getSupabaseAdmin();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Get supplier info before updating
    const { data: supplierInfo } = await supabase
      .from('supplier_profiles')
      .select('id, company_name, user_id')
      .eq('id', supplierId)
      .single();

    if (!supplierInfo) {
      return await localizedJson({ error: 'Furnizor negasit.' }, { status: 404 });
    }

    // Get user email via separate query (avoids join issues)
    const { data: userData } = supplierInfo.user_id ? await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', supplierInfo.user_id)
      .single() : { data: null };

    // Update status
    const { data, error } = await supabase
      .from('supplier_profiles')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', supplierId)
      .select('id, company_name, status')
      .single();

    if (error) {
      console.error('Admin supplier update error:', error);
      return await localizedJson({ error: 'Eroare la actualizarea statusului.' }, { status: 500 });
    }

    // Send email notification
    const userEmail = userData?.email;
    const userName = userData?.full_name || 'Furnizor';
    const companyName = supplierInfo.company_name;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gymbuilder.app';

    let emailSent = false;
    if (userEmail) {
      if (action === 'approve') {
        emailSent = await sendSupplierEmail(
          userEmail,
          'Contul tau Gym Builder a fost aprobat',
          `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #1a1a1a; color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f5c542; font-size: 28px; margin: 0;">Gym Builder</h1>
            </div>
            <div style="background: #2a2a2a; border-radius: 12px; padding: 32px; border: 1px solid #3a3a3a;">
              <h2 style="color: #4ade80; margin-top: 0;">Felicitari, ${escapeHtml(userName)}!</h2>
              <p style="color: #d1d5db; line-height: 1.6;">
                Contul tau de furnizor <strong style="color: #f5c542;">${escapeHtml(companyName)}</strong> a fost aprobat cu succes pe platforma Gym Builder.
              </p>
              <p style="color: #d1d5db; line-height: 1.6;">Acum poti:</p>
              <ul style="color: #d1d5db; line-height: 2;">
                <li>Adauga produse si echipamente pe platforma</li>
                <li>Primi cereri de oferta de la clienti</li>
                <li>Gestiona profilul tau de furnizor</li>
              </ul>
              <div style="text-align: center; margin-top: 24px;">
                <a href="${appUrl}/login" style="display: inline-block; background: #f5c542; color: #1a1a1a; font-weight: bold; padding: 14px 28px; border-radius: 8px; text-decoration: none;">
                  Acceseaza Dashboard-ul
                </a>
              </div>
            </div>
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px;">
              &copy; ${new Date().getFullYear()} Gym Builder. Toate drepturile rezervate.
            </p>
          </div>
          `,
          process.env.RESEND_API_KEY
        );
      } else {
        emailSent = await sendSupplierEmail(
          userEmail,
          'Cererea ta a fost respinsa',
          `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #1a1a1a; color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f5c542; font-size: 28px; margin: 0;">Gym Builder</h1>
            </div>
            <div style="background: #2a2a2a; border-radius: 12px; padding: 32px; border: 1px solid #3a3a3a;">
              <h2 style="color: #f87171; margin-top: 0;">Cererea ta a fost respinsa</h2>
              <p style="color: #d1d5db; line-height: 1.6;">Buna, ${escapeHtml(userName)},</p>
              <p style="color: #d1d5db; line-height: 1.6;">
                Din pacate, cererea de inregistrare pentru compania <strong style="color: #f5c542;">${escapeHtml(companyName)}</strong> nu a fost aprobata.
              </p>
              ${reason ? `
              <div style="background: #1a1a1a; border-left: 3px solid #f87171; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                <p style="color: #9ca3af; margin: 0; font-size: 14px;"><strong>Motiv:</strong> ${escapeHtml(reason)}</p>
              </div>
              ` : ''}
              <p style="color: #d1d5db; line-height: 1.6;">
                Daca consideri ca este o eroare, contacteaza-ne la <a href="mailto:contact@gymbuilder.app" style="color: #f5c542;">contact@gymbuilder.app</a>.
              </p>
              <div style="text-align: center; margin-top: 24px;">
                <a href="${appUrl}/register/supplier" style="display: inline-block; background: #f5c542; color: #1a1a1a; font-weight: bold; padding: 14px 28px; border-radius: 8px; text-decoration: none;">
                  Inregistreaza-te din nou
                </a>
              </div>
            </div>
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px;">
              &copy; ${new Date().getFullYear()} Gym Builder. Toate drepturile rezervate.
            </p>
          </div>
          `,
          process.env.RESEND_API_KEY
        );
      }
    }

    // Get updated pending count
    const { count: pendingCount } = await supabase
      .from('supplier_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    return await localizedJson({
      ...supplierDecisionResult(data.company_name, action, emailSent),
      supplier: data,
      pendingCount: pendingCount || 0,
    });
  } catch (error) {
    console.error('Admin PATCH error:', error);
    return await localizedJson({ error: 'Eroare interna.' }, { status: 500 });
  }
}
