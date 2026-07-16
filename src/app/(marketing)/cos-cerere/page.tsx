'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { ShoppingCart, Trash2, Send, Building2, Package, ArrowLeft, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const getGroupedBySupplier = useCartStore((s) => s.getGroupedBySupplier);
  const totalItems = useCartStore((s) => s.totalItems);

  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-anthracite-950 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Loader2 className="w-8 h-8 text-gold-400 animate-spin mx-auto" />
        </div>
      </main>
    );
  }

  const grouped = getGroupedBySupplier();
  const supplierCount = Object.keys(grouped).length;
  const count = totalItems();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim()) {
      setError('Numele și emailul sunt obligatorii.');
      return;
    }

    if (count === 0) {
      setError('Coșul de cerere este gol.');
      return;
    }

    setSending(true);

    try {
      // Send one request per supplier
      const promises = Object.entries(grouped).map(([supplierId, group]) => {
        const productNames = group.items.map(i => i.product.name).join(', ');
        const productIds = group.items.map(i => i.product.id);
        const fullMessage = `[Cerere multiplă - ${group.items.length} produs(e)]\n\nProduse solicitate: ${productNames}\n\n${form.message ? `Mesaj: ${form.message}` : ''}`;

        return fetch('/api/contact/supplier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone || '',
            message: fullMessage,
            supplierId: supplierId,
            productId: productIds[0], // Primary product
          }),
        });
      });

      const results = await Promise.all(promises);
      const allOk = results.every(r => r.ok);

      if (allOk) {
        setSuccess(true);
        clearCart();
      } else {
        setError('Unele cereri nu au putut fi trimise. Te rugăm să încerci din nou.');
      }
    } catch {
      setError('Eroare la trimiterea cererilor. Verifică conexiunea la internet.');
    } finally {
      setSending(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-anthracite-950 pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-anthracite-900 border border-anthracite-700 rounded-2xl p-12">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-3">Cererile au fost trimise cu succes!</h1>
            <p className="text-anthracite-300 mb-2">
              Am trimis <strong className="text-white">{supplierCount} cerere(i)</strong> către furnizori separați.
            </p>
            <p className="text-anthracite-400 text-sm mb-8">
              Fiecare furnizor a primit lista produselor solicitate și mesajul tău. Vei fi contactat pe email la adresa {form.email}.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/products" className="btn-primary inline-flex items-center gap-2">
                <Package className="w-4 h-4" />
                Continuă Explorarea
              </Link>
              <Link href="/" className="btn-ghost inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Acasă
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-anthracite-950 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <ShoppingCart className="w-7 h-7 text-gold-400" />
              Coș de Cerere
            </h1>
            <p className="text-anthracite-400 text-sm mt-1">
              {count > 0
                ? `${count} produs(e) de la ${supplierCount} furnizor(i)`
                : 'Coșul tău este gol'}
            </p>
          </div>
          {count > 0 && (
            <button
              onClick={clearCart}
              className="text-sm text-anthracite-400 hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Golește coșul
            </button>
          )}
        </div>

        {count === 0 ? (
          /* Empty State */
          <div className="bg-anthracite-900 border border-anthracite-700 rounded-2xl p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-anthracite-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Niciun produs în coș</h2>
            <p className="text-anthracite-400 mb-6">
              Adaugă produse din catalog pentru a trimite cereri de ofertă către mai mulți furnizori simultan.
            </p>
            <Link href="/products" className="btn-primary inline-flex items-center gap-2">
              <Package className="w-4 h-4" />
              Explorează Echipamente
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Products grouped by supplier */}
            <div className="lg:col-span-2 space-y-6">
              {Object.entries(grouped).map(([supplierId, group]) => (
                <div key={supplierId} className="bg-anthracite-900 border border-anthracite-700 rounded-xl overflow-hidden">
                  {/* Supplier Header */}
                  <div className="bg-anthracite-800 px-5 py-3 border-b border-anthracite-700 flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-gold-400" />
                    <Link href={`/suppliers/${supplierId}`} className="text-sm font-semibold text-white hover:text-gold-400 transition-colors">
                      {group.supplierName}
                    </Link>
                    <span className="text-xs text-anthracite-400 ml-auto">
                      {group.items.length} produs(e)
                    </span>
                  </div>

                  {/* Products */}
                  <div className="divide-y divide-anthracite-700/50">
                    {group.items.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-4 p-4">
                        {/* Image */}
                        <div className="w-16 h-16 bg-anthracite-700 rounded-lg overflow-hidden flex-shrink-0">
                          {item.product.images && item.product.images.length > 0 ? (
                            <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-anthracite-500" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <Link href={`/products/${item.product.id}`} className="text-sm font-medium text-white hover:text-gold-400 transition-colors line-clamp-1">
                            {item.product.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              item.product.condition === 'new' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {item.product.condition === 'new' ? 'Nou' : 'SH'}
                            </span>
                            <span className="text-xs text-anthracite-400 capitalize">{item.product.category}</span>
                          </div>
                        </div>

                        {/* Price */}
                        <span className="text-sm font-bold text-gold-400 whitespace-nowrap">
                          €{Number(item.product.price_eur).toLocaleString()}
                        </span>

                        {/* Remove */}
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="p-2 text-anthracite-500 hover:text-red-400 transition-colors"
                          title="Elimină din coș"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Request Form */}
            <div className="lg:col-span-1">
              <div className="bg-anthracite-900 border border-anthracite-700 rounded-xl p-6 sticky top-24">
                <h2 className="text-lg font-bold text-white mb-1">Trimite Cererea</h2>
                <p className="text-xs text-anthracite-400 mb-5">
                  Se va trimite câte o cerere separată către fiecare furnizor cu produsele lui.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-anthracite-300 block mb-1">Nume *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-anthracite-800 border border-anthracite-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-anthracite-500 focus:border-gold-400/50 focus:outline-none transition-colors"
                      placeholder="Numele tău"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-anthracite-300 block mb-1">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-anthracite-800 border border-anthracite-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-anthracite-500 focus:border-gold-400/50 focus:outline-none transition-colors"
                      placeholder="email@exemplu.ro"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-anthracite-300 block mb-1">Telefon</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-anthracite-800 border border-anthracite-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-anthracite-500 focus:border-gold-400/50 focus:outline-none transition-colors"
                      placeholder="07xx xxx xxx"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-anthracite-300 block mb-1">Mesaj comun</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full bg-anthracite-800 border border-anthracite-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-anthracite-500 focus:border-gold-400/50 focus:outline-none transition-colors resize-none"
                      rows={3}
                      placeholder="Detalii suplimentare (opțional)..."
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sending || count === 0}
                    className="w-full bg-gold-400 text-anthracite-950 font-bold py-3 rounded-xl hover:bg-gold-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Se trimit {supplierCount} cerere(i)...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Trimite Cererea ({supplierCount} furnizor{supplierCount > 1 ? 'i' : ''})
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-anthracite-500 text-center">
                    Fiecare furnizor primește doar produsele lui + mesajul tău.
                  </p>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
