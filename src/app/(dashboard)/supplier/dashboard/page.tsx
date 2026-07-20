'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dumbbell, Package, Eye, TrendingUp, Plus, Edit, BarChart3, Megaphone, Star, LogOut, X, CheckCircle2, Crown, Zap, Mail, Phone, PackagePlus, Inbox, Send, Loader2, MessageSquare, ImagePlus, Trash2, Camera, ArrowUpRight, ArrowDownRight, Minus, ChevronDown, ChevronUp, LayoutGrid } from 'lucide-react';
import { useState, useEffect } from 'react';
import NotificationBell from '@/components/NotificationBell';
import { useClientTranslations } from '@/i18n/client';

interface SupplierData {
  id: string;
  companyName: string;
  status: string;
  plan: string;
  planExpiresAt: string | null;
}

interface StatsData {
  totalProducts: number;
  activeProducts: number;
  totalContactRequests: number;
  contactRequestsThisMonth: number;
  reviewCount: number;
  avgRating: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price_eur: number;
  status: string;
  images: string[];
  created_at: string;
}

interface ContactRequest {
  id: string;
  client_name: string;
  client_email: string;
  message: string;
  status: string;
  created_at: string;
}

interface SlotsData {
  ofertaZilei: { total: number; occupied: number; available: number };
  anunturiZilei: { total: number; occupied: number; available: number };
}

export default function SupplierDashboard() {
  const router = useRouter();
  const { t, locale } = useClientTranslations('supplierDashboard');
  const [toast, setToast] = useState('');
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactType, setContactType] = useState<'oferta' | 'anunt'>('oferta');
  const [slots, setSlots] = useState<SlotsData | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(true);

  // Reply states
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySending, setReplySending] = useState(false);

  // Chat states
  const [openChat, setOpenChat] = useState<string | null>(null);

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Gallery states
  const [galleryImages, setGalleryImages] = useState<{id: string; image_url: string; caption: string; created_at: string}[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryCaption, setGalleryCaption] = useState('');

  // Real data states
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState<SupplierData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [recentRequests, setRecentRequests] = useState<ContactRequest[]>([]);
  const [error, setError] = useState('');

  // Sidebar links (inside component to use t())
  const sidebarLinks = [
    { href: '/supplier/dashboard', label: t('sidebar.dashboard'), icon: BarChart3, active: true },
    { href: '/supplier/products', label: t('sidebar.myProducts'), icon: Package, active: false },
    { href: null, label: t('sidebar.analytics'), icon: TrendingUp, active: false, scrollTo: 'analytics' },
    { href: null, label: t('sidebar.gallery'), icon: Camera, active: false, scrollTo: 'gallery' },
    { href: null, label: t('sidebar.promotions'), icon: Megaphone, active: false, scrollTo: 'promotions' },
  ];

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch('/api/supplier/dashboard');
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (res.status === 404) {
          setError(t('errors.noProfile'));
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setError(t('errors.loadError'));
          setLoading(false);
          return;
        }
        const data = await res.json();
        setSupplier(data.supplier);
        setStats(data.stats);
        setRecentProducts(data.recentProducts || []);
        setRecentRequests(data.recentRequests || []);
      } catch {
        setError(t('errors.connectionError'));
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [router]);

  useEffect(() => {
    async function fetchSlots() {
      try {
        const res = await fetch('/api/promotions');
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots || null);
        }
      } catch {
        // Silently fail
      } finally {
        setSlotsLoading(false);
      }
    }
    fetchSlots();
  }, []);

  // Gallery functions
  const fetchGallery = async () => {
    setGalleryLoading(true);
    try {
      const res = await fetch('/api/supplier/gallery');
      if (res.ok) {
        const data = await res.json();
        setGalleryImages(data.images || []);
      }
    } catch {} finally { setGalleryLoading(false); }
  };

  useEffect(() => { fetchGallery(); }, []);

  // Fetch analytics
  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/supplier/analytics');
        if (res.ok) {
          const data = await res.json();
          setAnalyticsData(data.analytics || []);
        }
      } catch {} finally { setAnalyticsLoading(false); }
    }
    fetchAnalytics();
  }, []);

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (galleryImages.length >= 10) { showToast(t('gallery.limitReached')); return; }
    setGalleryUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', galleryCaption);
      const res = await fetch('/api/supplier/gallery', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setGalleryImages(prev => [data.image, ...prev]);
        setGalleryCaption('');
        showToast(t('gallery.imageAdded'));
      } else {
        const err = await res.json();
        showToast(err.error || t('gallery.uploadError'));
      }
    } catch { showToast(t('gallery.uploadError')); }
    finally { setGalleryUploading(false); }
    e.target.value = '';
  };

  const handleGalleryDelete = async (imageId: string) => {
    if (!confirm(t('gallery.deleteConfirm'))) return;
    try {
      const res = await fetch(`/api/supplier/gallery?id=${imageId}`, { method: 'DELETE' });
      if (res.ok) {
        setGalleryImages(prev => prev.filter(img => img.id !== imageId));
        showToast(t('gallery.imageDeleted'));
      }
    } catch { showToast(t('gallery.deleteError')); }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const openContactModal = (type: 'oferta' | 'anunt') => {
    setContactType(type);
    setShowContactModal(true);
  };

  const dateLocale = locale === 'en' ? 'en-GB' : 'ro-RO';

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-anthracite-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-anthracite-400 text-sm">{t('loading')}</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen bg-anthracite-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{t('errors.title')}</h2>
          <p className="text-anthracite-400 mb-6">{error}</p>
          <Link href="/" className="btn-primary">{t('errors.backHome')}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-anthracite-950">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-anthracite-800 border border-gold-400/30 text-gold-400 px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in">
          {toast}
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-anthracite-900 border border-anthracite-700 rounded-2xl p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-anthracite-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gold-400/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                {contactType === 'oferta' ? <Crown className="w-7 h-7 text-gold-400" /> : <Zap className="w-7 h-7 text-gold-400" />}
              </div>
              <h3 className="text-xl font-bold text-white">
                {contactType === 'oferta' ? t('promotions.modalReserveOferta') : t('promotions.modalReserveAnunt')}
              </h3>
              <p className="text-anthracite-400 text-sm mt-2">
                {contactType === 'oferta' ? t('promotions.modalOfertaDesc') : t('promotions.modalAnuntDesc')}
              </p>
            </div>

            <div className="space-y-4">
              <a
                href="mailto:contact@gymbuilder.app?subject=Rezervare%20Promovare%20-%20GymBuilder"
                className="flex items-center gap-3 w-full px-4 py-3 bg-gold-400/10 border border-gold-400/30 rounded-xl text-gold-400 hover:bg-gold-400/20 transition-colors"
              >
                <Mail className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-medium">{t('promotions.email')}</p>
                  <p className="text-xs text-anthracite-400">contact@gymbuilder.app</p>
                </div>
              </a>

              <a
                href="tel:+40743891218"
                className="flex items-center gap-3 w-full px-4 py-3 bg-anthracite-800 border border-anthracite-700 rounded-xl text-white hover:border-gold-400/30 transition-colors"
              >
                <Phone className="w-5 h-5 text-gold-400" />
                <div className="text-left">
                  <p className="text-sm font-medium">{t('promotions.phone')}</p>
                  <p className="text-xs text-anthracite-400">{t('promotions.phoneHours')}</p>
                </div>
              </a>
            </div>

            <p className="text-xs text-anthracite-500 text-center mt-6">
              {t('promotions.paymentNote')}
            </p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-anthracite-900 border-r border-anthracite-800 p-6 hidden lg:block overflow-y-auto">

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
                onClick={() => {
                  if (link.scrollTo) {
                    document.getElementById(link.scrollTo)?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-anthracite-300 hover:text-white hover:bg-anthracite-800 text-sm w-full text-left"
              >
                <link.icon className="w-4 h-4" /> {link.label}
              </button>
            )
          ))}
        </nav>

        <div className="mt-6">
          <div className="bg-gold-400/5 border border-gold-400/20 rounded-xl p-4">
            <p className="text-xs text-gold-400 font-medium mb-1">
              {t('sidebar.plan')}: {supplier?.plan === 'free' ? t('sidebar.planFree') : supplier?.plan === 'professional' ? t('sidebar.planProfessional') : supplier?.plan || t('sidebar.planFree')}
            </p>
            <p className="text-xs text-anthracite-400">
              {stats?.activeProducts || 0} {t('sidebar.activeProducts')}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">{t('sidebar.dashboard')}</h1>
              <p className="text-anthracite-400 text-sm mt-1">
                {supplier?.companyName || t('supplier')} &middot;{' '}
                <span className={`${supplier?.status === 'approved' ? 'text-emerald-400' : supplier?.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                  {supplier?.status === 'approved' ? t('status.approved') : supplier?.status === 'pending' ? t('status.pending') : t('status.rejected')}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <NotificationBell />
              <Link href="/supplier/products/new" className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> {t('products.addProduct')}
              </Link>
              <button
                onClick={handleLogout}
                disabled={logoutLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-anthracite-700 text-anthracite-300 hover:text-red-400 hover:border-red-400/30 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                {logoutLoading ? t('loggingOut') : 'Logout'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gold-400/10 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-gold-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{stats?.activeProducts || 0}</div>
              <div className="text-xs text-anthracite-400 mt-1">{t('stats.activeProducts')}</div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gold-400/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-gold-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{stats?.contactRequestsThisMonth || 0}</div>
              <div className="text-xs text-anthracite-400 mt-1">{t('stats.requestsThisMonth')}</div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gold-400/10 rounded-lg flex items-center justify-center">
                  <Inbox className="w-5 h-5 text-gold-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{stats?.totalContactRequests || 0}</div>
              <div className="text-xs text-anthracite-400 mt-1">{t('stats.totalRequests')}</div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gold-400/10 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-gold-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">
                {stats?.reviewCount ? `${stats.avgRating}` : '—'}
              </div>
              <div className="text-xs text-anthracite-400 mt-1">
                {t('stats.avgRating')} {stats?.reviewCount ? `(${stats.reviewCount} ${t('stats.reviews')})` : `(0 ${t('stats.reviews')})`}
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">{t('products.title')}</h3>
              <Link href="/supplier/products/new" className="text-sm text-gold-400 hover:text-gold-300">
                + {t('products.addProduct')}
              </Link>
            </div>

            {recentProducts.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gold-400/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <PackagePlus className="w-8 h-8 text-gold-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{t('products.emptyTitle')}</h4>
                <p className="text-anthracite-400 text-sm mb-6 max-w-sm mx-auto">
                  {t('products.emptyDescription')}
                </p>
                <Link href="/supplier/products/new" className="btn-primary inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> {t('products.addFirstProduct')}
                </Link>
              </div>
            ) : (
              /* Products Table */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-anthracite-700">
                      <th className="text-left text-xs font-medium text-anthracite-400 pb-3">{t('products.tableProduct')}</th>
                      <th className="text-left text-xs font-medium text-anthracite-400 pb-3">{t('products.tableCategory')}</th>
                      <th className="text-left text-xs font-medium text-anthracite-400 pb-3">{t('products.tablePrice')}</th>
                      <th className="text-left text-xs font-medium text-anthracite-400 pb-3">{t('products.tableStatus')}</th>
                      <th className="text-left text-xs font-medium text-anthracite-400 pb-3">{t('products.tableAdded')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-anthracite-800">
                    {recentProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-anthracite-800/50">
                        <td className="py-3 text-sm text-white font-medium">{product.name}</td>
                        <td className="py-3 text-sm text-anthracite-300 capitalize">{product.category}</td>
                        <td className="py-3 text-sm text-gold-400 font-medium">&euro;{Number(product.price_eur).toLocaleString()}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            product.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                            product.status === 'featured' ? 'bg-gold-400/10 text-gold-400' :
                            'bg-anthracite-700 text-anthracite-400'
                          }`}>
                            {product.status === 'active' ? t('products.statusActive') : product.status === 'featured' ? t('products.statusFeatured') : t('products.statusInactive')}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-anthracite-400">
                          {new Date(product.created_at).toLocaleDateString(dateLocale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Contact Requests */}
          {recentRequests.length > 0 && (
            <div id="cereri" className="card mb-8">
              <h3 className="font-semibold text-white mb-4">{t('requests.title')}</h3>
              <div className="space-y-3">
                {[...recentRequests].sort((a, b) => {
                  const isNewA = a.status === 'sent' || a.status === 'viewed' ? 0 : 1;
                  const isNewB = b.status === 'sent' || b.status === 'viewed' ? 0 : 1;
                  if (isNewA !== isNewB) return isNewA - isNewB;
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }).map((req) => (
                  <div key={req.id} className={`p-3 rounded-lg ${req.status === 'sent' ? 'bg-red-500/5 border border-red-500/20' : 'bg-anthracite-800/50'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${req.status === 'sent' ? 'bg-red-500/10' : 'bg-gold-400/10'}`}>
                        <Mail className={`w-4 h-4 ${req.status === 'sent' ? 'text-red-400' : 'text-gold-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">{req.client_name}</p>
                          <div className="flex items-center gap-2">
                            {req.status === 'sent' && (
                              <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-semibold animate-pulse">{t('requests.statusNew')}</span>
                            )}
                            {req.status === 'viewed' && (
                              <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">{t('requests.statusViewed')}</span>
                            )}
                            {(req.status === 'replied' || req.status === 'completed') && (
                              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">{t('requests.statusReplied')}</span>
                            )}
                            <span className="text-xs text-anthracite-500">
                              {new Date(req.created_at).toLocaleDateString(dateLocale)}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-anthracite-400 mt-0.5">{req.client_email}</p>
                        {req.message && (
                          <p className="text-sm text-anthracite-300 mt-1 line-clamp-2">{req.message}</p>
                        )}
                        {req.status !== 'replied' && req.status !== 'completed' && (
                          <button
                            onClick={() => setReplyingTo(replyingTo === req.id ? null : req.id)}
                            className="mt-2 text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
                          >
                            <MessageSquare className="w-3 h-3" /> {t('requests.reply')}
                          </button>
                        )}
                      </div>
                    </div>
                    {replyingTo === req.id && (
                      <div className="mt-3 ml-11">
                        <textarea
                          className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400 resize-none"
                          rows={3}
                          placeholder={t('requests.replyPlaceholder')}
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          disabled={replySending}
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={async () => {
                              if (!replyMessage.trim()) return;
                              setReplySending(true);
                              try {
                                const res = await fetch('/api/contact/reply', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ requestId: req.id, replyMessage: replyMessage.trim() }),
                                });
                                if (res.ok) {
                                  setToast(t('requests.replySent'));
                                  setReplyingTo(null);
                                  setReplyMessage('');
                                  setRecentRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'replied' } : r));
                                } else {
                                  const data = await res.json();
                                  setToast(data.error || t('requests.replyError'));
                                }
                              } catch {
                                setToast(t('requests.networkError'));
                              } finally {
                                setReplySending(false);
                              }
                            }}
                            disabled={replySending || !replyMessage.trim()}
                            className="bg-gold-400 text-anthracite-950 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gold-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {replySending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            {t('requests.send')}
                          </button>
                          <button
                            onClick={() => { setReplyingTo(null); setReplyMessage(''); }}
                            className="text-xs text-anthracite-400 hover:text-white transition-colors"
                          >
                            {t('requests.cancel')}
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Chat toggle */}
                    <div className="mt-2 ml-11">
                      <button
                        onClick={() => setOpenChat(openChat === req.id ? null : req.id)}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        {openChat === req.id ? t('chat.hideConversation') : t('chat.openConversation')}
                        {openChat === req.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {openChat === req.id && (
                        <SupplierChatBox requestId={req.id} locale={locale} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Section */}
          <div id="analytics" className="mb-8">
            <div className="flex items-center gap-3 mb-5">
              <BarChart3 className="w-5 h-5 text-gold-400" />
              <h2 className="text-xl font-bold text-white">{t('analytics.title')}</h2>
            </div>

            {analyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gold-400" />
              </div>
            ) : analyticsData.length === 0 ? (
              <div className="bg-anthracite-800/50 rounded-xl p-6 text-center">
                <BarChart3 className="w-10 h-10 text-anthracite-600 mx-auto mb-2" />
                <p className="text-sm text-anthracite-400">{t('analytics.noData')}</p>
                <p className="text-xs text-anthracite-500 mt-1">{t('analytics.noDataHint')}</p>
              </div>
            ) : (
              <div className="bg-anthracite-800/50 border border-anthracite-700 rounded-xl overflow-x-auto">
                <div className="min-w-[600px]">
                {/* Table header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-anthracite-700 text-xs font-medium text-anthracite-400 uppercase tracking-wider">
                  <div className="col-span-4">{t('analytics.product')}</div>
                  <div className="col-span-2 text-center">{t('analytics.views')}</div>
                  <div className="col-span-2 text-center">{t('analytics.requests')}</div>
                  <div className="col-span-2 text-center">{t('analytics.viewsVsLastMonth')}</div>
                  <div className="col-span-2 text-center">{t('analytics.requestsVsLastMonth')}</div>
                </div>
                {/* Table rows */}
                {analyticsData.map((item) => (
                  <div key={item.product_id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-anthracite-700/50 last:border-b-0 items-center hover:bg-anthracite-800/80 transition-colors">
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-anthracite-700 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {item.product_image ? (
                          <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-4 h-4 text-anthracite-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium truncate">{item.product_name}</p>
                        <p className="text-xs text-anthracite-500">&euro;{Number(item.price_eur).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-sm font-semibold text-white">{item.views_total}</span>
                      <p className="text-xs text-anthracite-500">{item.views_current_month} {t('analytics.thisMonth')}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-sm font-semibold text-white">{item.requests_total}</span>
                      <p className="text-xs text-anthracite-500">{item.requests_current_month} {t('analytics.thisMonth')}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      {item.views_change_percent === null ? (
                        <span className="inline-flex items-center gap-1 text-xs text-anthracite-500"><Minus className="w-3 h-3" /> N/A</span>
                      ) : item.views_change_percent > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium"><ArrowUpRight className="w-3 h-3" /> +{item.views_change_percent}%</span>
                      ) : item.views_change_percent < 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400 font-medium"><ArrowDownRight className="w-3 h-3" /> {item.views_change_percent}%</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-anthracite-400"><Minus className="w-3 h-3" /> 0%</span>
                      )}
                    </div>
                    <div className="col-span-2 text-center">
                      {item.requests_change_percent === null ? (
                        <span className="inline-flex items-center gap-1 text-xs text-anthracite-500"><Minus className="w-3 h-3" /> N/A</span>
                      ) : item.requests_change_percent > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium"><ArrowUpRight className="w-3 h-3" /> +{item.requests_change_percent}%</span>
                      ) : item.requests_change_percent < 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400 font-medium"><ArrowDownRight className="w-3 h-3" /> {item.requests_change_percent}%</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-anthracite-400"><Minus className="w-3 h-3" /> 0%</span>
                      )}
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>

          {/* Galerie Foto Section */}
          <div id="gallery" className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-gold-400" />
                <h2 className="text-xl font-bold text-white">{t('gallery.title')}</h2>
                <span className="text-sm text-anthracite-400">({galleryImages.length}/10)</span>
              </div>
              {galleryImages.length < 10 && (
                <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-gold-500/10 border border-gold-500/30 rounded-lg text-gold-400 text-sm hover:bg-gold-500/20 transition-colors">
                  <ImagePlus className="w-4 h-4" />
                  {galleryUploading ? t('gallery.uploading') : t('gallery.addImage')}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleGalleryUpload} disabled={galleryUploading} />
                </label>
              )}
            </div>

            {galleryLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-anthracite-400" /></div>
            ) : galleryImages.length === 0 ? (
              <div className="bg-anthracite-800/50 rounded-xl p-8 text-center">
                <Camera className="w-10 h-10 text-anthracite-600 mx-auto mb-2" />
                <p className="text-anthracite-400 mb-1">{t('gallery.emptyTitle')}</p>
                <p className="text-anthracite-500 text-sm">{t('gallery.emptyDescription')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {galleryImages.map((img) => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border border-anthracite-700 aspect-square">
                    <img src={img.image_url} alt={img.caption || 'Galerie'} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => handleGalleryDelete(img.id)} className="p-2 bg-red-500/80 rounded-full text-white hover:bg-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {img.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                        <p className="text-xs text-white truncate">{img.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Promovează-te Section */}
          <div id="promotions" className="mb-8">
            <div className="flex items-center gap-3 mb-5">
              <Megaphone className="w-5 h-5 text-gold-400" />
              <h2 className="text-xl font-bold text-white">{t('promotions.title')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Oferta Zilei Card */}
              <div className="bg-gradient-to-br from-gold-400/5 to-anthracite-900 border border-gold-400/30 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-5 h-5 text-gold-400" />
                    <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider">{t('promotions.premium')}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{t('promotions.ofertaZilei')}</h3>
                  <p className="text-anthracite-400 text-sm mb-4">{t('promotions.ofertaDescription')}</p>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-gold-400">{t('promotions.ofertaPrice')}</span>
                    <span className="text-anthracite-400 text-sm">{t('promotions.ofertaPriceUnit')}</span>
                  </div>

                  <ul className="space-y-2 mb-5">
                    <li className="flex items-center gap-2 text-sm text-anthracite-200">
                      <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                      {t('promotions.ofertaFeature1')}
                    </li>
                    <li className="flex items-center gap-2 text-sm text-anthracite-200">
                      <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                      {t('promotions.ofertaFeature2')}
                    </li>
                    <li className="flex items-center gap-2 text-sm text-anthracite-200">
                      <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                      {t('promotions.ofertaFeature3')}
                    </li>
                    <li className="flex items-center gap-2 text-sm text-anthracite-200">
                      <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                      {t('promotions.ofertaFeature4')}
                    </li>
                  </ul>

                  {/* Available slots indicator */}
                  <div className="flex items-center justify-between mb-4 bg-anthracite-900/60 rounded-lg px-3 py-2">
                    <span className="text-xs text-anthracite-400">{t('promotions.slotsAvailable')}</span>
                    {slotsLoading ? (
                      <span className="text-xs text-anthracite-500">{t('promotions.slotsChecking')}</span>
                    ) : (
                      <span className={`text-sm font-bold ${
                        (slots?.ofertaZilei.available ?? 1) > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {slots?.ofertaZilei.available ?? 1} / {slots?.ofertaZilei.total ?? 1}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => openContactModal('oferta')}
                    className="w-full py-3 bg-gold-400 text-anthracite-950 font-semibold rounded-xl hover:bg-gold-300 transition-colors text-sm"
                  >
                    {t('promotions.reserveOferta')}
                  </button>
                </div>
              </div>

              {/* Anunțurile Zilei Card */}
              <div className="bg-anthracite-900 border border-anthracite-700 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/3 rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-gold-400" />
                    <span className="text-xs font-semibold text-anthracite-300 uppercase tracking-wider">{t('promotions.promotion')}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{t('promotions.anunturiZilei')}</h3>
                  <p className="text-anthracite-400 text-sm mb-4">{t('promotions.anunturiDescription')}</p>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-gold-400">{t('promotions.anunturiPrice')}</span>
                    <span className="text-anthracite-400 text-sm">{t('promotions.anunturiPriceUnit')}</span>
                  </div>

                  <ul className="space-y-2 mb-5">
                    <li className="flex items-center gap-2 text-sm text-anthracite-200">
                      <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                      {t('promotions.anunturiFeature1')}
                    </li>
                    <li className="flex items-center gap-2 text-sm text-anthracite-200">
                      <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                      {t('promotions.anunturiFeature2')}
                    </li>
                    <li className="flex items-center gap-2 text-sm text-anthracite-200">
                      <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                      {t('promotions.anunturiFeature3')}
                    </li>
                    <li className="flex items-center gap-2 text-sm text-anthracite-200">
                      <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                      {t('promotions.anunturiFeature4')}
                    </li>
                  </ul>

                  {/* Available slots indicator */}
                  <div className="flex items-center justify-between mb-4 bg-anthracite-800/60 rounded-lg px-3 py-2">
                    <span className="text-xs text-anthracite-400">{t('promotions.slotsAvailable')}</span>
                    {slotsLoading ? (
                      <span className="text-xs text-anthracite-500">{t('promotions.slotsChecking')}</span>
                    ) : (
                      <span className={`text-sm font-bold ${
                        (slots?.anunturiZilei.available ?? 5) > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {slots?.anunturiZilei.available ?? 5} / {slots?.anunturiZilei.total ?? 5}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => openContactModal('anunt')}
                    className="w-full py-3 bg-anthracite-800 border border-gold-400/30 text-gold-400 font-semibold rounded-xl hover:bg-gold-400/10 transition-colors text-sm"
                  >
                    {t('promotions.reserveAnunt')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Setări Cont */}
        <section className="mt-10 bg-anthracite-900 border border-anthracite-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">{t('settings.title')}</h3>
          <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-red-400 mb-2">{t('settings.deleteAccount')}</h4>
            <p className="text-anthracite-400 text-xs leading-relaxed mb-4">
              {t('settings.deleteDescription')}
            </p>
            <button
              onClick={async () => {
                if (!confirm(t('settings.deleteConfirm'))) return;
                const reason = prompt(t('settings.deleteReason')) || '';
                try {
                  const res = await fetch('/api/account/delete-request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    alert(data.message || t('settings.deleteSuccess'));
                  } else {
                    alert(data.error || t('settings.deleteError'));
                  }
                } catch {
                  alert(t('errors.connectionError'));
                }
              }}
              className="px-4 py-2 text-sm font-medium text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              {t('settings.deleteButton')}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

// SupplierChatBox component for inline messaging
function SupplierChatBox({ requestId, locale }: { requestId: string; locale: string }) {
  const { t } = useClientTranslations('supplierDashboard');
  const [messages, setMessages] = useState<{ id: string; sender_type: string; sender_name: string; content: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [requestId]);

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/messages?request_id=${requestId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {} finally { setLoading(false); }
  }

  async function handleSend() {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, content: newMessage.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
      }
    } catch {} finally { setSending(false); }
  }

  const dateLocale = locale === 'en' ? 'en-GB' : 'ro-RO';

  if (loading) {
    return (
      <div className="mt-3 flex items-center gap-2 text-xs text-anthracite-400">
        <Loader2 className="w-3 h-3 animate-spin" /> {t('chat.loadingMessages')}
      </div>
    );
  }

  return (
    <div className="mt-3 border border-anthracite-700 rounded-lg overflow-hidden">
      {/* Messages list */}
      <div className="max-h-64 overflow-y-auto p-3 space-y-2 bg-anthracite-900/50">
        {messages.length === 0 ? (
          <p className="text-xs text-anthracite-500 text-center py-4">{t('chat.noMessages')}</p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_type === 'supplier';
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
                  isOwn
                    ? 'bg-gold-400/10 border border-gold-400/30'
                    : 'bg-anthracite-700 border border-anthracite-600'
                }`}>
                  <p className={`text-[10px] font-medium mb-0.5 ${isOwn ? 'text-gold-400' : 'text-blue-400'}`}>
                    {msg.sender_name}
                  </p>
                  <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-[10px] text-anthracite-500 mt-1">
                    {new Date(msg.created_at).toLocaleString(dateLocale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Composer */}
      <div className="flex items-center gap-2 p-2 border-t border-anthracite-700 bg-anthracite-800">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={t('chat.placeholder')}
          className="flex-1 bg-anthracite-900 border border-anthracite-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400"
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={sending || !newMessage.trim()}
          className="bg-gold-400 text-anthracite-950 p-2 rounded-lg hover:bg-gold-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
