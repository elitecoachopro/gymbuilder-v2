import type { SupabaseClient } from '@supabase/supabase-js';

interface Subscriber { id: string; email: string; status: string; subscribed_at: string; unsubscribed_at: string | null }

export async function loadNewsletterSubscribers(database: SupabaseClient, activeOnly = false) {
  const subscribers: Subscriber[] = [];
  for (let start = 0; ; start += 500) {
    let query = database.from('newsletter_subscribers').select('id, email, status, subscribed_at, unsubscribed_at')
      .order('subscribed_at', { ascending: false }).order('id').range(start, start + 499);
    if (activeOnly) query = query.eq('status', 'active');
    const { data, error } = await query;
    if (error) return { data: subscribers, error };
    subscribers.push(...data);
    if (data.length < 500) return { data: subscribers, error: null };
  }
}
