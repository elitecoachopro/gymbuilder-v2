'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Search, MapPin, Star, Filter, Building2, Globe, Phone } from 'lucide-react';

const suppliers = [
  { id: 1, name: 'FitPro Equipment', country: 'România', city: 'București', plan: 'professional', rating: 4.8, products: 45, description: 'Distribuitor oficial Life Fitness și Hammer Strength pentru Europa de Est.' },
  { id: 2, name: 'GymTech Solutions', country: 'România', city: 'Cluj-Napoca', plan: 'enterprise', rating: 4.9, products: 120, description: 'Soluții complete pentru echiparea sălilor de fitness comerciale.' },
  { id: 3, name: 'IronWorks RO', country: 'România', city: 'Timișoara', plan: 'starter', rating: 4.5, products: 28, description: 'Echipamente de forță și funcționale la prețuri competitive.' },
  { id: 4, name: 'Nordic Fitness', country: 'Suedia', city: 'Stockholm', plan: 'professional', rating: 4.7, products: 67, description: 'Importator Technogym și Precor pentru piața nordică și est-europeană.' },
  { id: 5, name: 'EuroGym Direct', country: 'Germania', city: 'Berlin', plan: 'enterprise', rating: 4.9, products: 200, description: 'Cel mai mare distribuitor de echipamente fitness din Europa Centrală.' },
  { id: 6, name: 'Fitness Factory', country: 'Polonia', city: 'Varșovia', plan: 'professional', rating: 4.6, products: 89, description: 'Producător și distribuitor de echipamente fitness comerciale.' },
];

const countries = ['Toate', 'România', 'Germania', 'Suedia', 'Polonia', 'Italia', 'Spania'];

export default function SuppliersPage() {
  return (
    <main className="min-h-screen">
      <Navbar />

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
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-anthracite-400" />
            <input
              type="text"
              placeholder="Caută furnizori..."
              className="input-field pl-12"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            {countries.slice(0, 5).map((country) => (
              <button
                key={country}
                className="px-4 py-2.5 rounded-lg text-sm font-medium border border-anthracite-600 text-anthracite-300 hover:border-gold-400 hover:text-gold-400 transition-colors"
              >
                {country}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Suppliers Grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="card-hover">
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

                <h3 className="text-lg font-semibold text-white mb-1">{supplier.name}</h3>
                <div className="flex items-center gap-2 text-sm text-anthracite-400 mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  {supplier.city}, {supplier.country}
                </div>

                <p className="text-sm text-anthracite-400 mb-4 line-clamp-2">{supplier.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-anthracite-700">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                    <span className="text-sm font-medium text-white">{supplier.rating}</span>
                  </div>
                  <span className="text-sm text-anthracite-400">{supplier.products} produse</span>
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
