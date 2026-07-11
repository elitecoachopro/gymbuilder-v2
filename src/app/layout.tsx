import type { Metadata } from 'next';
import './globals.css';

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
        {children}
      </body>
    </html>
  );
}
