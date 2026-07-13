'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Shield, Users, Package, BarChart3, CheckCircle, XCircle, Loader2, Bell, Globe, Calendar, Mail, Building2, Dumbbell, TrendingUp } from 'lucide-react';

interface Supplier {
  id: string;
  user_id: string;
  company_name: string;
  country: string;
  city: string;
  website: string | null;
  phone: string | null;
  description: string | null;
  status: string;
  plan: string;
  created_at: string;
  users: { full_name: string; email: string };
}

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3, active: true },
  { href: '/suppliers', label: 'Furnizori', icon: Building2, active: false },
  { href: '/products', label: 'Produse', icon: Package, active: false },
  { href: null, label: 'Clienți', icon: Users, active: false, comingSoon: true },
  { href: null, label: 'Promovări', icon: TrendingUp, active: false, comingSoon: true },
];

export default function AdminDashboard() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 5000);
  };

  useEffect(() => {
    fetchSuppliers(activeTab);
  }, [activeTab]);

  async function fetchSuppliers(status: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/suppliers?status=${status}`);
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers || []);
        setPendingCount(data.pendingCount || 0);
      } else if (res.status === 403) {
        showToast('Acces interzis. Trebuie să fii admin.', 'error');
      } else {
        showToast('Eroare la încărcarea datelor.', 'error');
      }
    } catch {
      showToast('Eroare de conexiune.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(supplierId: string, action: 'approve' | 'reject', reason?: string) {
    setActionLoading(supplierId);
    try {
      const res = await fetch('/api/admin/suppliers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, action, reason }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(data.message + (data.emailSent ? '' : ' (email nu a putut fi trimis)'));
        setSuppliers(prev => prev.filter(s => s.id !== supplierId));
        setPendingCount(data.pendingCount ?? Math.max(0, pendingCount - 1));
        setRejectModal(null);
        setRejectReason('');
      } else {
        showToast(data.error || 'Eroare.', 'error');
      }
    } catch {
      showToast('Eroare de conexiune.', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-anthracite-950">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-sm animate-fade-in border max-w-md ${
          toastType === 'success'
            ? 'bg-anthracite-800 border-gold-400/30 text-gold-400'
            : 'bg-anthracite-800 border-red-400/30 text-red-400'
        }`}>
          {toast}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-2">Respinge Furnizor</h3>
            <p className="text-sm text-anthracite-300 mb-4">
              Opțional, adaugă un motiv care va fi trimis furnizorului prin email.
            </p>
            <textarea
              className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg p-3 text-sm text-white placeholder-anthracite-500 resize-none h-24 focus:outline-none focus:border-gold-400/50"
              placeholder="Motiv respingere (opțional)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2.5 px-4 rounded-lg border border-anthracite-600 text-anthracite-300 hover:text-white text-sm font-medium transition-colors"
              >
                Anulează
              </button>
              <button
                onClick={() => handleAction(rejectModal, 'reject', rejectReason || undefined)}
                disabled={actionLoading === rejectModal}
                className="flex-1 py-2.5 px-4 rounded-lg bg-red-500 text-white hover:bg-red-600 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === rejectModal ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Respinge
              </button>
            </div>
          </div>
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
                {link.label === 'Dashboard' && pendingCount > 0 && (
                  <span className="ml-auto bg-amber-500 text-anthracite-950 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {pendingCount}
                  </span>
                )}
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
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header with pending badge */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-anthracite-400 text-sm mt-1">Gestionează furnizorii și platforma</p>
            </div>
            <div className="flex items-center gap-3">
              {pendingCount > 0 && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">{pendingCount} pending</span>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-anthracite-900 rounded-lg p-1 mb-6 w-fit">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'bg-anthracite-700 text-gold-400'
                  : 'text-anthracite-400 hover:text-white'
              }`}
            >
              Pending
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-anthracite-950 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'approved'
                  ? 'bg-anthracite-700 text-emerald-400'
                  : 'text-anthracite-400 hover:text-white'
              }`}
            >
              Aprobați
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'rejected'
                  ? 'bg-anthracite-700 text-red-400'
                  : 'text-anthracite-400 hover:text-white'
              }`}
            >
              Respinși
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gold-400 animate-spin mb-4" />
              <p className="text-anthracite-400 text-sm">Se încarcă furnizorii...</p>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-anthracite-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                {activeTab === 'pending' ? 'Niciun furnizor pending' : 
                 activeTab === 'approved' ? 'Niciun furnizor aprobat' : 'Niciun furnizor respins'}
              </h2>
              <p className="text-anthracite-400 text-sm">
                {activeTab === 'pending' ? 'Toate cererile au fost procesate.' : 'Nu există furnizori cu acest status.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    {/* Supplier Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Building2 className="w-5 h-5 text-gold-400 flex-shrink-0" />
                        <h3 className="text-lg font-semibold text-white">{supplier.company_name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          supplier.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                          supplier.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                          'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>
                          {supplier.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                        <div className="flex items-center gap-2 text-sm text-anthracite-300">
                          <Mail className="w-3.5 h-3.5 text-anthracite-500" />
                          <span>{supplier.users?.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-anthracite-300">
                          <Users className="w-3.5 h-3.5 text-anthracite-500" />
                          <span>{supplier.users?.full_name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-anthracite-300">
                          <Globe className="w-3.5 h-3.5 text-anthracite-500" />
                          <span>{supplier.city}{supplier.city && supplier.country ? ', ' : ''}{supplier.country}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-anthracite-300">
                          <Calendar className="w-3.5 h-3.5 text-anthracite-500" />
                          <span>{new Date(supplier.created_at).toLocaleDateString('ro-RO')}</span>
                        </div>
                      </div>

                      {supplier.description && (
                        <p className="text-sm text-anthracite-400 mt-3 line-clamp-2">{supplier.description}</p>
                      )}

                      {supplier.website && (
                        <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-xs text-gold-400 hover:underline mt-2 inline-block">
                          {supplier.website}
                        </a>
                      )}
                    </div>

                    {/* Actions - only for pending */}
                    {activeTab === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleAction(supplier.id, 'approve')}
                          disabled={actionLoading === supplier.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === supplier.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Aprobă
                        </button>
                        <button
                          onClick={() => setRejectModal(supplier.id)}
                          disabled={actionLoading === supplier.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Respinge
                        </button>
                      </div>
                    )}
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
