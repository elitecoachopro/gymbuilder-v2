'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dumbbell, Package, Eye, TrendingUp, Plus, Edit, BarChart3, Megaphone, Star, LogOut, X, CheckCircle2, Crown, Zap, Mail, Phone, PackagePlus, Inbox, Send, Loader2, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import NotificationBell from '@/components/NotificationBell';

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

const sidebarLinks = [
  { href: '/supplier/dashboard', label: 'Dashboard', icon: BarChart3, active: true },
  { href: '/supplier/products', label: 'Produsele Mele', icon: Package, active: false },
  { href: null, label: 'Promovări', icon: Megaphone, active: false, scrollTo: 'promotions' },
];

export default function SupplierDashboard() {
  const router = useRouter();
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

  // Real data states
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState<SupplierData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [recentRequests, setRecentRequests] = useState<ContactRequest[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch('/api/supplier/dashboard');
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (res.status === 404) {
          setError('Nu ai un profil de furnizor. Te rugăm să te înregistrezi ca furnizor.');
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setError('Eroare la încărcarea datelor.');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setSupplier(data.supplier);
        setStats(data.stats);
        setRecentProducts(data.recentProducts || []);
        setRecentRequests(data.recentRequests || []);
      } catch {
        setError('Eroare de conexiune.');
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

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-anthracite-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-anthracite-400 text-sm">Se încarcă dashboard-ul...</p>
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
          <h2 className="text-xl font-bold text-white mb-2">Eroare</h2>
          <p className="text-anthracite-400 mb-6">{error}</p>
          <Link href="/" className="btn-primary">Înapoi la Homepage</Link>
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
                {contactType === 'oferta' ? 'Rezervă Oferta Zilei' : 'Rezervă Anunț Zilei'}
              </h3>
              <p className="text-anthracite-400 text-sm mt-2">
                {contactType === 'oferta'
                  ? 'Contactează-ne pentru a rezerva locul premium pe homepage (€25/24h).'
                  : 'Contactează-ne pentru a rezerva un loc în secțiunea Anunțurile Zilei (€9/loc/7 zile).'}
              </p>
            </div>

            <div className="space-y-4">
              <a
                href="mailto:contact@gymbuilder.app?subject=Rezervare%20Promovare%20-%20GymBuilder"
                className="flex items-center gap-3 w-full px-4 py-3 bg-gold-400/10 border border-gold-400/30 rounded-xl text-gold-400 hover:bg-gold-400/20 transition-colors"
              >
                <Mail className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-anthracite-400">contact@gymbuilder.app</p>
                </div>
              </a>

              <a
                href="tel:+40700000000"
                className="flex items-center gap-3 w-full px-4 py-3 bg-anthracite-800 border border-anthracite-700 rounded-xl text-white hover:border-gold-400/30 transition-colors"
              >
                <Phone className="w-5 h-5 text-gold-400" />
                <div className="text-left">
                  <p className="text-sm font-medium">Telefon</p>
                  <p className="text-xs text-anthracite-400">Luni - Vineri, 9:00 - 18:00</p>
                </div>
              </a>
            </div>

            <p className="text-xs text-anthracite-500 text-center mt-6">
              Plata se procesează doar după confirmarea rezervării. Integrare Stripe în curând.
            </p>
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

        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-gold-400/5 border border-gold-400/20 rounded-xl p-4">
            <p className="text-xs text-gold-400 font-medium mb-1">
              Plan: {supplier?.plan === 'free' ? 'Gratuit' : supplier?.plan === 'professional' ? 'Professional' : supplier?.plan || 'Gratuit'}
            </p>
            <p className="text-xs text-anthracite-400">
              {stats?.activeProducts || 0} produse active
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-anthracite-400 text-sm mt-1">
                {supplier?.companyName || 'Furnizor'} &middot;{' '}
                <span className={`${supplier?.status === 'approved' ? 'text-emerald-400' : supplier?.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                  {supplier?.status === 'approved' ? 'Aprobat' : supplier?.status === 'pending' ? 'În așteptare' : 'Respins'}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link href="/supplier/products/new" className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Adaugă Produs
              </Link>
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

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gold-400/10 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-gold-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{stats?.activeProducts || 0}</div>
              <div className="text-xs text-anthracite-400 mt-1">Produse Active</div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gold-400/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-gold-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{stats?.contactRequestsThisMonth || 0}</div>
              <div className="text-xs text-anthracite-400 mt-1">Cereri Luna Aceasta</div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gold-400/10 rounded-lg flex items-center justify-center">
                  <Inbox className="w-5 h-5 text-gold-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{stats?.totalContactRequests || 0}</div>
              <div className="text-xs text-anthracite-400 mt-1">Total Cereri Primite</div>
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
                Rating Mediu {stats?.reviewCount ? `(${stats.reviewCount} review-uri)` : '(0 review-uri)'}
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Produsele Mele</h3>
              <Link href="/supplier/products/new" className="text-sm text-gold-400 hover:text-gold-300">
                + Adaugă Produs
              </Link>
            </div>

            {recentProducts.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gold-400/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <PackagePlus className="w-8 h-8 text-gold-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Nu ai niciun produs încă</h4>
                <p className="text-anthracite-400 text-sm mb-6 max-w-sm mx-auto">
                  Adaugă primul tău produs pentru a fi vizibil pe platformă și a primi cereri de ofertă de la clienți.
                </p>
                <Link href="/supplier/products/new" className="btn-primary inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Adaugă Primul Produs
                </Link>
              </div>
            ) : (
              /* Products Table */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-anthracite-700">
                      <th className="text-left text-xs font-medium text-anthracite-400 pb-3">Produs</th>
                      <th className="text-left text-xs font-medium text-anthracite-400 pb-3">Categorie</th>
                      <th className="text-left text-xs font-medium text-anthracite-400 pb-3">Preț</th>
                      <th className="text-left text-xs font-medium text-anthracite-400 pb-3">Status</th>
                      <th className="text-left text-xs font-medium text-anthracite-400 pb-3">Adăugat</th>
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
                            {product.status === 'active' ? 'Activ' : product.status === 'featured' ? 'Promovat' : 'Inactiv'}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-anthracite-400">
                          {new Date(product.created_at).toLocaleDateString('ro-RO')}
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
              <h3 className="font-semibold text-white mb-4">Ultimele Cereri de Ofertă</h3>
              <div className="space-y-3">
                {[...recentRequests].sort((a, b) => {
                  // New (sent/viewed) first, then replied/completed
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
                              <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-semibold animate-pulse">Nouă</span>
                            )}
                            {req.status === 'viewed' && (
                              <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">Văzută</span>
                            )}
                            {req.status === 'replied' && (
                              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">Procesată</span>
                            )}
                            {req.status === 'completed' && (
                              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">Procesată</span>
                            )}
                            <span className="text-xs text-anthracite-500">
                              {new Date(req.created_at).toLocaleDateString('ro-RO')}
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
                            <MessageSquare className="w-3 h-3" /> Răspunde
                          </button>
                        )}
                      </div>
                    </div>
                    {replyingTo === req.id && (
                      <div className="mt-3 ml-11">
                        <textarea
                          className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400 resize-none"
                          rows={3}
                          placeholder="Scrie răspunsul tău..."
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
                                  setToast('Răspuns trimis cu succes! Clientul a fost notificat pe email.');
                                  setReplyingTo(null);
                                  setReplyMessage('');
                                  setRecentRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'replied' } : r));
                                } else {
                                  const data = await res.json();
                                  setToast(data.error || 'Eroare la trimiterea răspunsului.');
                                }
                              } catch {
                                setToast('Eroare de rețea.');
                              } finally {
                                setReplySending(false);
                              }
                            }}
                            disabled={replySending || !replyMessage.trim()}
                            className="bg-gold-400 text-anthracite-950 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gold-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {replySending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            Trimite
                          </button>
                          <button
                            onClick={() => { setReplyingTo(null); setReplyMessage(''); }}
                            className="text-xs text-anthracite-400 hover:text-white transition-colors"
                          >
                            Anulează
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Promovează-te Section */}
          <div id="promotions" className="mb-8">
            <div className="flex items-center gap-3 mb-5">
              <Megaphone className="w-5 h-5 text-gold-400" />
              <h2 className="text-xl font-bold text-white">Promovează-te</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Oferta Zilei Card */}
              <div className="bg-gradient-to-br from-gold-400/5 to-anthracite-900 border border-gold-400/30 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-5 h-5 text-gold-400" />
                    <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider">Premium</span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">Oferta Zilei</h3>
                  <p className="text-anthracite-400 text-sm mb-4">Locul #1 pe homepage — vizibilitate maximă</p>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-gold-400">&euro;25</span>
                    <span className="text-anthracite-400 text-sm">/24 ore</span>
                  </div>

                  <ul className="space-y-2 mb-5">
                    <li className="flex items-center gap-2 text-sm text-anthracite-200">
                      <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                      Afișaj premium pe homepage (secțiune dedicată)
                    </li>
                    <li className="flex items-center gap-2 text-sm text-anthracite-200">
                      <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                      Badge &quot;Oferta Zilei&quot; pe produs
                    </li>
                    <li className="flex items-center gap-2 text-sm text-anthracite-200">
                      <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                      Vizibilitate maximă — primul lucru văzut de clienți
                    </li>
                    <li className="flex items-center gap-2 text-sm text-anthracite-200">
                      <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                      1 singur loc disponibil (exclusivitate)
                    </li>
                  </ul>

                  {/* Available slots indicator */}
                  <div className="flex items-center justify-between mb-4 bg-anthracite-900/60 rounded-lg px-3 py-2">
                    <span className="text-xs text-anthracite-400">Locuri disponibile:</span>
                    {slotsLoading ? (
                      <span className="text-xs text-anthracite-500">Se verifică...</span>
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
                    Rezervă Oferta Zilei — &euro;25
                  </button>
                </div>
              </div>

              {/* Anunțurile Zilei Card */}
              <div className="bg-anthracite-900 border border-anthracite-700 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/3 rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-gold-400" />
                    <span className="text-xs font-semibold text-anthracite-300 uppercase tracking-wider">Promovare</span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">Anunțurile Zilei</h3>
                  <p className="text-anthracite-400 text-sm mb-4">Secțiune dedicată pe homepage — 7 zile vizibilitate</p>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-gold-400">&euro;9</span>
                    <span className="text-anthracite-400 text-sm">/loc /7 zile</span>
                  </div>

                  <ul className="space-y-2 mb-5">
                    <li className="flex items-center gap-2 text-sm text-anthracite-200">
                      <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                      Afișaj în secțiunea &quot;Anunțurile Zilei&quot; pe homepage
                    </li>
                    <li className="flex items-center gap-2 text-sm text-anthracite-200">
                      <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                      Vizibilitate 7 zile continue
                    </li>
                    <li className="flex items-center gap-2 text-sm text-anthracite-200">
                      <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                      Link direct către produsul tău
                    </li>
                    <li className="flex items-center gap-2 text-sm text-anthracite-200">
                      <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                      Maxim 5 locuri (competiție redusă)
                    </li>
                  </ul>

                  {/* Available slots indicator */}
                  <div className="flex items-center justify-between mb-4 bg-anthracite-800/60 rounded-lg px-3 py-2">
                    <span className="text-xs text-anthracite-400">Locuri disponibile:</span>
                    {slotsLoading ? (
                      <span className="text-xs text-anthracite-500">Se verifică...</span>
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
                    Rezervă Anunț — &euro;9/7 zile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
