'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Building2, ExternalLink, Mail, Phone } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import { useClientLocale } from '@/i18n/client';
import { buildDirectory, buildGroups } from '@/lib/build-directory';
import { formatCatalogPrice } from '@/lib/catalog-price';
import { supplierEmail, supplierTelephone } from '@/lib/supplier-contact';

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400';

export default function BuildDirectory({ categorySlug }: { categorySlug?: string }) {
  const lang = useClientLocale() === 'en' ? 'en' : 'ro';
  const en = lang === 'en';
  const category = buildDirectory.categories.find(item => item.slug === categorySlug);
  const products = category ? buildDirectory.products.filter(item => item.categories.includes(category.slug)) : [];
  return <main className="min-h-screen">
    <section className="border-b border-anthracite-800 bg-gradient-to-b from-gold-400/5 to-transparent px-4 pb-10 pt-28">
      <div className="mx-auto max-w-6xl">
        {category ? <Link href="/construieste-sala" className={`mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-gold-400 ${focus}`}><ArrowLeft className="h-4 w-4" aria-hidden="true" />{en ? 'All categories' : 'Toate categoriile'}</Link>
          : <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-400/20 bg-gold-400/10 px-4 py-2 text-sm text-gold-400"><Building2 className="h-4 w-4" aria-hidden="true" />Gym Builder</span>}
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{category ? category.name[lang] : (en ? 'Products and services for your gym' : 'Produse și servicii pentru sală')}</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-anthracite-300">{category
          ? (en ? 'Explore products and services, then contact the supplier directly.' : 'Descoperă produse și servicii, apoi contactează direct furnizorul.')
          : (en ? 'Everything you need to equip a gym, organised into simple categories. Planning and final selection are covered in consultation.' : 'Tot ce trebuie să echipezi o sală, într-o listă simplă de categorii. Planificarea și selecția finală se stabilesc în consultanță.')}</p>
        {!category && <p className="mt-4 text-sm text-anthracite-400">{buildDirectory.categories.length} {en ? 'categories · No account needed' : 'categorii · Fără cont necesar'}</p>}
      </div>
    </section>
    {category ? <section className="mx-auto max-w-6xl px-4 py-10" aria-label={en ? 'Products and suppliers' : 'Produse și furnizori'}>
      <p className="mb-6 max-w-3xl text-sm leading-relaxed text-anthracite-300">{en ? 'Public supplier listings. Prices refer to the item or service shown, not a complete fitout. Confirm stock, VAT, transport and installation with the supplier.' : 'Listări publice ale furnizorilor. Prețurile se referă la produsul sau serviciul afișat, nu la amenajarea completă. Confirmă stocul, TVA-ul, transportul și montajul cu furnizorul.'}</p>
      <div className="grid gap-6 md:grid-cols-2">
        {products.map(listing => {
          const supplier = buildDirectory.suppliers.find(item => item.id === listing.supplierId)!;
          const price = formatCatalogPrice(null, lang, { listed_price_amount: listing.price, listed_price_currency: listing.currency });
          const phone = supplierTelephone(supplier.phone), email = supplierEmail(supplier.email);
          return <article key={listing.id} className="flex flex-col overflow-hidden rounded-2xl border border-anthracite-700 bg-anthracite-800">
            <a href={listing.sourceUrl} target="_blank" rel="noopener noreferrer" className={`flex h-56 items-center justify-center bg-white p-4 ${focus}`} aria-label={`${en ? 'Official page' : 'Pagina oficială'}: ${listing.name}`}><img src={listing.imageUrl} alt={listing.name} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-contain" /></a>
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <p className="mb-2 text-xs font-semibold text-gold-400">{listing.kind === 'service' ? (en ? 'Service' : 'Serviciu') : (en ? 'Product' : 'Produs')}</p>
              <h2 className="text-xl font-bold text-white">{listing.name}</h2>
              <p className="mt-2 text-sm text-anthracite-300">{supplier.name} · {supplier.country}</p>
              <p className="mt-5 text-2xl font-bold text-gold-400">{listing.priceFrom && listing.price !== null ? (en ? 'From ' : 'De la ') : ''}{price}{listing.priceMax != null ? ` – ${formatCatalogPrice(null, lang, { listed_price_amount: listing.priceMax, listed_price_currency: listing.currency })}` : ''}</p>
              <p className="mt-2 text-sm leading-relaxed text-anthracite-300">{listing.priceNote[lang]}</p>
              <p className="mb-5 mt-3 text-xs text-anthracite-400">{en ? 'Source checked: ' : 'Sursă verificată: '}<time dateTime={listing.checkedAt}>{new Date(listing.checkedAt).toLocaleDateString(en ? 'en-GB' : 'ro-RO', { timeZone: 'Europe/Bucharest' })}</time></p>
              <a href={listing.sourceUrl} target="_blank" rel="noopener noreferrer" className={`mt-auto inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-gold-400 px-4 py-2 text-sm font-bold text-anthracite-950 hover:bg-gold-300 ${focus}`}>{en ? 'View official listing' : 'Vezi oferta oficială'}<ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-anthracite-700 pt-4 text-sm">
                {phone && <a href={phone} className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-anthracite-600 px-3 text-white hover:border-gold-400 ${focus}`}><Phone className="h-4 w-4" aria-hidden="true" />{supplier.phone}</a>}
                {email && <a href={email} className={`inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg border border-anthracite-600 px-3 text-white hover:border-gold-400 ${focus}`}><Mail className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="break-all">{supplier.email}</span></a>}
                <a href={supplier.contactUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center gap-2 px-2 text-gold-400 hover:underline ${focus}`}>{en ? 'Supplier contact' : 'Contact furnizor'}<ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
              </div>
            </div>
          </article>;
        })}
      </div>
    </section> : <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      {Object.entries(buildGroups).map(([group, label]) => <section key={group} aria-labelledby={`build-${group}`}>
        <h2 id={`build-${group}`} className="mb-4 text-xl font-semibold text-white">{label[lang]}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {buildDirectory.categories.filter(item => item.group === group).map(item => <Link key={item.slug} href={`/construieste-sala/${item.slug}`} className={`group flex min-h-28 items-center justify-between gap-4 rounded-xl border border-anthracite-700 bg-anthracite-800 p-5 hover:border-gold-400/50 ${focus}`}>
            <div><h3 className="font-semibold text-white group-hover:text-gold-400">{item.name[lang]}</h3><span className="mt-2 block text-sm text-anthracite-300">{en ? 'Products and suppliers' : 'Produse și furnizori'}</span></div>
            <ArrowRight className="h-5 w-5 shrink-0 text-gold-400" aria-hidden="true" />
          </Link>)}
        </div>
      </section>)}
    </div>}
    <nav aria-label={en ? 'Plan your project' : 'Planifică proiectul'} className="mx-auto max-w-6xl flex flex-wrap gap-4 px-4 py-6">
      <Link href="/configurator" className="btn-primary">{en ? 'Design your gym in 2D / 3D' : 'Proiectează sala în 2D / 3D'}</Link>
      <Link href="/estimator-buget" className="btn-secondary">{en ? 'Estimate your budget' : 'Estimează bugetul'}</Link>
    </nav>
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-6">
      <div className="flex flex-col justify-between gap-5 rounded-2xl border border-gold-400/25 bg-gold-400/5 p-6 sm:flex-row sm:items-center sm:p-8">
        <div><h2 className="text-xl font-bold text-white">{en ? 'Your gym, planned together' : 'Sala ta, planificată împreună'}</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-anthracite-300">{en ? 'Layout, quantities, specifications and budget are developed in consultation.' : 'Compartimentarea, cantitățile, specificațiile și bugetul se dezvoltă în consultanță.'}</p></div>
        <Link href="/consultation" className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-gold-400 px-5 py-3 text-sm font-bold text-anthracite-950 hover:bg-gold-300 ${focus}`}>{en ? 'Request consultation' : 'Solicită consultanță'}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
    </section>
    <Footer />
  </main>;
}
