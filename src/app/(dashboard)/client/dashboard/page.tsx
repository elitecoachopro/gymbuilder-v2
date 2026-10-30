'use client';

import { loginHref } from '@/lib/journeys';
import { logoutClient } from '@/lib/logout-client';
import { useUiText } from '@/i18n/useUiText';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, Heart, MessageSquare, Star, Building2, Package, Loader2, Clock, Send, CheckCircle, Trash2, LogOut, ChevronDown, ChevronUp, LayoutGrid } from 'lucide-react';
import MyGymProjects from '@/components/MyGymProjects';
import RequestChat from '@/components/RequestChat';
import NotificationBell from '@/components/NotificationBell';

interface ContactRequest {
  id: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
  supplier_profiles: { id: string; company_name: string; logo_url: string | null; country: string };
  products: { id: string; name: string; images: string[]; price_eur: number } | null;
}

interface Favorite {
  id: string;
  created_at: string;
  products: {
    id: string;
    name: string;
    category: string;
    price_eur: number;
    images: string[];
    condition: string;
    status: string;
    supplier_profiles: { id: string; company_name: string };
  };
}

interface Review {
  id: string;
  rating: number;
  title: string;
  body: string | null;
  verified: boolean;
  created_at: string;
  supplier_profiles: { id: string; company_name: string };
}

interface RecentSupplier {
  id: string;
  company_name: string;
  logo_url: string | null;
  country: string;
  last_contact: string;
}

interface DashboardData {
  pagination?: { page: number; hasNext: boolean };
  totals?: { contactRequests: number; favorites: number; reviews: number };
  user: { id: string; full_name: string; email: string };
  contactRequests: ContactRequest[];
  favorites: Favorite[];
  reviews: Review[];
  recentSuppliers: RecentSupplier[];
}

export default function ClientDashboard() {
  const ui = useUiText();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const wantedChat = searchParams?.get('chat') || '';
  const [removingFavorite, setRemovingFavorite] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [openChat, setOpenChat] = useState<string | null>(null);
  useEffect(() => { setOpenChat(searchParams?.get('chat') || null); }, [searchParams]);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logoutClient();
      router.push('/login');
    } catch { window.alert(ui('Deconectarea nu a reușit. Încearcă din nou.')); } finally { setLogoutLoading(false); }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, wantedChat]);

  async function fetchDashboard() {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/client/dashboard?page=${page}&chat=${encodeURIComponent(wantedChat)}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else if (res.status === 401) {
        setError('Trebuie să fii autentificat pentru a accesa dashboard-ul.');
      } else {
        setError('Eroare la încărcarea datelor.');
      }
    } catch {
      setError('Eroare de conexiune.');
    } finally {
      setLoading(false);
    }
  }

  async function removeFavorite(productId: string) {
    if (!productId || removingFavorite) return;
    setRemovingFavorite(productId);
    try {
      const res = await fetch('/api/client/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: productId }) });
      if (!res.ok || (await res.json()).favorited !== false) throw new Error();
      setData(prev => {
        if (!prev || !prev.favorites.some(f => f.products?.id === productId)) return prev;
        return { ...prev, favorites: prev.favorites.filter(f => f.products?.id !== productId), totals: prev.totals ? { ...prev.totals, favorites: Math.max(0, prev.totals.favorites - 1) } : undefined };
      });
    } catch { window.alert(ui('Favoritele nu au putut fi actualizate. Încearcă din nou.')); }
    finally { setRemovingFavorite(null); }
  }

  if (loading && !data) {
    return (
      <main className="min-h-screen bg-anthracite-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="min-h-screen bg-anthracite-950 flex flex-col items-center justify-center px-4">
        <Building2 className="w-16 h-16 text-anthracite-600 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">{ui(error)}</h1>
        <button className="btn-secondary mt-4" onClick={fetchDashboard}>{ui("Reîncearcă")}</button>
        <Link href={loginHref(`/client/dashboard${wantedChat ? `?chat=${encodeURIComponent(wantedChat)}` : ""}`)} className="text-gold-400 hover:underline text-sm mt-4">
          {ui("Autentifică-te →")}</Link>
      </main>
    );
  }

  if (!data) return null;

  const getDisplayStatus = (cr: ContactRequest) => {
    // Check if expired: sent more than 14 days ago without reply
    if (cr.status === 'sent' || cr.status === 'viewed') {
      const createdAt = new Date(cr.created_at).getTime();
      const now = Date.now();
      const daysSince = (now - createdAt) / (1000 * 60 * 60 * 24);
      if (daysSince > 14) {
        return { text: 'Expirată', color: 'bg-anthracite-700/50 text-anthracite-400 border-anthracite-600', icon: '⏰' };
      }
    }
    switch (cr.status) {
      case 'sent': return { text: 'Trimisă', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: '📤' };
      case 'viewed': return { text: 'Văzută de furnizor', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: '👁️' };
      case 'replied': return { text: 'Răspuns primit', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: '✅' };
      case 'completed': return { text: 'Finalizat', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: '✅' };
      default: return { text: cr.status, color: 'bg-anthracite-700 text-anthracite-300 border-anthracite-600', icon: '' };
    }
  };

  return (
    <main className="min-h-screen bg-anthracite-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{ui("Bun venit, ")}{data.user.full_name}!</h1>
            <p className="text-anthracite-400 text-sm mt-1">{ui("Dashboard-ul tău de client")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <NotificationBell />
{/* Configurator Sală - hidden temporarily, code preserved on develop */}
            {<Link
              href="/configurator"
              className="flex items-center gap-2 bg-indigo-500 text-white font-bold px-5 py-3 rounded-lg hover:bg-indigo-400 transition-colors"
            >
              <LayoutGrid className="w-4 h-4" />
              {ui("Configurator Sală")}</Link>}
            <Link
              href="/products"
              className="flex items-center gap-2 bg-gold-400 text-anthracite-950 font-bold px-5 py-3 rounded-lg hover:bg-gold-300 transition-colors"
            >
              <Search className="w-4 h-4" />
              {ui("Caută Echipamente")}</Link>
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-anthracite-700 text-anthracite-300 hover:text-red-400 hover:border-red-400/30 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {ui(logoutLoading ? 'Se deconectează...' : 'Logout')}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 text-center">
            <Send className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{data.totals?.contactRequests ?? data.contactRequests.length}</p>
            <p className="text-xs text-anthracite-400">{ui("Cereri Trimise")}</p>
          </div>
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 text-center">
            <Heart className="w-5 h-5 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{data.totals?.favorites ?? data.favorites.length}</p>
            <p className="text-xs text-anthracite-400">Favorite</p>
          </div>
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 text-center">
            <Star className="w-5 h-5 text-gold-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{data.totals?.reviews ?? data.reviews.length}</p>
            <p className="text-xs text-anthracite-400">{ui("Recenzii")}</p>
          </div>
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 text-center">
            <Building2 className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{data.recentSuppliers.length}</p>
            <p className="text-xs text-anthracite-400">{ui("Furnizori Contactați")}</p>
          </div>
        </div>

        {/* Recent Suppliers */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gold-400" />
            {ui("Furnizori Contactați Recent")}</h2>
          {data.recentSuppliers.length === 0 ? (
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-8 text-center">
              <Building2 className="w-10 h-10 text-anthracite-600 mx-auto mb-3" />
              <p className="text-anthracite-400 text-sm">{ui("Nu ai contactat niciun furnizor încă.")}</p>
              <Link href="/suppliers" className="text-gold-400 text-sm hover:underline mt-2 inline-block">
                {ui("Explorează furnizori →")}</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.recentSuppliers.map((supplier) => (
                <Link
                  key={supplier.id}
                  href={`/suppliers/${supplier.id}`}
                  className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 hover:border-gold-400/30 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-anthracite-700 rounded-full flex items-center justify-center flex-shrink-0">
                      {supplier.logo_url ? (
                        <img src={supplier.logo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <Building2 className="w-5 h-5 text-anthracite-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-gold-400 transition-colors">{supplier.company_name}</p>
                      <p className="text-xs text-anthracite-400">{supplier.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-anthracite-500">
                    <Clock className="w-3 h-3" />
                    {ui("Contactat: ")}{ui(new Date(supplier.last_contact).toLocaleDateString(ui('ro-RO')))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Favorites */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400" />
            {ui("Produse Favorite")}</h2>
          {data.favorites.length === 0 ? (
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-8 text-center">
              <Heart className="w-10 h-10 text-anthracite-600 mx-auto mb-3" />
              <p className="text-anthracite-400 text-sm">{ui("Nu ai salvat niciun produs la favorite.")}</p>
              <Link href="/products" className="text-gold-400 text-sm hover:underline mt-2 inline-block">
                {ui("Explorează produse →")}</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.favorites.map((fav) => (
                <div key={fav.id} className="bg-anthracite-800 border border-anthracite-700 rounded-xl overflow-hidden group">
                  <Link href={fav.products?.id ? `/products/${fav.products.id}` : "/products"}>
                    <div className="aspect-[16/10] bg-anthracite-700 relative overflow-hidden">
                      {fav.products?.images && fav.products.images.length > 0 ? (
                        <img src={fav.products.images[0]} alt={fav.products.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-anthracite-500" />
                        </div>
                      )}
                      <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                        fav.products?.condition === 'new' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {ui(fav.products?.condition === 'new' ? 'Nou' : 'SH')}
                      </span>
                    </div>
                  </Link>
                  <div className="p-3">
                    <p className="text-xs text-anthracite-400 uppercase">{ui(fav.products?.category)}</p>
                    <Link href={fav.products?.id ? `/products/${fav.products.id}` : "/products"}>
                      <h3 className="text-sm font-medium text-white mt-0.5 line-clamp-1 hover:text-gold-400 transition-colors">{fav.products?.name}</h3>
                    </Link>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-base font-bold text-gold-400">€{Number(fav.products?.price_eur).toLocaleString()}</span>
                      <button
                        disabled={!!removingFavorite || !fav.products?.id}
                        onClick={() => removeFavorite(fav.products?.id)}
                        className="text-anthracite-500 hover:text-red-400 transition-colors p-1"
                        title={ui("Elimină din favorite")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-anthracite-500 mt-1">{fav.products?.supplier_profiles?.company_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Contact Requests */}
        <MyGymProjects />
        {error && <div role="alert" className="border border-red-400/30 p-3 rounded-lg mb-4"><p>{ui(error)}</p><button className="btn-secondary" onClick={fetchDashboard}>{ui('Reîncearcă')}</button></div>}
        <nav aria-label={ui('Pagini istoric')} className="flex flex-wrap items-center gap-4 mb-6"><button className="btn-secondary" disabled={loading || page === 1} onClick={() => setPage(p => p - 1)}>{ui('Pagina anterioară')}</button><span>{ui('Pagina')} {data.pagination?.page ?? page}</span><button className="btn-secondary" disabled={loading || !data.pagination?.hasNext} onClick={() => setPage(p => p + 1)}>{ui('Pagina următoare')}</button></nav>
        <section id="cereri" className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            {ui("Cereri de Ofertă")}</h2>
          {data.contactRequests.length === 0 ? (
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-8 text-center">
              <MessageSquare className="w-10 h-10 text-anthracite-600 mx-auto mb-3" />
              <p className="text-anthracite-400 text-sm">{ui("Nu ai trimis nicio cerere de ofertă.")}</p>
              <Link href="/suppliers" className="text-gold-400 text-sm hover:underline mt-2 inline-block">
                {ui("Contactează un furnizor →")}</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.contactRequests.map((cr) => {
                const status = getDisplayStatus(cr);
                return (
                  <div key={cr.id} className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-anthracite-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-anthracite-500" />
                        </div>
                        <div className="min-w-0">
                          <Link href={`/suppliers/${cr.supplier_profiles?.id}`} className="text-sm font-medium text-white hover:text-gold-400 transition-colors">
                            {cr.supplier_profiles?.company_name}
                          </Link>
                          {cr.products && (
                            <p className="text-xs text-anthracite-400 truncate">{ui("Produs: ")}{cr.products?.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${status.color}`}>
                          {status.icon} {ui(status.text)}
                        </span>
                        <span className="text-xs text-anthracite-500">
                          {ui(new Date(cr.created_at).toLocaleDateString(ui('ro-RO')))}
                        </span>
                      </div>
                    </div>
                    {cr.message && (
                      <p className="text-xs text-anthracite-400 mt-2 pl-12 line-clamp-2">{cr.message}</p>
                    )}
                    {/* Chat toggle */}
                    <button
                      onClick={() => setOpenChat(openChat === cr.id ? null : cr.id)}
                      className="mt-3 ml-12 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      {ui(openChat === cr.id ? 'Ascunde conversația' : 'Deschide conversația')}
                      {openChat === cr.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {openChat === cr.id && (
                      <RequestChat requestId={cr.id} userRole="client" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Reviews */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-gold-400" />
            {ui("Recenziile Mele")}</h2>
          {data.reviews.length === 0 ? (
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-8 text-center">
              <Star className="w-10 h-10 text-anthracite-600 mx-auto mb-3" />
              <p className="text-anthracite-400 text-sm">{ui("Nu ai lăsat nicio recenzie.")}</p>
              <Link href="/suppliers" className="text-gold-400 text-sm hover:underline mt-2 inline-block">
                {ui("Lasă o recenzie unui furnizor →")}</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.reviews.map((review) => (
                <div key={review.id} className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-gold-400 fill-gold-400' : 'text-anthracite-600'}`} />
                        ))}
                      </div>
                      <Link href={`/suppliers/${review.supplier_profiles?.id}`} className="text-sm text-anthracite-300 hover:text-gold-400 transition-colors">
                        {review.supplier_profiles?.company_name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      {review.verified ? (
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {ui("Publicată")}</span>
                      ) : (
                        <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          {ui("În verificare")}</span>
                      )}
                      <span className="text-xs text-anthracite-500">{ui(new Date(review.created_at).toLocaleDateString(ui('ro-RO')))}</span>
                    </div>
                  </div>
                  <h4 className="text-sm font-medium text-white">{review.title}</h4>
                  {review.body && <p className="text-xs text-anthracite-400 mt-1 line-clamp-2">{review.body}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Setări Cont */}
        <section className="mt-10 bg-anthracite-900 border border-anthracite-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">{ui("Setări Cont")}</h3>
          <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-red-400 mb-2">{ui("Ștergerea contului")}</h4>
            <p className="text-anthracite-400 text-xs leading-relaxed mb-4">
              {ui("Conform GDPR Art. 17, ai dreptul de a solicita ștergerea completă a contului și a tuturor datelor personale asociate. Cererea va fi procesată în maxim 30 de zile. Această acțiune este ireversibilă.")}</p>
            <button
              onClick={async () => {
                if (!confirm(ui('Ești sigur că vrei să soliciți ștergerea contului? Această acțiune este ireversibilă și toate datele tale vor fi șterse permanent.'))) return;
                const reason = prompt(ui('Motiv (opțional):')) || '';
                try {
                  const res = await fetch('/api/account/delete-request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    alert(data.message || ui('Cererea a fost înregistrată.'));
                  } else {
                    alert(data.error || 'Eroare la trimiterea cererii.');
                  }
                } catch {
                  alert('Eroare de conexiune.');
                }
              }}
              className="px-4 py-2 text-sm font-medium text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              {ui("Solicită ștergerea contului")}</button>
            <Link href="/delete-account" className="mt-3 flex min-h-11 items-center text-sm text-gold-400 underline">{ui('Șterge contul Gym Builder')}</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

// ChatBox component for inline messaging
