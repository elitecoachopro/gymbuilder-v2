import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import * as crypto from 'crypto';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getUserFromSession(): { userId: string } | null {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  if (!sessionToken) return null;
  try {
    const [payload, signature] = sessionToken.split('.');
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.JWT_SECRET || '';
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    if (signature !== expected) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64').toString());
    if (data.exp && data.exp < Date.now()) return null;
    return { userId: data.userId };
  } catch {
    return null;
  }
}

// GET - Fetch notifications for the logged-in user
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Neautorizat.' }, { status: 401 });
    }

    const supabase = getSupabase();

    // Get last 10 notifications
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('id, type, title, message, link, is_read, created_at')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Notifications fetch error:', error);
      return NextResponse.json({ error: 'Eroare la încărcarea notificărilor.' }, { status: 500 });
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.userId)
      .eq('is_read', false);

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });
  } catch (err) {
    console.error('Notifications API error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}

// PATCH - Mark notification(s) as read
export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Neautorizat.' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAllRead } = body;

    const supabase = getSupabase();

    if (markAllRead) {
      // Mark all as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.userId)
        .eq('is_read', false);
    } else if (notificationId) {
      // Mark single notification as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.userId);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Notifications PATCH error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
