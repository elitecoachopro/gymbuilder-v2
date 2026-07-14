'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Dumbbell, Plus, Pencil, Trash2, Loader2, Package, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle, LogOut } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  brand_id: string | null;
  condition: 'new' | 'used';
  price_eur: number;
  images: string[];
  status: 'active' | 'inactive' | 'featured';
  created_at: string;
  updated_at: string;
}

const categoryLabels: Record<string, string> = {
  cardio: 'Cardio',
  strength: 'Forță',
  functional: 'Funcțional',
  accessories: 'Accesorii',
  wellness: 'Wellness',
  lockers: 'Vestiare',
  reception: 'Recepție',
};

export default function SupplierProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 4000);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/supplier/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      } else {
        const data = await res.json();
        showToast(data.error || 'Eroare la încărcarea produselor.', 'error');
      }
    } catch {
      showToast('Eroare de conexiune.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(product: Product) {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    setActionLoading(product.id);

    try {
      const res = await fetch('/api/supplier/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, status: newStatus }),
      });

      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
        showToast(newStatus === 'active' ? '✅ Produs activat!' : '⏸️ Produs dezactivat.');
      } else {
        const data = await res.json();
        showToast(data.error || 'Eroare.', 'error');
      }
    } catch {
      showToast('Eroare de conexiune.', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteProduct(productId: string) {
    setActionLoading(productId);

    try {
      const res = await fetch(`/api/supplier/products?id=${productId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        showToast('🗑️ Produs șters cu succes.');
      } else {
        const data = await res.json();
        showToast(data.error || 'Eroare la ștergere.', 'error');
      }
    } catch {
      showToast('Eroare de conexiune.', 'error');
    } finally {
      setActionLoading(null);
      setDeleteConfirm(null);
    }
  }

  const activeProducts = products.filter(p => p.status === 'active' || p.status === 'featured');
  const inactiveProducts = products.filter(p => p.status === 'inactive');

  return (
    <main className="min-h-screen bg-anthracite-950 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in border ${
            toastType === 'success'
              ? 'bg-anthracite-800 border-gold-400/30 text-gold-400'
              : 'bg-anthracite-800 border-red-400/30 text-red-400'
          }`}>
            {toast}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-2xl p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-bold text-white mb-2">Confirmare Ștergere</h3>
              <p className="text-sm text-anthracite-300 mb-6">
                Ești sigur că vrei să ștergi acest produs? Acțiunea este ireversibilă.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-anthracite-600 text-anthracite-300 hover:text-white hover:border-anthracite-500 text-sm font-medium transition-colors"
                >
                  Anulează
                </button>
                <button
                  onClick={() => deleteProduct(deleteConfirm)}
                  disabled={actionLoading === deleteConfirm}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-red-500 text-white hover:bg-red-600 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === deleteConfirm ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Șterge
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/supplier/dashboard"
              className="p-2 rounded-lg hover:bg-anthracite-800 text-anthracite-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Produsele Mele</h1>
              <p className="text-anthracite-400 text-sm mt-1">
                {products.length} {products.length === 1 ? 'produs' : 'produse'} în total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/supplier/products/new"
              className="btn-primary px-5 py-2.5 flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Adaugă Produs
            </Link>
            <button
              onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login'; }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-anthracite-700 text-anthracite-300 hover:text-red-400 hover:border-red-400/30 text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-gold-400 animate-spin mb-4" />
            <p className="text-anthracite-400 text-sm">Se încarcă produsele...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-anthracite-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Niciun produs încă</h2>
            <p className="text-anthracite-400 text-sm mb-6">Adaugă primul tău produs pentru a-l afișa pe platformă.</p>
            <Link
              href="/supplier/products/new"
              className="btn-primary px-6 py-3 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adaugă Primul Produs
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Products */}
            {activeProducts.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-anthracite-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Active ({activeProducts.length})
                </h2>
                <div className="space-y-3">
                  {activeProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      actionLoading={actionLoading}
                      onToggleStatus={() => toggleStatus(product)}
                      onDelete={() => setDeleteConfirm(product.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Inactive Products */}
            {inactiveProducts.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-anthracite-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-anthracite-500" />
                  Inactive ({inactiveProducts.length})
                </h2>
                <div className="space-y-3 opacity-70">
                  {inactiveProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      actionLoading={actionLoading}
                      onToggleStatus={() => toggleStatus(product)}
                      onDelete={() => setDeleteConfirm(product.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function ProductCard({
  product,
  actionLoading,
  onToggleStatus,
  onDelete,
}: {
  product: Product;
  actionLoading: string | null;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 flex items-center gap-4">
      {/* Image */}
      <div className="w-16 h-16 rounded-lg bg-anthracite-700 flex-shrink-0 overflow-hidden flex items-center justify-center">
        {product.images && product.images.length > 0 ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Dumbbell className="w-6 h-6 text-anthracite-500" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-medium text-sm truncate">{product.name}</h3>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-anthracite-400">{categoryLabels[product.category] || product.category}</span>
          <span className="text-xs text-anthracite-600">•</span>
          <span className="text-xs text-anthracite-400">{product.condition === 'new' ? 'Nou' : 'Second-hand'}</span>
          <span className="text-xs text-anthracite-600">•</span>
          <span className="text-xs text-gold-400 font-medium">€{Number(product.price_eur).toLocaleString()}</span>
        </div>
        <p className="text-xs text-anthracite-500 mt-1">
          Adăugat: {new Date(product.created_at).toLocaleDateString('ro-RO')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Toggle Active/Inactive */}
        <button
          onClick={onToggleStatus}
          disabled={actionLoading === product.id}
          className={`p-2 rounded-lg transition-colors ${
            product.status === 'active'
              ? 'text-emerald-400 hover:bg-emerald-500/10'
              : 'text-anthracite-400 hover:bg-anthracite-700'
          }`}
          title={product.status === 'active' ? 'Dezactivează' : 'Activează'}
        >
          {actionLoading === product.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : product.status === 'active' ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          disabled={actionLoading === product.id}
          className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          title="Șterge"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
