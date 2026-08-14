import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const suppliers = [
      {
        email: 'longglorychina@gmail.com',
        company: 'Qingdao Long Glory Technology Co., Ltd.',
        name: 'David Wang',
        lang: 'en',
      },
      {
        email: 'contact@gymbuilder.app',
        company: 'Sc Gymbuilder srl',
        name: 'Murat Naser',
        lang: 'ro',
      },
    ];

    const results = [];

    for (const supplier of suppliers) {
      const subject = supplier.lang === 'en'
        ? 'Boost your visibility on GymBuilder — Add photos & products'
        : 'Crește-ți vizibilitatea pe GymBuilder — Adaugă poze și produse';

      const html = supplier.lang === 'en'
        ? `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 32px; margin-bottom: 24px;">
              <h1 style="color: #f5c518; font-size: 24px; margin: 0 0 8px 0;">GymBuilder</h1>
              <p style="color: #ffffff; font-size: 14px; margin: 0; opacity: 0.8;">Professional Fitness Equipment Marketplace</p>
            </div>
            
            <h2 style="color: #1a1a2e; font-size: 20px; margin-bottom: 16px;">Hello ${supplier.name},</h2>
            
            <p style="color: #333; font-size: 15px; line-height: 1.6;">
              Thank you for registering <strong>${supplier.company}</strong> on GymBuilder! Your account has been approved and is now active.
            </p>
            
            <p style="color: #333; font-size: 15px; line-height: 1.6;">
              To maximize your visibility and attract more potential buyers, we recommend:
            </p>
            
            <div style="background: #f8f9fa; border-left: 4px solid #f5c518; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
              <h3 style="color: #1a1a2e; font-size: 16px; margin: 0 0 12px 0;">📸 Upload verification photos (minimum 3)</h3>
              <p style="color: #555; font-size: 14px; margin: 0; line-height: 1.5;">
                Photos of your showroom, warehouse, equipment in stock, or team. These help build trust with potential buyers and verify your business.
              </p>
            </div>
            
            <div style="background: #f8f9fa; border-left: 4px solid #f5c518; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
              <h3 style="color: #1a1a2e; font-size: 16px; margin: 0 0 12px 0;">🏋️ Add your products</h3>
              <p style="color: #555; font-size: 14px; margin: 0; line-height: 1.5;">
                List your fitness equipment with photos, prices, and descriptions. Each product gets its own page visible to gym owners across Romania.
              </p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://www.gymbuilder.app/login" style="display: inline-block; background: #f5c518; color: #1a1a2e; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                Go to Supplier Dashboard →
              </a>
            </div>
            
            <p style="color: #666; font-size: 13px; line-height: 1.5; border-top: 1px solid #eee; padding-top: 16px; margin-top: 32px;">
              If you have any questions, reply to this email or contact us at contact@gymbuilder.app.<br>
              Best regards,<br>
              <strong>The GymBuilder Team</strong>
            </p>
          </div>
        `
        : `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 32px; margin-bottom: 24px;">
              <h1 style="color: #f5c518; font-size: 24px; margin: 0 0 8px 0;">GymBuilder</h1>
              <p style="color: #ffffff; font-size: 14px; margin: 0; opacity: 0.8;">Marketplace Profesional de Echipamente Fitness</p>
            </div>
            
            <h2 style="color: #1a1a2e; font-size: 20px; margin-bottom: 16px;">Bună ${supplier.name},</h2>
            
            <p style="color: #333; font-size: 15px; line-height: 1.6;">
              Mulțumim că ai înregistrat <strong>${supplier.company}</strong> pe GymBuilder! Contul tău a fost aprobat și este acum activ.
            </p>
            
            <p style="color: #333; font-size: 15px; line-height: 1.6;">
              Pentru a-ți maximiza vizibilitatea și a atrage mai mulți potențiali cumpărători, îți recomandăm:
            </p>
            
            <div style="background: #f8f9fa; border-left: 4px solid #f5c518; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
              <h3 style="color: #1a1a2e; font-size: 16px; margin: 0 0 12px 0;">📸 Încarcă poze de verificare (minim 3)</h3>
              <p style="color: #555; font-size: 14px; margin: 0; line-height: 1.5;">
                Poze cu showroom-ul, depozitul, echipamentele în stoc sau echipa ta. Acestea construiesc încredere cu potențialii cumpărători și verifică afacerea ta.
              </p>
            </div>
            
            <div style="background: #f8f9fa; border-left: 4px solid #f5c518; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
              <h3 style="color: #1a1a2e; font-size: 16px; margin: 0 0 12px 0;">🏋️ Adaugă produsele tale</h3>
              <p style="color: #555; font-size: 14px; margin: 0; line-height: 1.5;">
                Listează echipamentele fitness cu poze, prețuri și descrieri. Fiecare produs primește propria pagină, vizibilă proprietarilor de săli din toată România.
              </p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://www.gymbuilder.app/login" style="display: inline-block; background: #f5c518; color: #1a1a2e; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                Mergi la Dashboard Furnizor →
              </a>
            </div>
            
            <p style="color: #666; font-size: 13px; line-height: 1.5; border-top: 1px solid #eee; padding-top: 16px; margin-top: 32px;">
              Dacă ai întrebări, răspunde la acest email sau contactează-ne la contact@gymbuilder.app.<br>
              Cu respect,<br>
              <strong>Echipa GymBuilder</strong>
            </p>
          </div>
        `;

      const { data, error } = await resend.emails.send({
        from: 'GymBuilder <noreply@gymbuilder.app>',
        to: supplier.email,
        subject,
        html,
        replyTo: 'contact@gymbuilder.app',
      });

      results.push({
        email: supplier.email,
        company: supplier.company,
        lang: supplier.lang,
        success: !error,
        messageId: data?.id || null,
        error: error?.message || null,
      });
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
