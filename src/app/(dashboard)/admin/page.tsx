'use client';

import Link from 'next/link';
import { Dumbbell, Users, Package, Building2, TrendingUp, CheckCircle2, XCircle, Clock, BarChart3, Eye } from 'lucide-react';

const stats = [
  { label: 'Furnizori Activi', value: '48', change: '+3', icon: Building2 },
  { label: 'Produse Listate', value: '512', change: '+24', icon: Package },
  { label: 'Clienți', value: '1,240', change: '+89', icon: Users },
  { label: 'Venituri Lunare', value: '€12,450', change: '+18%', icon: TrendingUp },
];

const pendingSuppliers = [
  { id: 1, name: 'ProFit Equipment', company: 'SC ProFit SRL', city: 'Iași', date: '2024-01-15' },
  { id: 2, name: 'GymZone Direct', company: 'GymZone SRL', city: 'Brașov', date: '2024-01-14' },
  { id: 3, name: 'FitMax Pro', company: 'FitMax International', city: 'Constanța', date: '2024-01-13' },
];

const recentActivity = [
  { type: 'supplier_approved', text: 'FitPro Equipment a fost aprobat', time: '2 ore' },
  { type: 'product_added', text: 'Nou produs: Life Fitness T5 Treadmill', time: '4 ore' },
  { type: 'consultation', text: 'Cerere consultanță de la Ion Popescu', time: '6 ore' },
  { type: 'payment', text: 'Plată €149 de la Nordic Fitness', time: '8 ore' },
];

export default function AdminDashboard() {
  return (
    <main className="min-h-screen bg-anthracite-950">
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
          <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-gold-400/10 text-gold-400 font-medium text-sm">
            <BarChart3 className="w-4 h-4" /> Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-anthracite-300 hover:text-white hover:bg-anthracite-800 text-sm">
            <Building2 className="w-4 h-4" /> Furnizori
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-anthracite-300 hover:text-white hover:bg-anthracite-800 text-sm">
            <Package className="w-4 h-4" /> Produse
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-anthracite-300 hover:text-white hover:bg-anthracite-800 text-sm">
            <Users className="w-4 h-4" /> Clienți
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-anthracite-300 hover:text-white hover:bg-anthracite-800 text-sm">
            <TrendingUp className="w-4 h-4" /> Promovări
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-anthracite-400 text-sm mt-1">Bine ai revenit, Admin</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <div key={i} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-gold-400/10 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-gold-400" />
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">{stat.change}</span>
                </div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-anthracite-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Suppliers */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Furnizori în Așteptare</h3>
                <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">
                  {pendingSuppliers.length} noi
                </span>
              </div>
              <div className="space-y-3">
                {pendingSuppliers.map((supplier) => (
                  <div key={supplier.id} className="flex items-center justify-between p-3 bg-anthracite-900 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">{supplier.company}</p>
                      <p className="text-xs text-anthracite-400">{supplier.city} &middot; {supplier.date}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center hover:bg-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </button>
                      <button className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center hover:bg-red-500/20">
                        <XCircle className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Activitate Recentă</h3>
              <div className="space-y-3">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-anthracite-900 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-gold-400" />
                    <div className="flex-1">
                      <p className="text-sm text-anthracite-200">{activity.text}</p>
                    </div>
                    <span className="text-xs text-anthracite-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
