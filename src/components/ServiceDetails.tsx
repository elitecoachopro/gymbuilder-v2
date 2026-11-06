'use client';

import { SERVICE_CATEGORIES, hasServices } from '@/lib/gym-services';
import { useClientLocale } from '@/i18n/client';

export type ServiceDetailsData = { business_type?: string | null; service_categories?: string[] | null; service_areas?: string | null; service_brands?: string | null };
export default function ServiceDetails({ profile }: { profile: ServiceDetailsData }) {
  const en = useClientLocale() === 'en';
  if (!hasServices(profile.business_type)) return null;
  return <div className="my-4 space-y-3 rounded-xl border border-gold-400/20 bg-gold-400/5 p-4">
    <h3 className="font-semibold text-gold-300">Gym Service {en ? '& Maintenance' : 'și Mentenanță'}</h3>
    <ul className="flex flex-wrap gap-2">{(profile.service_categories || []).map(id => {
      const category = SERVICE_CATEGORIES.find(item => item.id === id);
      return <li key={id} className="rounded-full bg-anthracite-700 px-3 py-1 text-xs text-white">{category ? (en ? category.en : category.ro) : id}</li>;
    })}</ul>
    <p className="whitespace-pre-line break-words text-sm text-anthracite-200"><span className="font-medium">{en ? 'Coverage: ' : 'Acoperire: '}</span>{profile.service_areas}</p>
    {profile.service_brands && <p className="break-words text-sm text-anthracite-300"><span className="font-medium">{en ? 'Brands: ' : 'Mărci: '}</span>{profile.service_brands}</p>}
  </div>;
}
