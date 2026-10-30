import { notFound } from 'next/navigation';
import BuildDirectory from '@/components/BuildDirectory';
import { buildDirectory } from '@/lib/build-directory';

export function generateStaticParams() {
  return buildDirectory.categories.map(category => ({ category: category.slug }));
}

export default async function BuildCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!buildDirectory.categories.some(item => item.slug === category)) notFound();
  return <BuildDirectory categorySlug={category} />;
}
