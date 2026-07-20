'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Dumbbell, Plus, Pencil, Trash2, Loader2, Package, ArrowLeft, Eye, EyeOff, CheckCircle, LogOut, X, Save, PackagePlus, Upload, Download, AlertTriangle, FileSpreadsheet, Layers } from 'lucide-react';
import { useClientTranslations } from '@/i18n/client';

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

export default function SupplierProductsPage() {
  const router = useRouter();
  const { t, locale } = useClientTranslations('supplierProducts');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price_eur: '', description: '', category: '', condition: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [csvPreview, setCsvPreview] = useState<any>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);

  // Variants state
  const [variantsProduct, setVariantsProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<{id: string; label: string; price_override: number|null; description_override: string|null; image_url: string|null}[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [newVariant, setNewVariant] = useState({ label: '', price_override: '', description_override: '', image_url: '' });
  const [addingVariant, setAddingVariant] = useState(false);

  const categoryLabels: Record<string, string> = {
    cardio: t('categories.cardio'),
    strength: t('categories.strength'),
    functional: t('categories.functional'),
    accessories: t('categories.accessories'),
    wellness: t('categories.wellness'),
    lockers: t('categories.lockers'),
    reception: t('categories.reception'),
  };

  const dateLocale = locale === 'en' ? 'en-GB' : 'ro-RO';

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
        showToast(data.error || t('loadError'), 'error');
      }
    } catch {
      showToast(t('connectionError'), 'error');
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
        showToast(newStatus === 'active' ? t('productActivated') : t('productDeactivated'));
      } else {
        const data = await res.json();
        showToast(data.error || t('loadError'), 'error');
      }
    } catch {
      showToast(t('connectionError'), 'error');
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
        showToast(t('productDeleted'));
      } else {
        const data = await res.json();
        showToast(data.error || t('deleteError'), 'error');
      }
    } catch {
      showToast(t('connectionError'), 'error');
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
        setProducts(prev => prev.map(p => p.id === editProduct.id ? {
          ...p,
          name: editForm.name,
          price_eur: Number(editForm.price_eur),
          description: editForm.description,
          category: editForm.category,
          condition: editForm.condition as 'new' | 'used',
        } : p));
        showToast(t('productUpdated'));
        setEditProduct(null);
      } else {
        const data = await res.json();
        showToast(data.error || t('updateError'), 'error');
      }
    } catch {
      showToast(t('connectionError'), 'error');
    } finally {
      setEditLoading(false);
    }
  }

  // Variants functions
  async function openVariantsModal(product: Product) {
    setVariantsProduct(product);
    setVariantsLoading(true);
    setVariants([]);
    setNewVariant({ label: '', price_override: '', description_override: '', image_url: '' });
    try {
      const res = await fetch(`/api/supplier/products/variants?product_id=${product.id}`);
      if (res.ok) {
        const data = await res.json();
        setVariants(data.variants || []);
      } else {
        showToast(t('variants.loadError'), 'error');
      }
    } catch {
      showToast(t('connectionError'), 'error');
    } finally {
      setVariantsLoading(false);
    }
  }

  async function addVariant() {
    if (!variantsProduct || !newVariant.label.trim()) return;
    setAddingVariant(true);
    try {
      const res = await fetch('/api/supplier/products/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: variantsProduct.id,
          label: newVariant.label.trim(),
          price_override: newVariant.price_override ? Number(newVariant.price_override) : null,
          description_override: newVariant.description_override.trim() || null,
          image_url: newVariant.image_url.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setVariants(prev => [...prev, data.variant]);
        setNewVariant({ label: '', price_override: '', description_override: '', image_url: '' });
        showToast(t('variants.added'));
      } else {
        const data = await res.json();
        showToast(data.error || t('variants.addError'), 'error');
      }
    } catch {
      showToast(t('connectionError'), 'error');
    } finally {
      setAddingVariant(false);
    }
  }

  async function deleteVariant(variantId: string) {
    try {
      const res = await fetch(`/api/supplier/products/variants?id=${variantId}`, { method: 'DELETE' });
      if (res.ok) {
        setVariants(prev => prev.filter(v => v.id !== variantId));
        showToast(t('variants.deleted'));
      } else {
        const data = await res.json();
        showToast(data.error || t('variants.deleteError'), 'error');
      }
    } catch {
      showToast(t('connectionError'), 'error');
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
              <h3 className="text-lg font-bold text-white mb-2">{t('deleteConfirmTitle')}</h3>
              <p className="text-sm text-anthracite-300 mb-6">
                {t('deleteConfirmMessage')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-anthracite-600 text-anthracite-300 hover:text-white hover:border-anthracite-500 text-sm font-medium transition-colors"
                >
                  {t('cancel')}
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
                  {t('delete')}
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

              <h3 className="text-lg font-bold text-white mb-6">{t('editProduct')}</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('productName')} *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('priceEur')} *</label>
                    <input
                      type="number"
                      className="input-field"
                      value={editForm.price_eur}
                      onChange={(e) => setEditForm({ ...editForm, price_eur: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('condition')}</label>
                    <select
                      className="input-field"
                      value={editForm.condition}
                      onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                    >
                      <option value="new">{t('conditionNew')}</option>
                      <option value="used">{t('conditionUsed')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('category')}</label>
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
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('description')}</label>
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
                    {t('cancel')}
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
                    {t('save')}
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
              <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
              <p className="text-anthracite-400 text-sm mt-1">
                {loading ? t('loadingProducts') : `${products.length} ${products.length === 1 ? t('productSingular') : t('productPlural')} ${t('totalProducts')}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCsvImport(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-anthracite-700 text-anthracite-300 hover:text-gold-400 hover:border-gold-400/30 text-sm font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              {t('importCsv')}
            </button>
            <Link
              href="/supplier/products/new"
              className="btn-primary px-5 py-2.5 flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              {t('addProduct')}
            </Link>
            <button
              onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login'; }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-anthracite-700 text-anthracite-300 hover:text-red-400 hover:border-red-400/30 text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" /> {t('logout')}
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-gold-400 animate-spin mb-4" />
            <p className="text-anthracite-400 text-sm">{t('loadingProducts')}</p>
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gold-400/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <PackagePlus className="w-10 h-10 text-gold-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">{t('emptyTitle')}</h2>
            <p className="text-anthracite-400 text-sm mb-2 max-w-md mx-auto">
              {t('emptyDescription')}
            </p>
            <p className="text-anthracite-500 text-xs mb-6 max-w-md mx-auto">
              {t('emptyHint')}
            </p>
            <Link
              href="/supplier/products/new"
              className="btn-primary px-8 py-3 inline-flex items-center gap-2 text-base"
            >
              <Plus className="w-5 h-5" />
              {t('addFirstProduct')}
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Products */}
            {activeProducts.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-anthracite-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  {t('available')} ({activeProducts.length})
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
                      onVariants={() => openVariantsModal(product)}
                      t={t}
                      locale={locale}
                      categoryLabels={categoryLabels}
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
                  {t('unavailable')} ({inactiveProducts.length})
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
                      onVariants={() => openVariantsModal(product)}
                      t={t}
                      locale={locale}
                      categoryLabels={categoryLabels}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Variants Management Modal */}
      {variantsProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-anthracite-900 border border-anthracite-700 rounded-2xl p-6 max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setVariantsProduct(null)}
              className="absolute top-4 right-4 text-anthracite-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              {t('variants.title')}
            </h3>
            <p className="text-sm text-anthracite-400 mb-6 truncate">{variantsProduct.name}</p>

            {/* Existing variants list */}
            {variantsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gold-400" />
              </div>
            ) : variants.length > 0 ? (
              <div className="space-y-2 mb-6">
                <p className="text-xs font-medium text-anthracite-300 uppercase tracking-wider">{t('variants.existing')} ({variants.length}/10)</p>
                {variants.map(v => (
                  <div key={v.id} className="flex items-center justify-between bg-anthracite-800 border border-anthracite-700 rounded-lg px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white font-medium">{v.label}</span>
                      {v.price_override && (
                        <span className="ml-2 text-xs text-gold-400">&euro;{Number(v.price_override).toLocaleString()}</span>
                      )}
                      {v.description_override && (
                        <p className="text-xs text-anthracite-400 truncate mt-0.5">{v.description_override}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteVariant(v.id)}
                      className="p-1.5 rounded text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0 ml-2"
                      title={t('variants.deleteVariant')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 mb-6">
                <Layers className="w-8 h-8 text-anthracite-600 mx-auto mb-2" />
                <p className="text-sm text-anthracite-400">{t('variants.emptyTitle')}</p>
                <p className="text-xs text-anthracite-500 mt-1">{t('variants.emptyHint')}</p>
              </div>
            )}

            {/* Add new variant form */}
            {variants.length < 10 && (
              <div className="border-t border-anthracite-700 pt-4">
                <p className="text-xs font-medium text-anthracite-300 uppercase tracking-wider mb-3">{t('variants.addNew')}</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-anthracite-400 mb-1">{t('variants.labelName')} *</label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      placeholder={t('variants.labelPlaceholder')}
                      value={newVariant.label}
                      onChange={(e) => setNewVariant({ ...newVariant, label: e.target.value })}
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-anthracite-400 mb-1">{t('variants.priceOverride')}</label>
                    <input
                      type="number"
                      className="input-field text-sm"
                      placeholder={t('variants.pricePlaceholder')}
                      value={newVariant.price_override}
                      onChange={(e) => setNewVariant({ ...newVariant, price_override: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-anthracite-400 mb-1">{t('variants.descriptionOverride')}</label>
                    <textarea
                      className="input-field text-sm min-h-[60px] resize-y"
                      placeholder={t('variants.descriptionPlaceholder')}
                      value={newVariant.description_override}
                      onChange={(e) => setNewVariant({ ...newVariant, description_override: e.target.value })}
                      maxLength={500}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-anthracite-400 mb-1">{t('variants.imageUrl')}</label>
                    <input
                      type="url"
                      className="input-field text-sm"
                      placeholder="https://..."
                      value={newVariant.image_url}
                      onChange={(e) => setNewVariant({ ...newVariant, image_url: e.target.value })}
                    />
                  </div>
                  <button
                    onClick={addVariant}
                    disabled={addingVariant || !newVariant.label.trim()}
                    className="w-full py-2.5 rounded-lg bg-purple-500 text-white hover:bg-purple-400 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {addingVariant ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {t('variants.addButton')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-anthracite-900 border border-anthracite-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-gold-400" />
                {t('csvImport.title')}
              </h2>
              <button onClick={() => { setShowCsvImport(false); setCsvPreview(null); setCsvContent(''); }} className="text-anthracite-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template download */}
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 mb-4">
              <p className="text-sm text-anthracite-300 mb-2">{t('csvImport.templateDescription')}</p>
              <button
                onClick={() => {
                  const template = 'nume,descriere,pret,categorie,stare,imagine_url\nBandă de alergare Pro X1,Bandă profesională cu motor 5CP,2500,cardio,nou,https://example.com/img.jpg\nGanteră 20kg,Set gantere hexagonale,150,strength,second-hand,';
                  const blob = new Blob([template], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'template_import_produse.csv'; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-2 text-sm text-gold-400 hover:text-gold-300 font-medium"
              >
                <Download className="w-4 h-4" />
                {t('csvImport.downloadTemplate')}
              </button>
              <p className="text-xs text-anthracite-500 mt-2">{t('csvImport.validCategories')}</p>
              <p className="text-xs text-anthracite-500">{t('csvImport.validConditions')}</p>
            </div>

            {!csvPreview ? (
              <>
                {/* File upload */}
                <div className="border-2 border-dashed border-anthracite-700 rounded-xl p-8 text-center mb-4 hover:border-gold-400/30 transition-colors">
                  <Upload className="w-8 h-8 text-anthracite-500 mx-auto mb-2" />
                  <p className="text-sm text-anthracite-300 mb-3">{t('csvImport.uploadHint')}</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setCsvContent(ev.target?.result as string || '');
                        reader.readAsText(file);
                      }
                    }}
                    className="text-sm text-anthracite-300"
                  />
                </div>
                <textarea
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder={t('csvImport.pastePlaceholder')}
                  className="w-full h-32 bg-anthracite-800 border border-anthracite-700 rounded-xl p-3 text-sm text-white placeholder-anthracite-500 font-mono resize-none"
                />
                <button
                  onClick={async () => {
                    if (!csvContent.trim()) { showToast(t('csvImport.noContent'), 'error'); return; }
                    setCsvLoading(true);
                    try {
                      const res = await fetch('/api/supplier/products/import', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ csvContent, confirm: false }),
                      });
                      const data = await res.json();
                      if (!res.ok) { showToast(data.error || t('csvImport.validationError'), 'error'); return; }
                      setCsvPreview(data);
                    } catch { showToast(t('csvImport.validationError'), 'error'); }
                    finally { setCsvLoading(false); }
                  }}
                  disabled={csvLoading || !csvContent.trim()}
                  className="w-full mt-4 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {csvLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  {t('csvImport.validateButton')}
                </button>
              </>
            ) : (
              <>
                {/* Preview results */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                      <span className="text-green-400 text-sm font-medium">✓ {csvPreview.valid} {t('csvImport.valid')}</span>
                    </div>
                    {csvPreview.invalid > 0 && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        <span className="text-red-400 text-sm font-medium">✗ {csvPreview.invalid} {t('csvImport.withErrors')}</span>
                      </div>
                    )}
                    <span className="text-anthracite-400 text-sm">{t('csvImport.outOf')} {csvPreview.total} {t('csvImport.rowsTotal')}</span>
                  </div>

                  {/* Valid rows preview */}
                  {csvPreview.validRows?.length > 0 && (
                    <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-3 max-h-40 overflow-y-auto">
                      <p className="text-xs text-anthracite-400 mb-2 font-medium">{t('csvImport.validProducts')}:</p>
                      {csvPreview.validRows.slice(0, 10).map((r: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-1 border-b border-anthracite-700/50 last:border-0">
                          <span className="text-sm text-white">{r.data.name}</span>
                          <span className="text-sm text-gold-400">€{r.data.price_eur.toLocaleString()}</span>
                        </div>
                      ))}
                      {csvPreview.validRows.length > 10 && (
                        <p className="text-xs text-anthracite-500 mt-1">...{t('csvImport.andMore')} {csvPreview.validRows.length - 10} {t('csvImport.moreProducts')}</p>
                      )}
                    </div>
                  )}

                  {/* Error rows */}
                  {csvPreview.invalidRows?.length > 0 && (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 max-h-40 overflow-y-auto">
                      <p className="text-xs text-red-400 mb-2 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {t('csvImport.errorRows')}:
                      </p>
                      {csvPreview.invalidRows.map((r: any, i: number) => (
                        <div key={i} className="py-1 border-b border-red-500/10 last:border-0">
                          <span className="text-xs text-anthracite-400">{t('csvImport.row')} {r.rowIndex}:</span>
                          {r.errors.map((err: string, j: number) => (
                            <p key={j} className="text-xs text-red-300 ml-2">• {err}</p>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setCsvPreview(null); }}
                    className="flex-1 py-3 rounded-xl border border-anthracite-700 text-anthracite-300 hover:text-white text-sm font-medium transition-colors"
                  >
                    ← {t('csvImport.back')}
                  </button>
                  <button
                    onClick={async () => {
                      setCsvImporting(true);
                      try {
                        const res = await fetch('/api/supplier/products/import', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ csvContent, confirm: true }),
                        });
                        const data = await res.json();
                        if (!res.ok) { showToast(data.error || t('csvImport.importError'), 'error'); return; }
                        showToast(data.message, 'success');
                        setShowCsvImport(false);
                        setCsvPreview(null);
                        setCsvContent('');
                        fetchProducts();
                      } catch { showToast(t('csvImport.importError'), 'error'); }
                      finally { setCsvImporting(false); }
                    }}
                    disabled={csvImporting || csvPreview.valid === 0}
                    className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {csvImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {t('csvImport.importButton')} {csvPreview.valid} {t('csvImport.products')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function ProductCard({
  product,
  actionLoading,
  onToggleStatus,
  onEdit,
  onDelete,
  onVariants,
  t,
  locale,
  categoryLabels,
}: {
  product: Product;
  actionLoading: string | null;
  onToggleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onVariants: () => void;
  t: (key: string) => string;
  locale: string;
  categoryLabels: Record<string, string>;
}) {
  const dateLocale = locale === 'en' ? 'en-GB' : 'ro-RO';

  return (
    <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 cursor-pointer hover:border-anthracite-600 transition-colors" onClick={onEdit}>
      {/* Image */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-anthracite-700 flex-shrink-0 overflow-hidden flex items-center justify-center">
        {product.images && product.images.length > 0 ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Dumbbell className="w-6 h-6 text-anthracite-500" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-medium text-sm truncate">{product.name}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
          <span className="text-xs text-anthracite-400">{categoryLabels[product.category] || product.category}</span>
          <span className="text-xs text-anthracite-600 hidden sm:inline">&bull;</span>
          <span className="text-xs text-anthracite-400">{product.condition === 'new' ? t('conditionNew') : t('conditionUsed')}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
          <span className="text-xs text-gold-400 font-medium">&euro;{Number(product.price_eur).toLocaleString()}</span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
            product.status === 'active' || product.status === 'featured'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-anthracite-700 text-anthracite-400'
          }`}>
            {product.status === 'active' || product.status === 'featured' ? t('statusAvailable') : t('statusUnavailable')}
          </span>
          <span className="text-[10px] text-anthracite-500">
            {t('added')}: {new Date(product.created_at).toLocaleDateString(dateLocale)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 w-full sm:w-auto justify-end mt-2 sm:mt-0 border-t border-anthracite-700 sm:border-0 pt-2 sm:pt-0" onClick={(e) => e.stopPropagation()}>
        <button onClick={onVariants} className="p-2 rounded-lg text-anthracite-400 hover:text-purple-400 hover:bg-purple-400/10 transition-colors" title={t('tooltipVariants')}>
          <Layers className="w-4 h-4" />
        </button>
        <button onClick={onEdit} disabled={actionLoading === product.id} className="p-2 rounded-lg text-anthracite-400 hover:text-gold-400 hover:bg-gold-400/10 transition-colors" title={t('tooltipEdit')}>
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleStatus}
          disabled={actionLoading === product.id}
          className={`p-2 rounded-lg transition-colors ${
            product.status === 'active' || product.status === 'featured'
              ? 'text-emerald-400 hover:bg-emerald-500/10'
              : 'text-anthracite-400 hover:bg-anthracite-700'
          }`}
          title={product.status === 'active' || product.status === 'featured' ? t('tooltipMarkUnavailable') : t('tooltipMarkAvailable')}
        >
          {actionLoading === product.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : product.status === 'active' || product.status === 'featured' ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </button>
        <button onClick={onDelete} disabled={actionLoading === product.id} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title={t('tooltipDelete')}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
