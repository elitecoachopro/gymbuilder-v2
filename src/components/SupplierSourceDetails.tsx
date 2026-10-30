'use client';

import { useUiText } from '@/i18n/useUiText';
import { useClientLocale } from '@/i18n/client';
import { supplierWebsite } from '@/lib/supplier-contact';

export interface SupplierSourceInfo {
  listing_source_url?: string | null;
  listing_checked_at?: string | null;
  catalog_url?: string | null;
}

export default function SupplierSourceDetails({ supplier }: { supplier: SupplierSourceInfo }) {
  const ui = useUiText();
  const locale = useClientLocale();
  const source = supplierWebsite(supplier.listing_source_url);
  const catalog = supplierWebsite(supplier.catalog_url);
  if (!source) return null;
  return <div className="space-y-2 text-sm">
    <span className="inline-block rounded-md border border-anthracite-600 bg-anthracite-800 px-2 py-1 text-xs font-semibold text-anthracite-200">{ui('Profil din surse publice')}</span>
    <p className="text-anthracite-400">{ui('Informații documentate de Gym Builder din site-ul oficial. Listarea nu indică un parteneriat comercial.')}</p>
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      <a className="inline-flex min-h-11 items-center text-gold-400 hover:underline" href={source} target="_blank" rel="noopener noreferrer">{ui('Sursa și contactul oficial')}</a>
      {catalog && <a className="inline-flex min-h-11 items-center text-gold-400 hover:underline" href={catalog} target="_blank" rel="noopener noreferrer">{ui('Catalog oficial')}</a>}
    </div>
    {supplier.listing_checked_at && <p className="text-xs text-anthracite-400">{ui('Documentat la')}: {new Date(supplier.listing_checked_at).toLocaleDateString(locale)}</p>}
  </div>;
}
