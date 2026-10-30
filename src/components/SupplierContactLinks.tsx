'use client';

import Link from 'next/link';
import { ExternalLink, Phone, Mail } from 'lucide-react';
import { useUiText } from '@/i18n/useUiText';
import { supplierTelephone, supplierWebsite, supplierEmail } from '@/lib/supplier-contact';

export default function SupplierContactLinks({ supplierId, phone, website, email }: { supplierId: string; phone?: string | null; website?: string | null; email?: string | null }) {
  const ui = useUiText();
  const emailHref = supplierEmail(email);
  const phoneHref = supplierTelephone(phone);
  const websiteHref = supplierWebsite(website);
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {phoneHref && <a href={phoneHref} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-anthracite-600 px-3 text-white hover:border-gold-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400"><Phone aria-hidden="true" className="h-4 w-4 shrink-0" />{phone}</a>}
      {phone && !phoneHref && <span className="break-words text-anthracite-300">{ui("Telefon")}: {phone}</span>}
      {emailHref && <a href={emailHref} className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg border border-anthracite-600 px-3 text-white hover:border-gold-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400"><Mail aria-hidden="true" className="h-4 w-4 shrink-0" /><span className="break-all">{email}</span></a>}
      {websiteHref && <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-anthracite-600 px-3 text-white hover:border-gold-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400">{ui('Site furnizor')}<ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" /></a>}
      <Link href={`/suppliers/${supplierId}`} className="inline-flex min-h-11 items-center rounded-lg bg-gold-400/10 px-3 font-semibold text-gold-400 hover:bg-gold-400/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400">{ui('Contact și profil furnizor')}</Link>
    </div>
  );
}
