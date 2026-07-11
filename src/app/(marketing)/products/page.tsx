'use client';

import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Search, Filter, Dumbbell, Heart, ShoppingCart, SlidersHorizontal, Mail } from 'lucide-react';
import { useState } from 'react';

const categories = [
  { slug: 'all', name: 'Toate', count: 500 },
  { slug: 'cardio', name: 'Cardio', count: 120 },
  { slug: 'strength', name: 'Forță', count: 180 },
  { slug: 'functional', name: 'Funcțional', count: 85 },
  { slug: 'accessories', name: 'Accesorii', count: 60 },
  { slug: 'wellness', name: 'Wellness', count: 30 },
  { slug: 'lockers', name: 'Vestiare', count: 15 },
  { slug: 'reception', name: 'Recepție', count: 10 },
];

const products = [
  { id: 1, name: 'Life Fitness Integrity Series Treadmill', brand: 'Life Fitness', category: 'Cardio', condition: 'Nou', price: 8500, supplier: 'FitPro Equipment' },
  { id: 2, name: 'Technogym Selection Pro Chest Press', brand: 'Technogym', category: 'Forță', condition: 'Nou', price: 4200, supplier: 'GymTech Solutions' },
  { id: 3, name: 'Matrix Rower', brand: 'Matrix', category: 'Cardio', condition: 'Nou', price: 2800, supplier: 'Nordic Fitness' },
  { id: 4, name: 'Hammer Strength HD Elite Power Rack', brand: 'Hammer Strength', category: 'Forță', condition: 'Nou', price: 3600, supplier: 'FitPro Equipment' },
  { id: 5, name: 'Precor EFX 885 Elliptical', brand: 'Precor', category: 'Cardio', condition: 'Second Hand', price: 3200, supplier: 'EuroGym Direct' },
  { id: 6, name: 'Cybex VR3 Leg Press', brand: 'Cybex', category: 'Forță', condition: 'Nou', price: 5100, supplier: 'Fitness Factory' },
  { id: 7, name: 'TRX Suspension Training Set Pro', brand: 'TRX', category: 'Funcțional', condition: 'Nou', price: 450, supplier: 'IronWorks RO' },
  { id: 8, name: 'Concept2 RowErg', brand: 'Concept2', category: 'Cardio', condition: 'Nou', price: 1200, supplier: 'Nordic Fitness' },
  { id: 9, name: 'Eleiko IWF Competition Set', brand: 'Eleiko', category: 'Forță', condition: 'Nou', price: 2800, supplier: 'EuroGym Direct' },
];

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [toast, setToast] = useState('');
  const [showContactModal, setShowContactModal] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const toggleFavorite = (productId: number) => {
    if (favorites.includes(productId)) {
      setFavorites(favorites.filter(id => id !== productId));
      showToast('Eliminat din favorite');
    } else {
      setFavorites([...favorites, productId]);
      showToast('Adăugat la favorite ❤️');
    }
  };

  const categoryMap: Record<string, string> = { 'Cardio': 'cardio', 'Forță': 'strength', 'Funcțional': 'functional', 'Accesorii': 'accessories', 'Wellness': 'wellness', 'Vestiare': 'lockers', 'Recepție': 'reception' };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'all' || categoryMap[p.category] === activeCategory;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen">
      <Navbar />

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
              Solicită ofertă pentru: {products.find(p => p.id === showContactModal)?.name}
            </p>
            <form onSubmit={(e) => { e.preventDefault(); showToast('Cerere de ofertă trimisă cu succes!'); setShowContactModal(null); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Nume *</label>
                <input type="text" className="input-field" placeholder="Numele tău" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Email *</label>
                <input type="email" className="input-field" placeholder="email@exemplu.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Cantitate</label>
                <input type="number" className="input-field" placeholder="1" min="1" defaultValue={1} />
              </div>
              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Mesaj</label>
                <textarea className="input-field min-h-[80px] resize-y" placeholder="Detalii suplimentare..." />
              </div>
              <button type="submit" className="btn-primary w-full py-3">
                Trimite Cererea de Ofertă
              </button>
            </form>
          </div>
        </div>
      )}

      <section className="pt-24 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Catalog <span className="gold-gradient">Echipamente</span>
          </h1>
          <p className="text-anthracite-300 text-lg max-w-2xl">
            Peste 500 de echipamente fitness de la branduri premium, verificate și gata de livrare.
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="py-6 px-4 border-b border-anthracite-800 sticky top-16 z-40 bg-anthracite-950/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-anthracite-400" />
              <input
                type="text"
                placeholder="Caută echipamente, branduri..."
                className="input-field pl-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => showToast('Filtre avansate - Funcționalitate în curând!')}
              className="btn-secondary flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtre Avansate
            </button>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.slug
                    ? 'bg-gold-400 text-anthracite-950'
                    : 'border border-anthracite-600 text-anthracite-300 hover:border-gold-400 hover:text-gold-400'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <p className="text-anthracite-400 text-sm">{filteredProducts.length} produse găsite</p>
            <select className="bg-anthracite-800 border border-anthracite-600 rounded-lg px-3 py-2 text-sm text-anthracite-200">
              <option>Sortare: Recomandate</option>
              <option>Preț: Crescător</option>
              <option>Preț: Descrescător</option>
              <option>Cele mai noi</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="card-hover group flex flex-col">
                {/* Image Placeholder */}
                <div className="relative h-52 bg-anthracite-700 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  <Dumbbell className="w-16 h-16 text-anthracite-500" />
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-anthracite-800/80 rounded-full flex items-center justify-center hover:bg-anthracite-700 transition-all"
                  >
                    <Heart className={`w-4 h-4 transition-colors ${
                      favorites.includes(product.id) ? 'text-red-400 fill-red-400' : 'text-anthracite-300 hover:text-red-400'
                    }`} />
                  </button>
                  <span className={`absolute top-3 left-3 px-2 py-0.5 rounded text-xs font-medium ${
                    product.condition === 'Nou' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {product.condition}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gold-400 font-medium">{product.brand}</span>
                    <span className="text-xs text-anthracite-500">&middot;</span>
                    <span className="text-xs text-anthracite-400">{product.category}</span>
                  </div>
                  <h3 className="text-white font-semibold line-clamp-2 group-hover:text-gold-400 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-anthracite-500">de la {product.supplier}</p>
                </div>

                {/* Price + Actions */}
                <div className="flex items-center justify-between pt-4 mt-3 border-t border-anthracite-700">
                  <span className="text-xl font-bold text-gold-400">&euro;{product.price.toLocaleString()}</span>
                  <button
                    onClick={() => setShowContactModal(product.id)}
                    className="px-3 py-2 bg-gold-400/10 rounded-lg flex items-center gap-1.5 hover:bg-gold-400 hover:text-anthracite-950 text-gold-400 transition-colors text-sm font-medium"
                  >
                    <Mail className="w-3.5 h-3.5" /> Ofertă
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <Dumbbell className="w-12 h-12 text-anthracite-600 mx-auto mb-4" />
              <p className="text-anthracite-400">Nu s-au găsit produse cu aceste filtre.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
