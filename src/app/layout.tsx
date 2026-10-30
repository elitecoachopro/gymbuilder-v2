import type { Metadata } from 'next';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow/700.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import './globals.css';
import GlobalHeader from '@/components/layout/GlobalHeader';
import CookieConsent from '@/components/CookieConsent';
import FloatingChatButton from '@/components/FloatingChatButton';
import { cookies } from 'next/headers';
import { LocaleProvider } from '@/i18n/LocaleProvider';

const englishMetadata: Metadata = {
  title: 'Gym Builder - Premium Gym Equipment Marketplace',
  description: 'Your complete platform for buying and selling premium gym equipment. Connect with suppliers, find quality products, and build your perfect fitness space.',
  keywords: ['gym equipment', 'fitness', 'suppliers', 'marketplace', 'commercial gym'],
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await cookies()).get('locale')?.value;
  return locale === 'en' ? englishMetadata : { title: 'Gym Builder - Echipamente profesionale pentru săli de fitness', description: 'Platforma pentru cumpărarea și vânzarea echipamentelor de fitness. Găsește furnizori, compară produse și configurează sala ta.', keywords: ['echipamente fitness', 'furnizori', 'sală de fitness', 'marketplace'] };
}

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value === 'en' ? 'en' : 'ro';

  return (
    <html lang={locale} className="dark">
      <body className="min-h-screen bg-anthracite-950 text-white antialiased">
        <LocaleProvider initialLocale={locale}>
          <GlobalHeader />
          <div className="pt-[var(--app-header-height)]">
            {children}
          </div>
          <CookieConsent />
          <FloatingChatButton />
        </LocaleProvider>
      </body>
    </html>
  );
}
