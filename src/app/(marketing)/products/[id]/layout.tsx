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

  const { data: product } = await supabase
    .from('products')
    .select('id, name, description, price_eur, images, category, condition')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (!product) {
    return {
      title: 'Produs negăsit | GymBuilder',
      description: 'Produsul căutat nu a fost găsit pe GymBuilder.',
    };
  }

  const title = `${product.name} - ${product.price_eur}€ | GymBuilder`;
  const description = product.description
    ? product.description.substring(0, 155) + (product.description.length > 155 ? '...' : '')
    : `${product.name} - ${product.category}, ${product.condition}, ${product.price_eur}€ pe GymBuilder.`;
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gymbuilder.app';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${appUrl}/products/${id}`,
      siteName: 'GymBuilder',
      type: 'website',
      ...(imageUrl && {
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: product.name,
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

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
