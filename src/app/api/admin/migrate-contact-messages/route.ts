import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create the contact_messages table using raw SQL via rpc
    // First try to check if table exists by querying it
    const { error: checkError } = await supabase.from('contact_messages').select('id').limit(1);
    
    if (checkError && checkError.message.includes('does not exist')) {
      // Table doesn't exist, create it via SQL
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql_text: `
          CREATE TABLE IF NOT EXISTS contact_messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'unread',
            admin_reply TEXT,
            replied_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
          CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
        `
      });

      if (sqlError) {
        return NextResponse.json({ 
          error: 'Cannot create table via RPC. Please create it manually in Supabase Dashboard.',
          details: sqlError.message,
          sql: `CREATE TABLE IF NOT EXISTS contact_messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
            admin_reply TEXT,
            replied_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );`
        }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Table contact_messages created successfully' });
    } else if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Table contact_messages already exists' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
