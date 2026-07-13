'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Globe, MapPin, Star, Package, Send, X, Loader2, Building2, Phone } from 'lucide-react';

interface SupplierProfile {
  id: string;
  company_name: string;
  country: string;
  city: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  phone: string | null;
  plan: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  condition: string;
  price_eur: number;
  images: string[];
  status: string;
}

interface SupplierData {
  supplier: SupplierProfile;
  products: Product[];
  stats: { totalProducts: number; avgRating: number; reviewCount: number };
}

export default function SupplierProfilePage() {
  const params = useParams();
  const supplierId = params?.id as string;

  const [data, setData] = useState<SupplierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  useEffect(() => {
    if (supplierId) fetchSupplier();
  }, [supplierId]);

  async function fetchSupplier() {
    setLoading(true);
    try {
      const res = await fetch(`/api/suppliers/${supplierId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else if (res.status === 404) {
        setError('Furnizorul nu a fost găsit.');
      } else {
        setError('Eroare la încărcarea profilului.');
      }
    } catch {
      setError('Eroare de conexiune.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setFormLoading(true);
    try {
      const res = await fetch('/api/contact/supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, supplierId }),
      });
      if (res.ok) {
        setFormSuccess(true);
        setForm({ name: '', email: '', phone: '', message: '' });
      }
    } catch {
      // silent fail
    } finally {
      setFormLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-anthracite-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-anthracite-950 flex flex-col items-center justify-center px-4">
        <Building2 className="w-16 h-16 text-anthracite-600 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">{error || 'Furnizor negăsit'}</h1>
        <Link href="/suppliers" className="text-gold-400 hover:underline text-sm mt-4">
          ← Înapoi la furnizori
        </Link>
      </main>
    );
  }

  const { supplier, products, stats } = data;

  return (
    <main className="min-h-screen bg-anthracite-950">
      {/* Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-2xl p-6 max-w-lg w-full relative">
            <button onClick={() => { setShowModal(false); setFormSuccess(false); }} className="absolute top-4 right-4 text-anthracite-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            {formSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Cerere trimisă!</h3>
                <p className="text-sm text-anthracite-300">Furnizorul va fi notificat și te va contacta în cel mai scurt timp.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-white mb-1">Cerere Ofertă</h3>
                <p className="text-sm text-anthracite-400 mb-5">Trimite o cerere către <span className="text-gold-400">{supplier.company_name}</span></p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-anthracite-300 mb-1 block">Nume complet *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400/50"
                      placeholder="Ion Popescu"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-anthracite-300 mb-1 block">Email *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400/50"
                      placeholder="email@exemplu.ro"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-anthracite-300 mb-1 block">Telefon</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400/50"
                      placeholder="+40 7XX XXX XXX"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-anthracite-300 mb-1 block">Mesaj *</label>
                    <textarea
                      required
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400/50 resize-none h-28"
                      placeholder="Descrie ce echipamente cauți, cantitate, buget estimat..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full bg-gold-400 text-anthracite-950 font-bold py-3 rounded-lg hover:bg-gold-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Trimite Cererea
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-anthracite-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/suppliers" className="inline-flex items-center gap-2 text-sm text-anthracite-400 hover:text-gold-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Înapoi la furnizori
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Supplier Header */}
        <div className="bg-anthracite-800 border border-anthracite-700 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Logo */}
            <div className="w-24 h-24 bg-anthracite-700 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              {supplier.logo_url ? (
                <img src={supplier.logo_url} alt={supplier.company_name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-10 h-10 text-anthracite-500" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{supplier.company_name}</h1>
                  <div className="flex items-center gap-4 flex-wrap text-sm text-anthracite-300">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-anthracite-500" />
                      {supplier.city}, {supplier.country}
                    </span>
                    {supplier.website && (
                      <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-gold-400 hover:underline">
                        <Globe className="w-4 h-4" />
                        Website
                      </a>
                    )}
                    {supplier.phone && (
                      <a href={`tel:${supplier.phone}`} className="flex items-center gap-1.5 hover:text-white">
                        <Phone className="w-4 h-4 text-anthracite-500" />
                        {supplier.phone}
                      </a>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowModal(true)}
                  className="bg-gold-400 text-anthracite-950 font-bold px-6 py-3 rounded-lg hover:bg-gold-300 transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Cerere Ofertă
                </button>
              </div>

              {supplier.description && (
                <p className="text-anthracite-300 mt-4 leading-relaxed">{supplier.description}</p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 mt-5 pt-5 border-t border-anthracite-700">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gold-400" />
                  <span className="text-sm text-white font-medium">{stats.totalProducts}</span>
                  <span className="text-sm text-anthracite-400">produse</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                  <span className="text-sm text-white font-medium">{stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A'}</span>
                  <span className="text-sm text-anthracite-400">({stats.reviewCount} recenzii)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    supplier.plan === 'premium' ? 'bg-gold-400/10 text-gold-400 border border-gold-400/30' :
                    supplier.plan === 'professional' ? 'bg-blue-400/10 text-blue-400 border border-blue-400/30' :
                    'bg-anthracite-700 text-anthracite-300 border border-anthracite-600'
                  }`}>
                    {supplier.plan === 'premium' ? '⭐ Premium' : supplier.plan === 'professional' ? 'Pro' : 'Free'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Produse ({products.length})</h2>
          </div>

          {products.length === 0 ? (
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-12 text-center">
              <Package className="w-12 h-12 text-anthracite-600 mx-auto mb-3" />
              <p className="text-anthracite-400">Acest furnizor nu are produse listate momentan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-anthracite-800 border border-anthracite-700 rounded-xl overflow-hidden hover:border-anthracite-600 transition-colors group">
                  {/* Product Image */}
                  <div className="aspect-[4/3] bg-anthracite-700 relative overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-anthracite-500" />
                      </div>
                    )}
                    <span className={`absolute top-3 left-3 text-xs px-2 py-0.5 rounded-full font-medium ${
                      product.condition === 'new' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {product.condition === 'new' ? 'Nou' : 'Second-hand'}
                    </span>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <span className="text-xs text-anthracite-400 uppercase tracking-wider">{product.category}</span>
                    <h3 className="text-sm font-semibold text-white mt-1 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-gold-400">€{Number(product.price_eur).toLocaleString()}</span>
                      <button
                        onClick={() => setShowModal(true)}
                        className="text-xs bg-anthracite-700 text-anthracite-200 px-3 py-1.5 rounded-lg hover:bg-anthracite-600 transition-colors"
                      >
                        Ofertă
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
