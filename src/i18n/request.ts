import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const locales = ['ro', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ro';

export default getRequestConfig(async () => {
  // 1. Check cookie
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('locale')?.value;
  
  // 2. Check Accept-Language header as fallback
  const headerStore = await headers();
  const acceptLanguage = headerStore.get('accept-language') || '';
  const headerLocale = acceptLanguage.startsWith('en') ? 'en' : undefined;
  
  // 3. Determine locale (cookie > header > default)
  const locale = (locales.includes(cookieLocale as Locale) ? cookieLocale : headerLocale || defaultLocale) as Locale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
