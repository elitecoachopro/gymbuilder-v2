'use client';

import { createContactSender } from '@/lib/contact-sender';
import Modal from '@/components/Modal';
import { useUiText } from '@/i18n/useUiText';

import type { SupplierProfile } from '@/types/database';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import MarketNavigation from '@/components/MarketNavigation';
import SupplierContactLinks from '@/components/SupplierContactLinks';
import BuyingGuide from '@/components/BuyingGuide';
import SupplierSourceDetails, { type SupplierSourceInfo } from '@/components/SupplierSourceDetails';
import { isMarket, marketName } from '@/lib/markets';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Building2, Mail, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SupplierItem extends SupplierSourceInfo {
  id: string;
  contact_email: string | null;
  phone: string | null;
  website: string | null;
  name: string;
  country: string;
  city: string;
  plan: string;
  products: number;
  description: string;
  verified: boolean;
}

export default function SuppliersPage() {
  const ui = useUiText();
  const params = useSearchParams();
  const marketParam = params?.get('market') || '';
  const market = isMarket(marketParam) ? marketParam : '';
  useEffect(() => { setPage(1); }, [market]);
  const [sendContact] = useState(() => createContactSender('/api/contact/supplier'));
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactModal, setShowContactModal] = useState<number | string | null>(null);
  const [toast, setToast] = useState('');
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [fetchError, setFetchError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchSuppliers() {
      setLoading(true); setFetchError('');
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (searchQuery) params.set('search', searchQuery);
        if (market) params.set('market', market);
        const res = await fetch(`/api/suppliers?${params.toString()}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setPages(data.pages || 1);
          const mapped = (data.suppliers || []).map((s: Pick<SupplierProfile, 'id' | 'company_name' | 'country' | 'city' | 'plan' | 'description' | 'verified' | 'phone' | 'website' | 'contact_email' | 'listing_source_url' | 'listing_checked_at' | 'catalog_url'> & { product_count: number }) => ({
            id: s.id, name: s.company_name, country: s.country || '', city: s.city || '',
            plan: s.plan || 'free', products: s.product_count || 0,
            description: s.description || '', verified: s.verified || false, phone: s.phone, website: s.website, contact_email: s.contact_email, listing_source_url: s.listing_source_url, listing_checked_at: s.listing_checked_at, catalog_url: s.catalog_url,
          }));
          setSuppliers(mapped);
        } else throw new Error('Eroare la încărcarea profilului.');
      } catch (error) {
        if (!controller.signal.aborted) { setSuppliers([]); setFetchError(error instanceof Error ? error.message : 'Eroare de conexiune.'); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    const debounce = setTimeout(fetchSuppliers, 300);
    return () => { clearTimeout(debounce); controller.abort(); };
  }, [searchQuery, page, market]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const sendEnquiry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (sending) return;
    setSending(true); setFormError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await sendContact({ supplierId: showContactModal, name: form.get('name'), email: form.get('email'), message: form.get('message') });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Cererea nu a putut fi trimisă.');
      showToast('Cererea de ofertă a fost salvată.'); setShowContactModal(null);
    } catch (error) { setFormError(error instanceof Error ? error.message : 'Eroare de conexiune.'); }
    finally { setSending(false); }
  };

  return (
    <main className="min-h-screen">

      {/* Toast */}
      {toast && (
        <div className="fixed top-[calc(var(--app-header-height)+1rem)] right-4 z-50 bg-anthracite-800 border border-gold-400/30 text-gold-400 px-4 py-3 rounded-lg shadow-lg text-sm">
          {ui(toast)}
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal !== null && (
        <Modal onClose={() => setShowContactModal(null)} label={ui("Cerere Ofertă")}>
          <div className="glass-card p-8 max-w-md w-full relative">
            <button
              aria-label={ui("Închide")} onClick={() => setShowContactModal(null)}
              className="absolute top-4 right-4 text-anthracite-400 hover:text-white text-xl"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold text-white mb-2">{ui("Cerere Ofertă")}</h3>
            <p className="text-sm text-anthracite-400 mb-6">
              {ui("Trimite o cerere de ofertă către ")}{suppliers.find(s => s.id === showContactModal)?.name}
            </p>
            {formError && <p role="alert" className="text-red-400 mb-3">{ui(formError)}</p>}
            <form onSubmit={sendEnquiry} className="space-y-4">
              <div>
                <label htmlFor="field-marketingsuppliers-3037" className="block text-sm font-medium text-anthracite-200 mb-1.5">{ui("Nume *")}</label>
                <input id="field-marketingsuppliers-3037" name="name" type="text" className="input-field" placeholder={ui("Numele tău")} minLength={2} maxLength={120} required />
              </div>
              <div>
                <label htmlFor="field-marketingsuppliers-3277" className="block text-sm font-medium text-anthracite-200 mb-1.5">Email *</label>
                <input id="field-marketingsuppliers-3277" name="email" type="email" className="input-field" placeholder="email@exemplu.com" required />
              </div>
              <div>
                <label htmlFor="field-marketingsuppliers-3526" className="block text-sm font-medium text-anthracite-200 mb-1.5">{ui("Mesaj *")}</label>
                <textarea id="field-marketingsuppliers-3526" name="message" maxLength={5000} className="input-field min-h-[100px] resize-y" placeholder={ui("Descrie ce echipamente cauți...")} required />
              </div>
              <button type="submit" disabled={sending} className="btn-primary w-full py-3">
                {ui("Trimite Cererea")}</button>
            </form>
          </div>
        </Modal>
      )}

      <section className="pt-24 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Catalog <span className="gold-gradient">{ui(marketName(market) || "Furnizori")}</span>
          </h1>
          <p className="text-anthracite-300 text-lg max-w-2xl">
            {ui("Descoperă furnizori de echipamente fitness din România, Asia și restul lumii. Contactează-i direct pentru achiziție.")}</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-8"><MarketNavigation selected={market} directory /></div>

      {/* Filters */}
      <section className="py-6 px-4 border-b border-anthracite-800">
        <div className="max-w-7xl mx-auto">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-anthracite-400" />
            <input
              type="text"
              aria-label={ui("Caută furnizori...")} placeholder={ui("Caută furnizori...")}
              className="input-field pl-12"
              value={searchQuery}
              onChange={(e) => { setPage(1); setSearchQuery(e.target.value); }}
            />
          </div>
        </div>
      </section>

      {/* Suppliers Grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
            </div>
          ) : fetchError ? <p role="alert" className="text-red-400">{ui(fetchError)}</p> : suppliers.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-12 h-12 text-anthracite-600 mx-auto mb-4" />
              <p className="text-anthracite-400">{ui("Nu s-au găsit furnizori")}{ui(searchQuery ? ' cu aceste filtre' : ' momentan')}.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="card-hover flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-anthracite-700 rounded-xl flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-gold-400" />
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    supplier.plan === 'enterprise' ? 'bg-gold-400/10 text-gold-400 border border-gold-400/20' :
                    supplier.plan === 'professional' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    'bg-anthracite-700 text-anthracite-300'
                  }`}>
                    {supplier.listing_source_url ? ui('Profil informativ') : supplier.plan.charAt(0).toUpperCase() + supplier.plan.slice(1)}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                  {supplier.name}
                  {supplier.verified && (
                    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-medium" title={ui("Furnizor Verificat")}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      {ui("Verificat")}</span>
                  )}
                </h3>
                <div className="flex items-center gap-2 text-sm text-anthracite-400 mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  {supplier.city}{ui(supplier.city && supplier.country ? ', ' : '')}{supplier.country}
                </div>

                <p className="text-sm text-anthracite-400 mb-4 line-clamp-2 flex-1">{supplier.description}</p>

                <div className="flex items-center justify-end pt-4 border-t border-anthracite-700 mb-4">
                  <span className="text-sm text-anthracite-400">{supplier.products} {ui("produse")}</span>
                </div>

                <div className="mb-4"><SupplierSourceDetails supplier={supplier} /></div>
                <div className="mb-4"><SupplierContactLinks supplierId={supplier.id} phone={supplier.phone} website={supplier.website} email={supplier.contact_email} /></div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link
                    href={`/products?supplier=${supplier.id}${market ? `&market=${market}` : ""}`}
                    className="flex-1 text-center py-2.5 rounded-lg text-sm font-medium border border-anthracite-600 text-anthracite-200 hover:border-gold-400 hover:text-gold-400 transition-colors"
                  >
                    {ui("Vezi Produse")}</Link>
                  {!supplier.listing_source_url && <button
                    onClick={() => { setFormError(''); setShowContactModal(supplier.id); }}
                    className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5" /> {ui("Cerere Ofertă")}</button>}
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

{pages > 1 && <nav aria-label={ui("Paginare furnizori")} className="flex justify-center items-center gap-4 py-8"><button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{ui("Înapoi")}</button><span>{page} / {pages}</span><button className="btn-secondary" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>{ui("Înainte")}</button></nav>}
      <div className="max-w-7xl mx-auto px-4 pb-12"><BuyingGuide /></div>
      <Footer />
    </main>
  );
}
