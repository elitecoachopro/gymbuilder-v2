import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all users
    const { data: users } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false });

    // Get all supplier profiles
    const { data: suppliers } = await supabase
      .from('supplier_profiles')
      .select('id, company_name, user_id, status, city, country, created_at')
      .order('created_at', { ascending: false });

    // Get all products
    const { data: products } = await supabase
      .from('products')
      .select('id, name, supplier_id, category, status, price_eur, created_at')
      .order('created_at', { ascending: false });

    // Get all contact_requests
    const { data: contactRequests } = await supabase
      .from('contact_requests')
      .select('id, client_name, client_email, supplier_id, product_id, status, created_at, message')
      .order('created_at', { ascending: false });

    // Get all notifications
    const { data: notifications } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, created_at')
      .order('created_at', { ascending: false });

    // Get all contact_messages
    const { data: contactMessages } = await supabase
      .from('contact_messages')
      .select('id, name, email, subject, status, created_at')
      .order('created_at', { ascending: false });

    // Get all newsletter subscribers
    const { data: newsletter } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, created_at')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      users,
      suppliers,
      products,
      contactRequests,
      notifications,
      contactMessages,
      newsletter,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
