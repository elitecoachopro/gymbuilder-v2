import { localizedJson } from '@/lib/json-response';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { locale } = await request.json();
  
  if (!['ro', 'en'].includes(locale)) {
    return await localizedJson({ error: 'Invalid locale' }, { status: 400 });
  }

  const response = await localizedJson({ locale });
  response.cookies.set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });

  return response;
}
