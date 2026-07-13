import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const checks: Record<string, { status: string; message?: string }> = {};
  let overallStatus = 'healthy';

  // Check environment variables
  const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
  if (missingEnvs.length > 0) {
    checks['environment'] = { status: 'warning', message: `Missing: ${missingEnvs.join(', ')}` };
    overallStatus = 'degraded';
  } else {
    checks['environment'] = { status: 'ok' };
  }

  // Check Supabase connection
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const { error } = await supabase.from('users').select('id').limit(1);
      if (error) {
        checks['database'] = { status: 'error', message: error.message };
        overallStatus = 'unhealthy';
      } else {
        checks['database'] = { status: 'ok' };
      }
    } catch (err: any) {
      checks['database'] = { status: 'error', message: err.message || 'Connection failed' };
      overallStatus = 'unhealthy';
    }
  } else {
    checks['database'] = { status: 'skipped', message: 'Supabase not configured' };
  }

  // Check Resend
  if (process.env.RESEND_API_KEY) {
    checks['email'] = { status: 'ok' };
  } else {
    checks['email'] = { status: 'warning', message: 'RESEND_API_KEY not set' };
    if (overallStatus === 'healthy') overallStatus = 'degraded';
  }

  // Check Stripe
  if (process.env.STRIPE_SECRET_KEY) {
    checks['payments'] = { status: 'ok' };
  } else {
    checks['payments'] = { status: 'skipped', message: 'Stripe not configured' };
  }

  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    checks,
  }, { status: statusCode });
}
