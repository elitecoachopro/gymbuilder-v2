import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import english from '@/i18n/ui.en.json';
import { translateUi } from '@/i18n/translate';

export async function localizedJson<T>(body: T, init?: ResponseInit) {
  const locale = (await cookies()).get('locale')?.value || 'ro';
  if (locale === 'en' && body && typeof body === 'object' && !Array.isArray(body)) {
    const localized = { ...body } as Record<string, unknown>;
    for (const key of ['error', 'message']) {
      if (typeof localized[key] === 'string') localized[key] = translateUi(localized[key], locale, english);
    }
    if (Array.isArray(localized.invalidRows)) localized.invalidRows = localized.invalidRows.map(row => ({ ...row, errors: Array.isArray(row.errors) ? row.errors.map((error: unknown) => translateUi(error, locale, english)) : row.errors }));
    return NextResponse.json(localized, init);
  }
  return NextResponse.json(body, init);
}
