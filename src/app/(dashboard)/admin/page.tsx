'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Shield, Users, Package, BarChart3, CheckCircle, XCircle, Loader2, Bell, Globe, Calendar, Mail, Building2, Dumbbell, Star, MessageSquare, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

interface ReviewItem {
  id: string;
  client_name: string;
  client_email: string;
  rating: number;
  title: string;
  body: string | null;
  verified: boolean;
  created_at: string;
  supplier_profiles: { id: string; company_name: string };
}

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3, active: true },
  { href: '/suppliers', label: 'Furnizori', icon: Building2, active: false },
  { href: '/products', label: 'Produse', icon: Package, active: false },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [adminSection, setAdminSection] = useState<'suppliers' | 'reviews'>('suppliers');
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [reviewsPendingCount, setReviewsPendingCount] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewActionLoading, setReviewActionLoading] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 5000);
  };

  useEffect(() => {
    fetchSuppliers(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (adminSection === 'reviews') fetchReviews();
  }, [adminSection]);

  async function fetchReviews() {
    setReviewsLoading(true);
    try {
      const res = await fetch('/api/admin/reviews?status=unverified');
      if (res.ok) {
        const data = await res.json();
        setReviewsList(data.reviews || []);
        setReviewsPendingCount(data.pendingCount || 0);
      }
    } catch {}
    setReviewsLoading(false);
  }

  async function handleReviewAction(reviewId: string, action: 'approve' | 'reject') {
    setReviewActionLoading(reviewId);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, action }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message);
        setReviewsList(prev => prev.filter(r => r.id !== reviewId));
        setReviewsPendingCount(prev => Math.max(0, prev - 1));
      } else {
        showToast('Eroare.', 'error');
      }
    } catch {
      showToast('Eroare de conexiune.', 'error');
    }
    setReviewActionLoading(null);
  }

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
              <button
                onClick={handleLogout}
                disabled={logoutLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-anthracite-700 text-anthracite-300 hover:text-red-400 hover:border-red-400/30 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                {logoutLoading ? 'Se deconectează...' : 'Logout'}
              </button>
            </div>
          </div>

          {/* Section Switch */}
          <div className="flex gap-1 bg-anthracite-900 rounded-lg p-1 mb-6 w-fit">
            <button
              onClick={() => setAdminSection('suppliers')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                adminSection === 'suppliers'
                  ? 'bg-anthracite-700 text-gold-400'
                  : 'text-anthracite-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" /> Furnizori
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-anthracite-950 text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
              )}
            </button>
            <button
              onClick={() => setAdminSection('reviews')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                adminSection === 'reviews'
                  ? 'bg-anthracite-700 text-gold-400'
                  : 'text-anthracite-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Recenzii
              {reviewsPendingCount > 0 && (
                <span className="bg-amber-500 text-anthracite-950 text-xs font-bold px-1.5 py-0.5 rounded-full">{reviewsPendingCount}</span>
              )}
            </button>
          </div>

          {adminSection === 'reviews' ? (
            /* Reviews Moderation */
            <div>
              {reviewsLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-gold-400 animate-spin mb-4" />
                  <p className="text-anthracite-400 text-sm">Se încarcă recenziile...</p>
                </div>
              ) : reviewsList.length === 0 ? (
                <div className="text-center py-20">
                  <MessageSquare className="w-16 h-16 text-anthracite-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">Nicio recenzie de moderat</h2>
                  <p className="text-anthracite-400 text-sm">Toate recenziile au fost procesate.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewsList.map((review) => (
                    <div key={review.id} className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-6">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <div className="flex">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-gold-400 fill-gold-400' : 'text-anthracite-600'}`} />
                              ))}
                            </div>
                            <h3 className="text-base font-semibold text-white">{review.title}</h3>
                          </div>
                          {review.body && <p className="text-sm text-anthracite-300 mb-3">{review.body}</p>}
                          <div className="flex items-center gap-4 text-xs text-anthracite-400">
                            <span>De: <span className="text-white">{review.client_name}</span> ({review.client_email})</span>
                            <span>Furnizor: <span className="text-gold-400">{(review.supplier_profiles as any)?.company_name}</span></span>
                            <span>{new Date(review.created_at).toLocaleDateString('ro-RO')}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleReviewAction(review.id, 'approve')}
                            disabled={reviewActionLoading === review.id}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                          >
                            {reviewActionLoading === review.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Aprobă
                          </button>
                          <button
                            onClick={() => handleReviewAction(review.id, 'reject')}
                            disabled={reviewActionLoading === review.id}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Șterge
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
          /* Suppliers Section */
          <>
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
          </>
          )}
        </div>
      </div>
    </main>
  );
}
