'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Shield, Users, Package, BarChart3, CheckCircle, XCircle, Loader2, Bell, Globe, Calendar, Mail, Building2, Dumbbell, Star, MessageSquare, LogOut, BadgeCheck, Send, Newspaper, Eye, Phone, MapPin, CreditCard, Clock } from 'lucide-react';
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
  verified: boolean;
  created_at: string;
  full_name: string;
  email: string;
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
  const [adminSection, setAdminSection] = useState<'suppliers' | 'reviews' | 'newsletter'>('suppliers');
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [reviewsPendingCount, setReviewsPendingCount] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewActionLoading, setReviewActionLoading] = useState<string | null>(null);

  // Newsletter states
  const [newsletterStats, setNewsletterStats] = useState<{ total: number; active: number; unsubscribed: number } | null>(null);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<any[]>([]);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterContent, setNewsletterContent] = useState('');
  const [newsletterSending, setNewsletterSending] = useState(false);
  const [viewProfileModal, setViewProfileModal] = useState<Supplier | null>(null);

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

  async function fetchNewsletter() {
    setNewsletterLoading(true);
    try {
      const res = await fetch('/api/admin/newsletter');
      if (res.ok) {
        const data = await res.json();
        setNewsletterStats(data.stats);
        setNewsletterSubscribers(data.subscribers || []);
      }
    } catch {} finally { setNewsletterLoading(false); }
  }

  async function sendNewsletter() {
    if (!newsletterSubject.trim() || !newsletterContent.trim()) {
      showToast('Subiectul și conținutul sunt obligatorii.', 'error');
      return;
    }
    setNewsletterSending(true);
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: newsletterSubject.trim(), content: newsletterContent.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Newsletter trimis!', 'success');
        setNewsletterSubject('');
        setNewsletterContent('');
      } else {
        showToast(data.error || 'Eroare la trimitere.', 'error');
      }
    } catch {
      showToast('Eroare de conexiune.', 'error');
    } finally {
      setNewsletterSending(false);
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

      {/* View Profile Modal */}
      {viewProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Profil Furnizor</h3>
              <button
                onClick={() => setViewProfileModal(null)}
                className="text-anthracite-400 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Company Name */}
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-anthracite-400 uppercase tracking-wide">Nume Companie</p>
                  <p className="text-white font-semibold">{viewProfileModal.company_name}</p>
                </div>
              </div>

              {/* Contact Person */}
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-anthracite-400 uppercase tracking-wide">Persoană de Contact</p>
                  <p className="text-white">{viewProfileModal.full_name || 'N/A'}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-anthracite-400 uppercase tracking-wide">Email</p>
                  <p className="text-white">{viewProfileModal.email || 'N/A'}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-anthracite-400 uppercase tracking-wide">Telefon</p>
                  <p className="text-white">{viewProfileModal.phone || 'N/A'}</p>
                </div>
              </div>

              {/* Website */}
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-anthracite-400 uppercase tracking-wide">Website</p>
                  {viewProfileModal.website ? (
                    <a href={viewProfileModal.website} target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:underline">
                      {viewProfileModal.website}
                    </a>
                  ) : (
                    <p className="text-anthracite-400">N/A</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-anthracite-400 uppercase tracking-wide">Locație</p>
                  <p className="text-white">
                    {viewProfileModal.city}{viewProfileModal.city && viewProfileModal.country ? ', ' : ''}{viewProfileModal.country || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Plan */}
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-anthracite-400 uppercase tracking-wide">Plan</p>
                  <p className="text-white capitalize">{viewProfileModal.plan || 'N/A'}</p>
                </div>
              </div>

              {/* Registration Date */}
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-anthracite-400 uppercase tracking-wide">Data Înregistrării</p>
                  <p className="text-white">{new Date(viewProfileModal.created_at).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-anthracite-400 uppercase tracking-wide">Status</p>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                    viewProfileModal.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                    viewProfileModal.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}>
                    {viewProfileModal.status === 'pending' ? 'În așteptare' : viewProfileModal.status === 'approved' ? 'Aprobat' : 'Respins'}
                  </span>
                  {viewProfileModal.verified && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      <BadgeCheck className="w-3.5 h-3.5" /> Verificat
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {viewProfileModal.description && (
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-anthracite-400 uppercase tracking-wide">Descriere</p>
                    <p className="text-sm text-anthracite-200 mt-1">{viewProfileModal.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-anthracite-700">
              <button
                onClick={() => setViewProfileModal(null)}
                className="flex-1 py-2.5 px-4 rounded-lg border border-anthracite-600 text-anthracite-300 hover:text-white text-sm font-medium transition-colors"
              >
                Închide
              </button>
              {viewProfileModal.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleAction(viewProfileModal.id, 'approve');
                      setViewProfileModal(null);
                    }}
                    disabled={actionLoading === viewProfileModal.id}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprobă
                  </button>
                  <button
                    onClick={() => {
                      setViewProfileModal(null);
                      setRejectModal(viewProfileModal.id);
                    }}
                    disabled={actionLoading === viewProfileModal.id}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-red-500 text-white hover:bg-red-600 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Respinge
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-anthracite-900 border-r border-anthracite-800 p-6 hidden lg:block overflow-y-auto">

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
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
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
          <div className="flex gap-1 bg-anthracite-900 rounded-lg p-1 mb-6 w-full sm:w-fit overflow-x-auto">
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
            <button
              onClick={() => { setAdminSection('newsletter'); fetchNewsletter(); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                adminSection === 'newsletter'
                  ? 'bg-anthracite-700 text-gold-400'
                  : 'text-anthracite-400 hover:text-white'
              }`}
            >
              <Newspaper className="w-4 h-4" /> Newsletter
            </button>
          </div>

          {adminSection === 'newsletter' ? (
            /* Newsletter Section */
            <NewsletterSection
              stats={newsletterStats}
              subscribers={newsletterSubscribers}
              loading={newsletterLoading}
              subject={newsletterSubject}
              setSubject={setNewsletterSubject}
              content={newsletterContent}
              setContent={setNewsletterContent}
              sending={newsletterSending}
              onSend={sendNewsletter}
              showToast={showToast}
            />
          ) : adminSection === 'reviews' ? (
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
                    <div key={review.id} className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-anthracite-400">
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
          <div className="flex gap-1 bg-anthracite-900 rounded-lg p-1 mb-6 w-full sm:w-fit overflow-x-auto">
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
                <div key={supplier.id} className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    {/* Supplier Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Building2 className="w-5 h-5 text-gold-400 flex-shrink-0" />
                        <h3 className="text-lg font-semibold text-white">{supplier.company_name}</h3>
                        {supplier.verified && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
                            <BadgeCheck className="w-3.5 h-3.5" /> Verificat
                          </span>
                        )}
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
                          <span>{supplier.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-anthracite-300">
                          <Users className="w-3.5 h-3.5 text-anthracite-500" />
                          <span>{supplier.full_name || 'N/A'}</span>
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

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0 flex-wrap border-t border-anthracite-700 sm:border-0 pt-3 sm:pt-0">
                      <button
                        onClick={() => setViewProfileModal(supplier)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-500/20 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Vizualizează profil
                      </button>
                    {activeTab === 'approved' && (
                      <>
                        <button
                          onClick={async () => {
                            setActionLoading(supplier.id);
                            try {
                              const res = await fetch('/api/admin/suppliers', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ supplierId: supplier.id, action: supplier.verified ? 'unverify' : 'verify' }),
                              });
                              const data = await res.json();
                              if (res.ok) {
                                showToast(data.message);
                                setSuppliers(prev => prev.map(s => s.id === supplier.id ? { ...s, verified: !s.verified } : s));
                              } else {
                                showToast(data.error || 'Eroare.', 'error');
                              }
                            } catch { showToast('Eroare de conexiune.', 'error'); }
                            finally { setActionLoading(null); }
                          }}
                          disabled={actionLoading === supplier.id}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                            supplier.verified
                              ? 'bg-anthracite-700 border border-anthracite-600 text-anthracite-300 hover:text-white'
                              : 'bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                          }`}
                        >
                          {actionLoading === supplier.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <BadgeCheck className="w-4 h-4" />
                          )}
                          {supplier.verified ? 'Revocă Verificare' : 'Marchează ca Verificat'}
                        </button>
                      </>
                    )}
                    {activeTab === 'pending' && (
                      <>
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
                      </>
                    )}
                    </div>
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

function NewsletterSection({
  stats,
  subscribers,
  loading,
  subject,
  setSubject,
  content,
  setContent,
  sending,
  onSend,
  showToast,
}: {
  stats: { total: number; active: number; unsubscribed: number } | null;
  subscribers: any[];
  loading: boolean;
  subject: string;
  setSubject: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  sending: boolean;
  onSend: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin mb-4" />
        <p className="text-anthracite-400 text-sm">Se încarcă datele newsletter...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-5">
            <p className="text-anthracite-400 text-xs uppercase tracking-wider mb-1">Total Abonați</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-5">
            <p className="text-anthracite-400 text-xs uppercase tracking-wider mb-1">Activi</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
          </div>
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-5">
            <p className="text-anthracite-400 text-xs uppercase tracking-wider mb-1">Dezabonați</p>
            <p className="text-2xl font-bold text-red-400">{stats.unsubscribed}</p>
          </div>
        </div>
      )}

      {/* Send Newsletter */}
      <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-6">
        <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
          <Send className="w-5 h-5 text-gold-400" />
          Trimite Newsletter
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-anthracite-400 text-sm mb-1 block">Subiect</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Echipamente noi disponibile pe GymBuilder"
              className="w-full bg-anthracite-900 border border-anthracite-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400 transition-colors"
            />
          </div>
          <div>
            <label className="text-anthracite-400 text-sm mb-1 block">Conținut</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Scrie conținutul email-ului aici..."
              rows={8}
              className="w-full bg-anthracite-900 border border-anthracite-700 rounded-lg px-4 py-3 text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400 transition-colors resize-y"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-anthracite-500 text-xs">
              Va fi trimis către {stats?.active || 0} abonați activi.
            </p>
            <button
              onClick={onSend}
              disabled={sending || !subject.trim() || !content.trim()}
              className="bg-gold-400 text-anthracite-950 px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-gold-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Se trimite...' : 'Trimite Newsletter'}
            </button>
          </div>
        </div>
      </div>

      {/* Subscribers List */}
      <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-6">
        <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-gold-400" />
          Lista Abonaților ({subscribers.length})
        </h3>
        {subscribers.length === 0 ? (
          <p className="text-anthracite-500 text-sm text-center py-8">Nu există abonați încă.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-anthracite-700">
                  <th className="text-left text-anthracite-400 font-medium py-2 px-3">Email</th>
                  <th className="text-left text-anthracite-400 font-medium py-2 px-3">Status</th>
                  <th className="text-left text-anthracite-400 font-medium py-2 px-3">Data abonării</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub: any) => (
                  <tr key={sub.id} className="border-b border-anthracite-700/50">
                    <td className="py-2.5 px-3 text-white">{sub.email}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        sub.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {sub.status === 'active' ? 'Activ' : 'Dezabonat'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-anthracite-400">
                      {new Date(sub.subscribed_at).toLocaleDateString('ro-RO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
