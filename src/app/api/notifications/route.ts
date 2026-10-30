import { cookies } from 'next/headers';
import { translateUi } from '@/i18n/translate';
import english from '@/i18n/ui.en.json';
import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { getSessionUser } from '@/lib/session-server';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getUserFromSession(_request?: unknown) { return getSessionUser(); }

// GET - Fetch notifications for the logged-in user
export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return await localizedJson({ error: 'Neautorizat.' }, { status: 401 });
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
      return await localizedJson({ error: 'Eroare la încărcarea notificărilor.' }, { status: 500 });
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.userId)
      .eq('is_read', false);

    const locale = (await cookies()).get('locale')?.value || 'ro';
    return await localizedJson({
      notifications: (notifications || []).map(notification => ({ ...notification, title: translateUi(notification.title, locale, english), message: (notification.type === 'price_drop' || notification.type === 'new_request' && (notification.message.startsWith('Produs solicitat:') || notification.message === 'Cerere nouă')) ? translateUi(notification.message, locale, english) : notification.message })),
      unreadCount: unreadCount || 0,
    });
  } catch (err) {
    console.error('Notifications API error:', err);
    return await localizedJson({ error: 'Eroare internă.' }, { status: 500 });
  }
}

// PATCH - Mark notification(s) as read
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return await localizedJson({ error: 'Neautorizat.' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAllRead } = body;

    const supabase = getSupabase();

    if (markAllRead !== true && (typeof notificationId !== 'string' || !/^[a-f0-9-]{36}$/i.test(notificationId))) return await localizedJson({ error: 'Date invalide.' }, { status: 400 });
    let update = supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    if (markAllRead === true) update = update.eq('is_read', false);
    else update = update.eq('id', notificationId);
    const { error } = await update;
    if (error) return await localizedJson({ error: 'Eroare la actualizare.' }, { status: 500 });

    return await localizedJson({ success: true });
  } catch (err) {
    console.error('Notifications PATCH error:', err);
    return await localizedJson({ error: 'Eroare internă.' }, { status: 500 });
  }
}
