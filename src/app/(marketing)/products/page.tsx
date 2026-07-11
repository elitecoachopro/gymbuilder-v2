'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Search, Filter, Dumbbell, Heart, ShoppingCart, SlidersHorizontal } from 'lucide-react';

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
  { id: 1, name: 'Life Fitness Integrity Series Treadmill', brand: 'Life Fitness', category: 'Cardio', condition: 'Nou', price: 8500, image: null },
  { id: 2, name: 'Technogym Selection Pro Chest Press', brand: 'Technogym', category: 'Forță', condition: 'Nou', price: 4200, image: null },
  { id: 3, name: 'Matrix Rower', brand: 'Matrix', category: 'Cardio', condition: 'Nou', price: 2800, image: null },
  { id: 4, name: 'Hammer Strength HD Elite Power Rack', brand: 'Hammer Strength', category: 'Forță', condition: 'Nou', price: 3600, image: null },
  { id: 5, name: 'Precor EFX 885 Elliptical', brand: 'Precor', category: 'Cardio', condition: 'Second Hand', price: 3200, image: null },
  { id: 6, name: 'Cybex VR3 Leg Press', brand: 'Cybex', category: 'Forță', condition: 'Nou', price: 5100, image: null },
  { id: 7, name: 'TRX Suspension Training Set Pro', brand: 'TRX', category: 'Funcțional', condition: 'Nou', price: 450, image: null },
  { id: 8, name: 'Concept2 RowErg', brand: 'Concept2', category: 'Cardio', condition: 'Nou', price: 1200, image: null },
  { id: 9, name: 'Eleiko IWF Competition Set', brand: 'Eleiko', category: 'Forță', condition: 'Nou', price: 2800, image: null },
];

export default function ProductsPage() {
  return (
    <main className="min-h-screen">
      <Navbar />

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
              />
            </div>
            <button className="btn-secondary flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Filtre Avansate
            </button>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  cat.slug === 'all'
                    ? 'bg-gold-400 text-anthracite-950'
                    : 'border border-anthracite-600 text-anthracite-300 hover:border-gold-400 hover:text-gold-400'
                }`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <p className="text-anthracite-400 text-sm">{products.length} produse găsite</p>
            <select className="bg-anthracite-800 border border-anthracite-600 rounded-lg px-3 py-2 text-sm text-anthracite-200">
              <option>Sortare: Recomandate</option>
              <option>Preț: Crescător</option>
              <option>Preț: Descrescător</option>
              <option>Cele mai noi</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="card-hover group">
                {/* Image Placeholder */}
                <div className="relative h-52 bg-anthracite-700 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  <Dumbbell className="w-16 h-16 text-anthracite-500" />
                  <button className="absolute top-3 right-3 w-8 h-8 bg-anthracite-800/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="w-4 h-4 text-anthracite-300 hover:text-red-400" />
                  </button>
                  <span className={`absolute top-3 left-3 px-2 py-0.5 rounded text-xs font-medium ${
                    product.condition === 'Nou' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {product.condition}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gold-400 font-medium">{product.brand}</span>
                    <span className="text-xs text-anthracite-500">&middot;</span>
                    <span className="text-xs text-anthracite-400">{product.category}</span>
                  </div>
                  <h3 className="text-white font-semibold line-clamp-2 group-hover:text-gold-400 transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xl font-bold text-gold-400">&euro;{product.price.toLocaleString()}</span>
                    <button className="w-9 h-9 bg-gold-400/10 rounded-lg flex items-center justify-center hover:bg-gold-400 hover:text-anthracite-950 text-gold-400 transition-colors">
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
