import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type Props = {
  params: { id: string };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = getSupabase();
  const { id } = params;

  const { data: supplier } = await supabase
    .from('supplier_profiles')
    .select('id, company_name, description, logo_url, country, city')
    .eq('id', id)
    .eq('status', 'approved')
    .single();

  if (!supplier) {
    return {
      title: 'Furnizor negăsit | GymBuilder',
      description: 'Furnizorul căutat nu a fost găsit pe GymBuilder.',
    };
  }

  const title = `${supplier.company_name} - Furnizor echipamente fitness | GymBuilder`;
  const description = supplier.description
    ? supplier.description.substring(0, 155) + (supplier.description.length > 155 ? '...' : '')
    : `${supplier.company_name} - furnizor de echipamente fitness din ${supplier.city || supplier.country} pe GymBuilder.`;
  const imageUrl = supplier.logo_url || null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gymbuilder.app';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${appUrl}/suppliers/${id}`,
      siteName: 'GymBuilder',
      type: 'website',
      ...(imageUrl && {
        images: [
          {
            url: imageUrl,
            width: 400,
            height: 400,
            alt: supplier.company_name,
          },
        ],
      }),
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
