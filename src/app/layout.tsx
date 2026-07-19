import type { Metadata } from 'next';
import './globals.css';
import GlobalHeader from '@/components/layout/GlobalHeader';
import CookieConsent from '@/components/CookieConsent';
import FloatingChatButton from '@/components/FloatingChatButton';
import { cookies } from 'next/headers';
import { LocaleProvider } from '@/i18n/LocaleProvider';

export const metadata: Metadata = {
  title: 'GymBuilder - Premium Gym Equipment Marketplace',
  description: 'Your complete platform for buying and selling premium gym equipment. Connect with suppliers, find quality products, and build your perfect fitness space.',
  keywords: ['gym equipment', 'fitness', 'suppliers', 'marketplace', 'commercial gym'],
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'ro';

  return (
    <html lang={locale} className="dark">
      <body className="min-h-screen bg-anthracite-950 text-white antialiased">
        <LocaleProvider initialLocale={locale}>
          <GlobalHeader />
          <div className="pt-16">
            {children}
          </div>
          <CookieConsent />
          <FloatingChatButton />
        </LocaleProvider>
      </body>
    </html>
  );
}
