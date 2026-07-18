'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, Heart, MessageSquare, Star, Building2, Package, Loader2, Dumbbell, Clock, Send, CheckCircle, ArrowRight, Trash2, LogOut, ChevronDown, ChevronUp, LayoutGrid, Home } from 'lucide-react';
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
  user: { id: string; full_name: string; email: string };
  contactRequests: ContactRequest[];
  favorites: Favorite[];
  reviews: Review[];
  recentSuppliers: RecentSupplier[];
}

export default function ClientDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openChat, setOpenChat] = useState<string | null>(null);
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

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const res = await fetch('/api/client/dashboard');
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
    try {
      const res = await fetch('/api/client/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });
      if (res.ok) {
        setData(prev => prev ? {
          ...prev,
          favorites: prev.favorites.filter(f => f.products?.id !== productId)
        } : prev);
      }
    } catch {}
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-anthracite-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-anthracite-950 flex flex-col items-center justify-center px-4">
        <Building2 className="w-16 h-16 text-anthracite-600 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">{error}</h1>
        <Link href="/login" className="text-gold-400 hover:underline text-sm mt-4">
          Autentifică-te →
        </Link>
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
            <h1 className="text-2xl font-bold text-white">Bun venit, {data.user.full_name}!</h1>
            <p className="text-anthracite-400 text-sm mt-1">Dashboard-ul tău de client</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <NotificationBell />
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-anthracite-700 text-anthracite-300 hover:text-gold-400 hover:border-gold-400/30 text-sm font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              Homepage
            </Link>
            <Link
              href="/client/configurator"
              className="flex items-center gap-2 bg-indigo-500 text-white font-bold px-5 py-3 rounded-lg hover:bg-indigo-400 transition-colors"
            >
              <LayoutGrid className="w-4 h-4" />
              Configurator Sală
            </Link>
            <Link
              href="/products"
              className="flex items-center gap-2 bg-gold-400 text-anthracite-950 font-bold px-5 py-3 rounded-lg hover:bg-gold-300 transition-colors"
            >
              <Search className="w-4 h-4" />
              Caută Echipamente
            </Link>
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-anthracite-700 text-anthracite-300 hover:text-red-400 hover:border-red-400/30 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {logoutLoading ? 'Se deconectează...' : 'Logout'}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 text-center">
            <Send className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{data.contactRequests.length}</p>
            <p className="text-xs text-anthracite-400">Cereri Trimise</p>
          </div>
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 text-center">
            <Heart className="w-5 h-5 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{data.favorites.length}</p>
            <p className="text-xs text-anthracite-400">Favorite</p>
          </div>
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 text-center">
            <Star className="w-5 h-5 text-gold-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{data.reviews.length}</p>
            <p className="text-xs text-anthracite-400">Recenzii</p>
          </div>
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 text-center">
            <Building2 className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{data.recentSuppliers.length}</p>
            <p className="text-xs text-anthracite-400">Furnizori Contactați</p>
          </div>
        </div>

        {/* Recent Suppliers */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gold-400" />
            Furnizori Contactați Recent
          </h2>
          {data.recentSuppliers.length === 0 ? (
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-8 text-center">
              <Building2 className="w-10 h-10 text-anthracite-600 mx-auto mb-3" />
              <p className="text-anthracite-400 text-sm">Nu ai contactat niciun furnizor încă.</p>
              <Link href="/suppliers" className="text-gold-400 text-sm hover:underline mt-2 inline-block">
                Explorează furnizori →
              </Link>
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
                    Contactat: {new Date(supplier.last_contact).toLocaleDateString('ro-RO')}
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
            Produse Favorite
          </h2>
          {data.favorites.length === 0 ? (
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-8 text-center">
              <Heart className="w-10 h-10 text-anthracite-600 mx-auto mb-3" />
              <p className="text-anthracite-400 text-sm">Nu ai salvat niciun produs la favorite.</p>
              <Link href="/products" className="text-gold-400 text-sm hover:underline mt-2 inline-block">
                Explorează produse →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.favorites.map((fav) => (
                <div key={fav.id} className="bg-anthracite-800 border border-anthracite-700 rounded-xl overflow-hidden group">
                  <Link href={`/products/${fav.products?.id}`}>
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
                        {fav.products?.condition === 'new' ? 'Nou' : 'SH'}
                      </span>
                    </div>
                  </Link>
                  <div className="p-3">
                    <p className="text-xs text-anthracite-400 uppercase">{fav.products?.category}</p>
                    <Link href={`/products/${fav.products?.id}`}>
                      <h3 className="text-sm font-medium text-white mt-0.5 line-clamp-1 hover:text-gold-400 transition-colors">{fav.products?.name}</h3>
                    </Link>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-base font-bold text-gold-400">€{Number(fav.products?.price_eur).toLocaleString()}</span>
                      <button
                        onClick={() => removeFavorite(fav.products?.id)}
                        className="text-anthracite-500 hover:text-red-400 transition-colors p-1"
                        title="Elimină din favorite"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-anthracite-500 mt-1">{(fav.products as any)?.supplier_profiles?.company_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Contact Requests */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            Cereri de Ofertă
          </h2>
          {data.contactRequests.length === 0 ? (
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-8 text-center">
              <MessageSquare className="w-10 h-10 text-anthracite-600 mx-auto mb-3" />
              <p className="text-anthracite-400 text-sm">Nu ai trimis nicio cerere de ofertă.</p>
              <Link href="/suppliers" className="text-gold-400 text-sm hover:underline mt-2 inline-block">
                Contactează un furnizor →
              </Link>
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
                          <Link href={`/suppliers/${(cr.supplier_profiles as any)?.id}`} className="text-sm font-medium text-white hover:text-gold-400 transition-colors">
                            {(cr.supplier_profiles as any)?.company_name}
                          </Link>
                          {cr.products && (
                            <p className="text-xs text-anthracite-400 truncate">Produs: {(cr.products as any)?.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${status.color}`}>
                          {status.icon} {status.text}
                        </span>
                        <span className="text-xs text-anthracite-500">
                          {new Date(cr.created_at).toLocaleDateString('ro-RO')}
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
                      {openChat === cr.id ? 'Ascunde conversația' : 'Deschide conversația'}
                      {openChat === cr.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {openChat === cr.id && (
                      <ChatBox requestId={cr.id} userRole="client" />
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
            Recenziile Mele
          </h2>
          {data.reviews.length === 0 ? (
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-8 text-center">
              <Star className="w-10 h-10 text-anthracite-600 mx-auto mb-3" />
              <p className="text-anthracite-400 text-sm">Nu ai lăsat nicio recenzie.</p>
              <Link href="/suppliers" className="text-gold-400 text-sm hover:underline mt-2 inline-block">
                Lasă o recenzie unui furnizor →
              </Link>
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
                      <Link href={`/suppliers/${(review.supplier_profiles as any)?.id}`} className="text-sm text-anthracite-300 hover:text-gold-400 transition-colors">
                        {(review.supplier_profiles as any)?.company_name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      {review.verified ? (
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Publicată
                        </span>
                      ) : (
                        <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          În verificare
                        </span>
                      )}
                      <span className="text-xs text-anthracite-500">{new Date(review.created_at).toLocaleDateString('ro-RO')}</span>
                    </div>
                  </div>
                  <h4 className="text-sm font-medium text-white">{review.title}</h4>
                  {review.body && <p className="text-xs text-anthracite-400 mt-1 line-clamp-2">{review.body}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// ChatBox component for inline messaging
function ChatBox({ requestId, userRole }: { requestId: string; userRole: 'client' | 'supplier' }) {
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

  if (loading) {
    return (
      <div className="mt-3 ml-0 sm:ml-12 flex items-center gap-2 text-xs text-anthracite-400">
        <Loader2 className="w-3 h-3 animate-spin" /> Se încarcă mesajele...
      </div>
    );
  }

  return (
    <div className="mt-3 ml-0 sm:ml-12 border border-anthracite-700 rounded-lg overflow-hidden">
      {/* Messages list */}
      <div className="max-h-64 overflow-y-auto p-3 space-y-2 bg-anthracite-900/50">
        {messages.length === 0 ? (
          <p className="text-xs text-anthracite-500 text-center py-4">Niciun mesaj încă. Începe conversația!</p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_type === userRole;
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
                    {new Date(msg.created_at).toLocaleString('ro-RO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
          placeholder="Scrie un mesaj..."
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
