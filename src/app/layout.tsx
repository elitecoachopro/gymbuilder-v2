import type { Metadata } from 'next';
import './globals.css';
import GlobalHeader from '@/components/layout/GlobalHeader';
import CookieConsent from '@/components/CookieConsent';

export const metadata: Metadata = {
  title: 'GymBuilder - Premium Gym Equipment Marketplace',
  description: 'Your complete platform for buying and selling premium gym equipment. Connect with suppliers, find quality products, and build your perfect fitness space.',
  keywords: ['gym equipment', 'fitness', 'suppliers', 'marketplace', 'commercial gym'],
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" className="dark">
      <body className="min-h-screen bg-anthracite-950 text-white antialiased">
        <GlobalHeader />
        <div className="pt-16">
          {children}
        </div>
        <CookieConsent />
      </body>
    </html>
  );
}
