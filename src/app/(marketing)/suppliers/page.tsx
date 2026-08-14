'use client';

import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import { Search, MapPin, Star, Building2, Mail, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SupplierItem {
  id: number | string;
  name: string;
  country: string;
  city: string;
  plan: string;
  rating: number;
  products: number;
  description: string;
  verified: boolean;
}

export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactModal, setShowContactModal] = useState<number | string | null>(null);
  const [toast, setToast] = useState('');
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSuppliers() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        const res = await fetch(`/api/suppliers?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const mapped = (data.suppliers || []).map((s: any) => ({
            id: s.id, name: s.company_name, country: s.country || '', city: s.city || '',
            plan: s.plan || 'free', rating: 4.5, products: s.product_count || 0,
            description: s.description || '', verified: s.verified || false,
          }));
          setSuppliers(mapped);
        } else {
          setSuppliers([]);
        }
      } catch {
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    }
    const debounce = setTimeout(fetchSuppliers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <main className="min-h-screen">

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-anthracite-800 border border-gold-400/30 text-gold-400 px-4 py-3 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass-card p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowContactModal(null)}
              className="absolute top-4 right-4 text-anthracite-400 hover:text-white text-xl"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Cerere Ofertă</h3>
            <p className="text-sm text-anthracite-400 mb-6">
              Trimite o cerere de ofertă către {suppliers.find(s => s.id === showContactModal)?.name}
            </p>
            <form onSubmit={(e) => { e.preventDefault(); showToast('Cerere trimisă cu succes!'); setShowContactModal(null); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Nume *</label>
                <input type="text" className="input-field" placeholder="Numele tău" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Email *</label>
                <input type="email" className="input-field" placeholder="email@exemplu.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Mesaj *</label>
                <textarea className="input-field min-h-[100px] resize-y" placeholder="Descrie ce echipamente cauți..." required />
              </div>
              <button type="submit" className="btn-primary w-full py-3">
                Trimite Cererea
              </button>
            </form>
          </div>
        </div>
      )}

      <section className="pt-24 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Catalog <span className="gold-gradient">Furnizori</span>
          </h1>
          <p className="text-anthracite-300 text-lg max-w-2xl">
            Descoperă furnizori verificați de echipamente fitness din toată Europa.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 px-4 border-b border-anthracite-800">
        <div className="max-w-7xl mx-auto">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-anthracite-400" />
            <input
              type="text"
              placeholder="Caută furnizori..."
              className="input-field pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          ) : suppliers.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-12 h-12 text-anthracite-600 mx-auto mb-4" />
              <p className="text-anthracite-400">Nu s-au găsit furnizori{searchQuery ? ' cu aceste filtre' : ' momentan'}.</p>
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
                    {supplier.plan.charAt(0).toUpperCase() + supplier.plan.slice(1)}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                  {supplier.name}
                  {supplier.verified && (
                    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-medium" title="Furnizor Verificat">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      Verificat
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2 text-sm text-anthracite-400 mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  {supplier.city}{supplier.city && supplier.country ? ', ' : ''}{supplier.country}
                </div>

                <p className="text-sm text-anthracite-400 mb-4 line-clamp-2 flex-1">{supplier.description}</p>

                <div className="flex items-center justify-end pt-4 border-t border-anthracite-700 mb-4">
                  <span className="text-sm text-anthracite-400">{supplier.products} produse</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link
                    href={`/products?supplier=${supplier.id}`}
                    className="flex-1 text-center py-2.5 rounded-lg text-sm font-medium border border-anthracite-600 text-anthracite-200 hover:border-gold-400 hover:text-gold-400 transition-colors"
                  >
                    Vezi Produse
                  </Link>
                  <button
                    onClick={() => setShowContactModal(supplier.id)}
                    className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5" /> Cerere Ofertă
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
