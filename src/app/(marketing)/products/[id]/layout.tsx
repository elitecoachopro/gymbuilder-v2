import { Metadata } from 'next';
import { formatCatalogPrice } from '@/lib/catalog-price';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const english = (await cookies()).get('locale')?.value === 'en';
  const supabase = getSupabase();
  const { id } = await params;

  const { data: product } = await supabase
    .from('products')
    .select('id, name, description, price_eur, listed_price_amount, listed_price_currency, images, category, condition, supplier_profiles!inner(status)')
    .eq('id', id)
    .in('status', ['active', 'featured']).eq('supplier_profiles.status', 'approved')
    .single();

  if (!product) {
    return {
      title: english ? 'Product not found | Gym Builder' : 'Produs negăsit | Gym Builder',
      description: english ? 'This product was not found on Gym Builder.' : 'Produsul căutat nu a fost găsit pe Gym Builder.',
    };
  }

  const priceLabel = formatCatalogPrice(product.price_eur, english ? 'en' : 'ro', product);
  const title = `${product.name} - ${priceLabel} | Gym Builder`;
  const description = product.description
    ? product.description.substring(0, 155) + (product.description.length > 155 ? '...' : '')
    : `${product.name} - ${product.category}, ${product.condition}, ${priceLabel} ${english ? 'on' : 'pe'} Gym Builder.`;
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gymbuilder.app';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${appUrl}/products/${id}`,
      siteName: 'Gym Builder',
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
