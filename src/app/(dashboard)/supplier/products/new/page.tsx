'use client';

import { useUiText } from '@/i18n/useUiText';

import Link from 'next/link';
import { consumeFileSelection } from '@/lib/file-selection';
import { createProductImageUploader } from '@/lib/product-image-upload';
import { getPlanImageLimit } from '@/lib/plans';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, X, Loader2, CheckCircle, AlertCircle, ImagePlus, RotateCw } from 'lucide-react';
import { useClientTranslations } from '@/i18n/client';

const brands = [
  'Life Fitness', 'Technogym', 'Matrix', 'Precor', 'Hammer Strength',
  'Cybex', 'Star Trac', 'Nautilus', 'Body-Solid', 'Rogue Fitness',
  'Eleiko', 'Assault Fitness', 'Concept2', 'Peloton', 'NordicTrack', 'Hoist',
  'Altul',
];

export default function NewProductPage() {
  const ui = useUiText();
  const router = useRouter();
  const { t } = useClientTranslations('newProduct');
  const [uploadImage] = useState(() => createProductImageUploader());
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [images360Files, setImages360Files] = useState<File[]>([]);
  const [images360Previews, setImages360Previews] = useState<string[]>([]);
  const previewUrls = useRef(new Set<string>());
  useEffect(() => { const urls = previewUrls.current; return () => { urls.forEach(url => URL.revokeObjectURL(url)); urls.clear(); }; }, []);
  const makePreview = (file: File) => { const url = URL.createObjectURL(file); previewUrls.current.add(url); return url; };
  const [supplierPlan, setSupplierPlan] = useState<string>('free');
  const [publicationAccess, setPublicationAccess] = useState<'loading' | 'approved' | 'blocked' | 'error'>('loading');
  const [accessAttempt, setAccessAttempt] = useState(0);

  const [form, setForm] = useState({
    name: '',
    category: '',
    brand: '',
    condition: 'new' as 'new' | 'used',
    price: '',
    description: '',
  });

  useEffect(() => {
    const controller = new AbortController();
    setPublicationAccess('loading');
    fetch('/api/supplier/products', { signal: controller.signal, cache: 'no-store' }).then(async res => {
      const data = await res.json();
      if (!res.ok || !data.supplierStatus) throw new Error('Supplier access unavailable');
      if (controller.signal.aborted) return;
      setSupplierPlan(data.plan || 'free');
      setPublicationAccess(data.supplierStatus === 'approved' ? 'approved' : 'blocked');
    }).catch(() => { if (!controller.signal.aborted) setPublicationAccess('error'); });
    return () => controller.abort();
  }, [accessAttempt]);

  const maxImages = getPlanImageLimit(supplierPlan);
  const has360Access = ['professional', 'enterprise'].includes(supplierPlan);

  const handleImage360Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = consumeFileSelection(e.currentTarget);
    if (!files.length) return;
    const remaining = 36 - images360Files.length;
    if (files.length > remaining) { setError(t('gallery360Max')); return; }
    const newFiles = Array.from(files).slice(0, remaining);
    for (const file of newFiles) {
      if (file.size > 5 * 1024 * 1024) {
        setError(t('fileSizeError').replace('{name}', file.name));
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError(t('fileFormatError').replace('{name}', file.name));
        return;
      }
    }
    setError('');
    setImages360Files(prev => [...prev, ...newFiles]);
    setImages360Previews(previous => [...previous, ...newFiles.map(makePreview)]);
  };

  const removeImage360 = (index: number) => {
    URL.revokeObjectURL(images360Previews[index]); previewUrls.current.delete(images360Previews[index]);
    setImages360Files(prev => prev.filter((_, i) => i !== index));
    setImages360Previews(prev => prev.filter((_, i) => i !== index));
  };

  const categories = [
    { value: 'cardio', label: t('categories.cardio') },
    { value: 'strength', label: t('categories.strength') },
    { value: 'functional', label: t('categories.functional') },
    { value: 'accessories', label: t('categories.accessories') },
    { value: 'wellness', label: t('categories.wellness') },
    { value: 'lockers', label: t('categories.lockers') },
    { value: 'reception', label: t('categories.reception') },
  ];

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = consumeFileSelection(e.currentTarget);
    if (!files.length) return;

    const remaining = maxImages - imageFiles.length;
    if (files.length > remaining) { setError(t('imageLimitError', { count: maxImages })); return; }
    const newFiles = Array.from(files).slice(0, remaining);

    for (const file of newFiles) {
      if (file.size > 5 * 1024 * 1024) {
        setError(t('fileSizeError').replace('{name}', file.name));
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        setError(t('fileFormatError').replace('{name}', file.name));
        return;
      }
    }

    setError('');
    setImageFiles(prev => [...prev, ...newFiles]);

    setImagePreviews(previous => [...previous, ...newFiles.map(makePreview)]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]); previewUrls.current.delete(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name || !form.category || !form.brand || !form.price) {
      setError(t('requiredFieldsError'));
      return;
    }

    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) {
      setError(t('priceError'));
      return;
    }

    if (images360Files.length > 0 && images360Files.length < 12) { setError(t('gallery360Min')); return; }
    setLoading(true);

    try {
      const uploadedUrls: string[] = [];
      
      if (imageFiles.length > 0) {
        setUploadingImages(true);
        for (const file of imageFiles) uploadedUrls.push(await uploadImage(file, 'products'));
        setUploadingImages(false);
      }

      // Upload 360° images if available
      const uploaded360Urls: string[] = [];
      if (images360Files.length >= 12 && has360Access) {
        for (const file of images360Files) uploaded360Urls.push(await uploadImage(file, 'products-360'));
      }

      const res = await fetch('/api/supplier/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          brand: form.brand,
          condition: form.condition,
          price_eur: price,
          description: form.description || null,
          images: uploadedUrls,
          ...(uploaded360Urls.length >= 12 ? { images_360: uploaded360Urls } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('saveError'));
        return;
      }

      setSuccess(t('successMessage'));

      setTimeout(() => {
        router.push('/supplier/products');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('connectionError'));
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  if (publicationAccess !== 'approved') return (
    <main className="min-h-screen bg-anthracite-950 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        <p role={publicationAccess === 'error' ? 'alert' : 'status'} className="text-anthracite-200">
          {t(publicationAccess === 'loading' ? 'approvalLoading' : publicationAccess === 'error' ? 'approvalUnavailable' : 'approvalRequired')}
        </p>
        {publicationAccess !== 'loading' && <button className="btn-primary" onClick={() => setAccessAttempt(attempt => attempt + 1)}>{t('approvalRetry')}</button>}
        <Link href="/supplier/dashboard" className="btn-ghost inline-flex">{t('backToDashboard')}</Link>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-anthracite-950 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/supplier/products"
            className="p-2 rounded-lg hover:bg-anthracite-800 text-anthracite-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
            <p className="text-anthracite-400 text-sm mt-1">{t('subtitle')}</p>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-400">{ui(success)}</p>
          </div>
        )}
        {error && (
          <div ref={errorRef} role="alert" tabIndex={-1} className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{ui(error)}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Info */}
          <div className="glass-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t('productInfo')}</h2>

            <div className="space-y-5">
              <div>
                <label htmlFor="product-name" className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('productName')}</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder={ui(t('productNamePlaceholder'))}
                  id="product-name" required
                    value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="product-category" className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('category')}</label>
                  <select
                    className="input-field"
                    id="product-category" required
                    value={form.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    disabled={loading}
                  >
                    <option value="">{t('selectCategory')}</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{ui(cat.label)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="product-brand" className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('brand')}</label>
                  <select
                    className="input-field"
                    id="product-brand" required
                    value={form.brand}
                    onChange={(e) => updateField('brand', e.target.value)}
                    disabled={loading}
                  >
                    <option value="">{t('selectBrand')}</option>
                    {brands.map((brand) => (
                      <option key={brand} value={brand}>{ui(brand)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('condition')}</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => updateField('condition', 'new')}
                      disabled={loading}
                      className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                        form.condition === 'new'
                          ? 'border-gold-400 bg-gold-400/10 text-gold-400'
                          : 'border-anthracite-700 text-anthracite-300 hover:border-anthracite-500'
                      }`}
                    >
                      🆕 {t('conditionNew')}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('condition', 'used')}
                      disabled={loading}
                      className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                        form.condition === 'used'
                          ? 'border-gold-400 bg-gold-400/10 text-gold-400'
                          : 'border-anthracite-700 text-anthracite-300 hover:border-anthracite-500'
                      }`}
                    >
                      ♻️ {t('conditionUsed')}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="product-price" className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('price')}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-anthracite-400 text-sm font-medium">€</span>
                    <input
                      type="number"
                      className="input-field pl-8"
                      placeholder="0.00"
                      min="0.01" inputMode="decimal"
                      step="0.01"
                      id="product-price" required
                    value={form.price}
                      onChange={(e) => updateField('price', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="product-description" className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('description')}</label>
                <textarea
                  className="input-field min-h-[120px] resize-y"
                  placeholder={ui(t('descriptionPlaceholder'))}
                  id="product-description"
                    value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="glass-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t('imagesTitle')}</h2>
            <p className="text-sm text-anthracite-400 mb-4">{Number.isFinite(maxImages) ? t('imagesHint', { count: maxImages }) : t('imagesUnlimitedHint')}</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {imagePreviews.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-anthracite-700">
                  <img src={img} alt={ui(`${t('productImageAlt')} ${index + 1}`)} className="w-full h-full object-cover" />
                  <button aria-label={ui("Elimină imaginea")}
                    type="button"
                    onClick={() => removeImage(index)}
                    disabled={loading}
                    className="absolute top-1 right-1 min-w-11 min-h-11 flex items-center justify-center bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 text-xs bg-gold-400 text-anthracite-950 px-2 py-0.5 rounded font-medium">
                      {t('primaryImage')}
                    </span>
                  )}
                </div>
              ))}

              {imagePreviews.length < maxImages && (
                <label className="relative aspect-square rounded-xl border-2 border-dashed border-anthracite-600 hover:border-gold-400/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <ImagePlus className="w-8 h-8 text-anthracite-500 mb-2" />
                  <span className="text-xs text-anthracite-400">{t('addImage')}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    aria-label={t('addImage')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer focus:opacity-10"
                    onChange={handleImageChange}
                    disabled={loading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* 360° Gallery */}
          {has360Access && (
            <div className="glass-card p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <RotateCw className="w-5 h-5 text-gold-400" />
                <h2 className="text-lg font-semibold text-white">{t('gallery360Title')}</h2>
              </div>
              <p className="text-sm text-anthracite-400 mb-4">{t('gallery360Hint')}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {images360Previews.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-anthracite-700">
                    <img src={img} alt={ui(`360° #${index + 1}`)} className="w-full h-full object-cover" />
                    <button aria-label={ui("Elimină imaginea")}
                      type="button"
                      onClick={() => removeImage360(index)}
                      disabled={loading}
                      className="absolute top-1 right-1 min-w-11 min-h-11 flex items-center justify-center bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                    <span className="absolute bottom-0.5 left-0.5 text-[10px] bg-anthracite-900/80 text-anthracite-300 px-1 rounded">
                      {index + 1}
                    </span>
                  </div>
                ))}

                {images360Previews.length < 36 && (
                  <label className="relative aspect-square rounded-lg border-2 border-dashed border-anthracite-600 hover:border-gold-400/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <RotateCw className="w-5 h-5 text-anthracite-500 mb-1" />
                    <span className="text-[10px] text-anthracite-400 text-center px-1">{t('gallery360Add')}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      aria-label={t('gallery360Add')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer focus:opacity-10"
                      onChange={handleImage360Change}
                      disabled={loading}
                    />
                  </label>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className={`text-xs ${images360Previews.length >= 12 ? 'text-emerald-400' : 'text-anthracite-400'}`}>
                  {images360Previews.length}/36 {t('gallery360Count')}
                </span>
                {images360Previews.length > 0 && images360Previews.length < 12 && (
                  <span className="text-xs text-amber-400">{t('gallery360Min')}</span>
                )}
              </div>
            </div>
          )}

          {!has360Access && (
            <div className="glass-card p-6 opacity-60">
              <div className="flex items-center gap-3 mb-2">
                <RotateCw className="w-5 h-5 text-anthracite-500" />
                <h2 className="text-lg font-semibold text-anthracite-400">{t('gallery360Title')}</h2>
              </div>
              <p className="text-sm text-anthracite-500">{t('gallery360Locked')}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-wrap items-center gap-4 pb-20">
            <Link
              href="/supplier/products"
              className="btn-ghost px-6 py-3"
            >
              {t('cancel')}
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-3.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {ui(uploadingImages ? t('uploadingImages') : t('saving'))}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {t('publishProduct')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
