'use client';

import Link from 'next/link';
import { Dumbbell, Package, Eye, TrendingUp, Plus, Edit, BarChart3, Megaphone, Settings, Star } from 'lucide-react';
import { useState } from 'react';

const stats = [
  { label: 'Produse Active', value: '24', icon: Package },
  { label: 'Vizualizări Luna', value: '1,847', icon: Eye },
  { label: 'Cereri Ofertă', value: '12', icon: TrendingUp },
  { label: 'Rating Mediu', value: '4.8', icon: Star },
];

const products = [
  { id: 1, name: 'Life Fitness Integrity Treadmill', category: 'Cardio', price: 8500, views: 234, status: 'active' },
  { id: 2, name: 'Technogym Selection Pro', category: 'Forță', price: 4200, views: 189, status: 'active' },
  { id: 3, name: 'Matrix Rower', category: 'Cardio', price: 2800, views: 156, status: 'featured' },
  { id: 4, name: 'Hammer Strength HD Elite', category: 'Forță', price: 3600, views: 98, status: 'inactive' },
];

const sidebarLinks = [
  { href: '/supplier/dashboard', label: 'Dashboard', icon: BarChart3, active: true },
  { href: '/supplier/products', label: 'Produsele Mele', icon: Package, active: false },
  { href: null, label: 'Promovări', icon: Megaphone, active: false, comingSoon: true },
  { href: null, label: 'Analytics', icon: TrendingUp, active: false, comingSoon: true },
  { href: null, label: 'Setări', icon: Settings, active: false, comingSoon: true },
];

export default function SupplierDashboard() {
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <main className="min-h-screen bg-anthracite-950">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-anthracite-800 border border-gold-400/30 text-gold-400 px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in">
          {toast}
        </div>
      )}

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-anthracite-900 border-r border-anthracite-800 p-6 hidden lg:block">
        <Link href="/" className="flex items-center gap-2 mb-10">
          <Dumbbell className="w-7 h-7 text-gold-400" />
          <span className="text-lg font-bold">
            <span className="text-white">Gym</span>
            <span className="text-gold-400">Builder</span>
          </span>
        </Link>

        <nav className="space-y-1">
          {sidebarLinks.map((link) => (
            link.href ? (
              <Link
                key={link.label}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${
                  link.active
                    ? 'bg-gold-400/10 text-gold-400 font-medium'
                    : 'text-anthracite-300 hover:text-white hover:bg-anthracite-800'
                }`}
              >
                <link.icon className="w-4 h-4" /> {link.label}
              </Link>
            ) : (
              <button
                key={link.label}
                onClick={() => showToast(`${link.label} - Funcționalitate în curând!`)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-anthracite-300 hover:text-white hover:bg-anthracite-800 text-sm w-full text-left"
              >
                <link.icon className="w-4 h-4" /> {link.label}
              </button>
            )
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-gold-400/5 border border-gold-400/20 rounded-xl p-4">
            <p className="text-xs text-gold-400 font-medium mb-1">Plan: Professional</p>
            <p className="text-xs text-anthracite-400">76/100 produse folosite</p>
            <div className="w-full h-1.5 bg-anthracite-700 rounded-full mt-2">
              <div className="w-3/4 h-full bg-gold-400 rounded-full" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Supplier Dashboard</h1>
              <p className="text-anthracite-400 text-sm mt-1">FitPro Equipment &middot; Professional Plan</p>
            </div>
            <Link href="/supplier/products/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Adaugă Produs
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <div key={i} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-gold-400/10 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-gold-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-anthracite-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Products Table */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Produsele Mele</h3>
              <Link href="/supplier/products/new" className="text-sm text-gold-400 hover:text-gold-300">
                + Adaugă Produs
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-anthracite-700">
                    <th className="text-left text-xs font-medium text-anthracite-400 pb-3">Produs</th>
                    <th className="text-left text-xs font-medium text-anthracite-400 pb-3">Categorie</th>
                    <th className="text-left text-xs font-medium text-anthracite-400 pb-3">Preț</th>
                    <th className="text-left text-xs font-medium text-anthracite-400 pb-3">Vizualizări</th>
                    <th className="text-left text-xs font-medium text-anthracite-400 pb-3">Status</th>
                    <th className="text-right text-xs font-medium text-anthracite-400 pb-3">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-anthracite-800">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-anthracite-800/50">
                      <td className="py-3 text-sm text-white font-medium">{product.name}</td>
                      <td className="py-3 text-sm text-anthracite-300">{product.category}</td>
                      <td className="py-3 text-sm text-gold-400 font-medium">&euro;{product.price.toLocaleString()}</td>
                      <td className="py-3 text-sm text-anthracite-300">{product.views}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                          product.status === 'featured' ? 'bg-gold-400/10 text-gold-400' :
                          'bg-anthracite-700 text-anthracite-400'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => showToast('Editare produs - Funcționalitate în curând!')}
                          className="p-1.5 hover:bg-anthracite-700 rounded"
                        >
                          <Edit className="w-4 h-4 text-anthracite-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
