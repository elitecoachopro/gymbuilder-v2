'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Dumbbell, Plus, Pencil, Trash2, Loader2, Package, ArrowLeft, Eye, EyeOff, CheckCircle, LogOut, X, Save, PackagePlus } from 'lucide-react';

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
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price_eur: '', description: '', category: '', condition: '' });
  const [editLoading, setEditLoading] = useState(false);

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
      if (res.status === 401) {
        router.push('/login');
        return;
      }
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
    const newStatus = product.status === 'active' || product.status === 'featured' ? 'inactive' : 'active';
    setActionLoading(product.id);

    try {
      const res = await fetch('/api/supplier/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, status: newStatus }),
      });

      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus as any } : p));
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

  function openEditModal(product: Product) {
    setEditProduct(product);
    setEditForm({
      name: product.name,
      price_eur: String(product.price_eur),
      description: product.description || '',
      category: product.category,
      condition: product.condition,
    });
  }

  async function saveEdit() {
    if (!editProduct) return;
    setEditLoading(true);

    try {
      const res = await fetch('/api/supplier/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: editProduct.id,
          name: editForm.name,
          price_eur: Number(editForm.price_eur),
          description: editForm.description,
          category: editForm.category,
          condition: editForm.condition,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProducts(prev => prev.map(p => p.id === editProduct.id ? {
          ...p,
          name: editForm.name,
          price_eur: Number(editForm.price_eur),
          description: editForm.description,
          category: editForm.category,
          condition: editForm.condition as 'new' | 'used',
        } : p));
        showToast('✅ Produs actualizat cu succes!');
        setEditProduct(null);
      } else {
        const data = await res.json();
        showToast(data.error || 'Eroare la actualizare.', 'error');
      }
    } catch {
      showToast('Eroare de conexiune.', 'error');
    } finally {
      setEditLoading(false);
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

        {/* Edit Modal */}
        {editProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-anthracite-900 border border-anthracite-700 rounded-2xl p-6 max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setEditProduct(null)}
                className="absolute top-4 right-4 text-anthracite-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-white mb-6">Editează Produs</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Nume produs *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Preț (EUR) *</label>
                    <input
                      type="number"
                      className="input-field"
                      value={editForm.price_eur}
                      onChange={(e) => setEditForm({ ...editForm, price_eur: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Condiție</label>
                    <select
                      className="input-field"
                      value={editForm.condition}
                      onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                    >
                      <option value="new">Nou</option>
                      <option value="used">Second-hand</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Categorie</label>
                  <select
                    className="input-field"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  >
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Descriere</label>
                  <textarea
                    className="input-field min-h-[100px] resize-y"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditProduct(null)}
                    className="flex-1 py-2.5 px-4 rounded-lg border border-anthracite-600 text-anthracite-300 hover:text-white text-sm font-medium transition-colors"
                  >
                    Anulează
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={editLoading || !editForm.name || !editForm.price_eur}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-gold-400 text-anthracite-950 hover:bg-gold-300 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {editLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Salvează
                  </button>
                </div>
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
                {loading ? 'Se încarcă...' : `${products.length} ${products.length === 1 ? 'produs' : 'produse'} în total`}
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
          /* Empty State */
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gold-400/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <PackagePlus className="w-10 h-10 text-gold-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Nu ai niciun produs încă</h2>
            <p className="text-anthracite-400 text-sm mb-2 max-w-md mx-auto">
              Adaugă primul tău produs pentru a fi vizibil pe platformă și a primi cereri de ofertă de la clienți.
            </p>
            <p className="text-anthracite-500 text-xs mb-6 max-w-md mx-auto">
              Poți adăuga imagini, preț, categorie și descriere detaliată pentru fiecare echipament.
            </p>
            <Link
              href="/supplier/products/new"
              className="btn-primary px-8 py-3 inline-flex items-center gap-2 text-base"
            >
              <Plus className="w-5 h-5" />
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
                  Disponibile ({activeProducts.length})
                </h2>
                <div className="space-y-3">
                  {activeProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      actionLoading={actionLoading}
                      onToggleStatus={() => toggleStatus(product)}
                      onEdit={() => openEditModal(product)}
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
                  Indisponibile ({inactiveProducts.length})
                </h2>
                <div className="space-y-3 opacity-70">
                  {inactiveProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      actionLoading={actionLoading}
                      onToggleStatus={() => toggleStatus(product)}
                      onEdit={() => openEditModal(product)}
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
  onEdit,
  onDelete,
}: {
  product: Product;
  actionLoading: string | null;
  onToggleStatus: () => void;
  onEdit: () => void;
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
          <span className="text-xs text-anthracite-600">&bull;</span>
          <span className="text-xs text-anthracite-400">{product.condition === 'new' ? 'Nou' : 'Second-hand'}</span>
          <span className="text-xs text-anthracite-600">&bull;</span>
          <span className="text-xs text-gold-400 font-medium">&euro;{Number(product.price_eur).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
            product.status === 'active' || product.status === 'featured'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-anthracite-700 text-anthracite-400'
          }`}>
            {product.status === 'active' || product.status === 'featured' ? 'Disponibil' : 'Indisponibil'}
          </span>
          <span className="text-[10px] text-anthracite-500">
            Adăugat: {new Date(product.created_at).toLocaleDateString('ro-RO')}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Edit */}
        <button
          onClick={onEdit}
          disabled={actionLoading === product.id}
          className="p-2 rounded-lg text-anthracite-400 hover:text-gold-400 hover:bg-gold-400/10 transition-colors"
          title="Editează"
        >
          <Pencil className="w-4 h-4" />
        </button>

        {/* Toggle Active/Inactive */}
        <button
          onClick={onToggleStatus}
          disabled={actionLoading === product.id}
          className={`p-2 rounded-lg transition-colors ${
            product.status === 'active' || product.status === 'featured'
              ? 'text-emerald-400 hover:bg-emerald-500/10'
              : 'text-anthracite-400 hover:bg-anthracite-700'
          }`}
          title={product.status === 'active' || product.status === 'featured' ? 'Marchează indisponibil' : 'Marchează disponibil'}
        >
          {actionLoading === product.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : product.status === 'active' || product.status === 'featured' ? (
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
