'use client';
import ReportContentLink from '@/components/ReportContentLink';
import Modal from '@/components/Modal';
import SupplierContactLinks from '@/components/SupplierContactLinks';
import BuyingGuide from '@/components/BuyingGuide';
import SupplierSourceDetails, { type SupplierSourceInfo } from '@/components/SupplierSourceDetails';
import { formatCatalogPrice, type PublishedPrice } from '@/lib/catalog-price';
import { supplierWebsite } from '@/lib/supplier-contact';

import { createContactSender } from '@/lib/contact-sender';
import { useUiText } from '@/i18n/useUiText';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Package, Send, X, Loader2, Tag, Wrench, Star, ChevronLeft, ChevronRight, ShoppingCart, Check, Layers, RotateCw, Image as ImageIcon } from 'lucide-react';
import { useCartStore, CartProduct } from '@/store/cart';
import Viewer360 from '@/components/Viewer360';
import ProductPhoto from '@/components/ProductPhoto';
import { useClientLocale } from '@/i18n/client';

interface SupplierInfo extends SupplierSourceInfo {
  id: string;
  company_name: string;
  country: string;
  city: string;
  logo_url: string | null;
  website: string | null;
  phone: string | null;
  contact_email: string | null;
}

interface Product extends PublishedPrice {
  id: string;
  name: string;
  description: string | null;
  category: string;
  condition: string;
  price_eur: number | null;
  images: string[];
  images_360?: string[];
  specs: Record<string, string> | null;
  source_url: string | null;
  brand_name: string | null;
  brand_country: string | null;
  brand_id: string | null;
  created_at: string;
  supplier: SupplierInfo;
}

interface SimilarProduct extends PublishedPrice {
  id: string;
  name: string;
  price_eur: number | null;
  images: string[];
  condition: string;
  category: string;
  supplier: { company_name: string };
}

interface Review {
  id: string;
  rating: number;
  client_name: string;
  title: string | null;
  body: string | null;
  created_at: string;
}

interface Variant {
  id: string;
  label: string;
  price_override: number | null;
  description_override: string | null;
  image_url: string | null;
}

export default function ProductDetailPage() {
  const ui = useUiText();
  const [sendContact] = useState(() => createContactSender('/api/contact/supplier'));
  const params = useParams();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<SimilarProduct[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const locale = useClientLocale();
  const [viewMode, setViewMode] = useState<'gallery' | '360'>('gallery');
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  useEffect(() => {
    if (!productId) return;
    const controller = new AbortController();
    setError('');
    setProduct(null); setVariants([]); setReviews([]); setSelectedVariant(null); setSelectedImage(0);
    function trackView(pid: string) {
      // Generate or retrieve a session ID from sessionStorage
      let sessionId = '';
      try {
        sessionId = sessionStorage.getItem('gb_session_id') || '';
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem('gb_session_id', sessionId);
        }
      } catch {
        sessionId = Math.random().toString(36).slice(2);
      }
      // Fire-and-forget view tracking
      fetch('/api/products/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: pid, session_id: sessionId }),
      }).catch(() => {});
    }

    async function fetchVariants() {
      try {
        const res = await fetch(`/api/supplier/products/variants?product_id=${productId}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (controller.signal.aborted) return;
          setVariants(data.variants || []);
        }
      } catch {}
    }

    async function fetchProduct() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${productId}`, { signal: controller.signal });
        if (res.ok) {
          const json = await res.json();
          if (controller.signal.aborted) return;
          setProduct(json.product);
          setSimilar(json.similar || []);
          // Fetch reviews for this supplier
          if (json.product?.supplier?.id) {
            fetchReviews(json.product.supplier.id);
          }
        } else if (res.status === 404) {
          if (!controller.signal.aborted) setError('Produsul nu a fost găsit.');
        } else {
          if (!controller.signal.aborted) setError('Eroare la încărcarea produsului.');
        }
      } catch {
        if (!controller.signal.aborted) setError('Eroare de conexiune.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    async function fetchReviews(supplierId: string) {
      try {
        const res = await fetch(`/api/reviews?supplier_id=${supplierId}&status=approved&limit=3`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (controller.signal.aborted) return;
          setReviews(data.reviews || []);
          if (data.stats) {
            setAvgRating(data.stats.avgRating || 0);
            setReviewCount(data.stats.count || 0);
          }
        }
      } catch {}
    }
    fetchProduct();
    fetchVariants();
    trackView(productId);
    return () => controller.abort();
  }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message || !product) return;
    setFormLoading(true); setFormError('');
    try {
      const res = await sendContact({
          ...form,
          supplierId: product.supplier.id,
          productId: product.id,
          message: `[Produs: ${product.name}${selectedVariant ? `, variantă: ${selectedVariant.label}, preț: ${selectedVariant.price_override ?? product.price_eur} EUR` : ''}]\n\n${form.message}`,
        });
      if (res.ok) {
        setFormSuccess(true);
        setForm({ name: '', email: '', phone: '', message: '' });
      } else { const result = await res.json(); throw new Error(result.error || 'Cererea nu a putut fi trimisă.'); }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Eroare de conexiune.');
    } finally {
      setFormLoading(false);
    }
  }

  const categoryLabels: Record<string, string> = {
    cardio: 'Cardio',
    strength: 'Forță',
    functional: 'Funcțional',
    accessories: 'Accesorii',
    wellness: 'Wellness',
    locker_room: 'Vestiare',
    reception: 'Recepție',
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-anthracite-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-anthracite-950 flex flex-col items-center justify-center px-4">
        <Package className="w-16 h-16 text-anthracite-600 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">{error || ui('Produs negăsit')}</h1>
        <Link href="/products" className="text-gold-400 hover:underline text-sm mt-4">
          {ui("← Înapoi la produse")}</Link>
      </main>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];
  const has360 = product.images_360 && product.images_360.length >= 12;
  const supplier = product.supplier;

  const productSource = supplierWebsite(product.source_url);
  return (
    <main className="min-h-screen bg-anthracite-950" data-supplier-id={supplier.id} data-supplier-name={supplier.company_name}>
      {/* Offer Modal */}
      {showModal && (
        <Modal label={ui("Cerere Ofertă")} onClose={() => { setShowModal(false); setFormSuccess(false); }}>
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-2xl p-6 max-w-lg w-full relative">
            <button aria-label={ui("Închide")} onClick={() => { setShowModal(false); setFormSuccess(false); }} className="absolute top-4 right-4 text-anthracite-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            {formSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{ui("Cerere trimisă!")}</h3>
                <p className="text-sm text-anthracite-300">{ui("Furnizorul va fi notificat și te va contacta în cel mai scurt timp.")}</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-white mb-1">{ui("Solicită Ofertă")}</h3>
                <p className="text-sm text-anthracite-400 mb-5">
                  {ui("Pentru ")}<span className="text-gold-400">{product.name}</span> {ui("de la ")}{supplier.company_name}
                </p>

                {formError && <p role="alert" className="text-red-400 mb-3">{ui(formError)}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="field-productsid-8237" className="text-xs font-medium text-anthracite-300 mb-1 block">{ui("Nume complet *")}</label>
                    <input id="field-productsid-8237"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400/50"
                      placeholder={ui("Ion Popescu")}
                    />
                  </div>
                  <div>
                    <label htmlFor="field-productsid-8859" className="text-xs font-medium text-anthracite-300 mb-1 block">Email *</label>
                    <input id="field-productsid-8859"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400/50"
                      placeholder="email@exemplu.ro"
                    />
                  </div>
                  <div>
                    <label htmlFor="field-productsid-9482" className="text-xs font-medium text-anthracite-300 mb-1 block">{ui("Telefon")}</label>
                    <input id="field-productsid-9482"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400/50"
                      placeholder="+40 7XX XXX XXX"
                    />
                  </div>
                  <div>
                    <label htmlFor="field-productsid-10071" className="text-xs font-medium text-anthracite-300 mb-1 block">{ui("Mesaj *")}</label>
                    <textarea id="field-productsid-10071"
                      required
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400/50 resize-none h-28"
                      placeholder={ui("Sunt interesat de acest produs. Doresc o ofertă pentru...")}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full bg-gold-400 text-anthracite-950 font-bold py-3 rounded-lg hover:bg-gold-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {ui("Trimite Cererea")}</button>
                </form>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Breadcrumb */}
      <div className="border-b border-anthracite-800">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link href="/products" className="inline-flex items-center gap-2 text-sm text-anthracite-400 hover:text-gold-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {ui("Înapoi la produse")}</Link>
          <a href="#contact-furnizor" className="btn-primary inline-flex min-h-11 items-center gap-2 text-sm">{locale === 'en' ? 'Contact supplier' : 'Contactează furnizorul'}<ArrowRight aria-hidden="true" className="h-4 w-4" /></a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left - Image Gallery / 360° Viewer */}
          <div>
            {/* View mode toggle (only if 360° is available) */}
            {has360 && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setViewMode('gallery')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    viewMode === 'gallery'
                      ? 'bg-gold-400/10 border-gold-400/50 text-gold-400'
                      : 'bg-anthracite-800 border-anthracite-700 text-anthracite-300 hover:border-anthracite-500'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  {ui(locale === 'en' ? 'Gallery' : 'Galerie')}
                </button>
                <button
                  onClick={() => setViewMode('360')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    viewMode === '360'
                      ? 'bg-gold-400/10 border-gold-400/50 text-gold-400'
                      : 'bg-anthracite-800 border-anthracite-700 text-anthracite-300 hover:border-anthracite-500'
                  }`}
                >
                  <RotateCw className="w-4 h-4" />
                  360°
                </button>
              </div>
            )}

            {/* 360° Viewer */}
            {viewMode === '360' && has360 && product.images_360 ? (
              <Viewer360 images={product.images_360} productName={product.name} locale={locale} />
            ) : (
              <>
                {/* Main Image */}
                <div className="aspect-square bg-anthracite-800 border border-anthracite-700 rounded-2xl overflow-hidden relative mb-4">
                  {images.length > 0 ? (
                    <>
                      <ProductPhoto key={product.id} productId={product.id} productName={product.name} images={images} images360={product.images_360 || []} imageIndex={selectedImage} className="h-full" />
                      {images.length > 1 && (
                        <>
                          <button aria-label={ui("Imaginea precedentă")}
                            onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : images.length - 1)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-anthracite-900/80 rounded-full flex items-center justify-center text-white hover:bg-anthracite-800 transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button aria-label={ui("Imaginea următoare")}
                            onClick={() => setSelectedImage(prev => prev < images.length - 1 ? prev + 1 : 0)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-anthracite-900/80 rounded-full flex items-center justify-center text-white hover:bg-anthracite-800 transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-20 h-20 text-anthracite-600" />
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, i) => (
                      <button aria-label={`${ui("Vezi imaginea")} ${i + 1}`} aria-pressed={selectedImage === i}
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedImage === i ? 'border-gold-400' : 'border-anthracite-700 hover:border-anthracite-500'
                        }`}
                      >
                        <img src={img} alt={ui(`${product.name} ${i + 1}`)} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right - Product Info */}
          <div>
            {/* Category & Condition */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-medium text-anthracite-400 uppercase tracking-wider">
                {ui(categoryLabels[product.category] || product.category)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                product.condition === 'new' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                {ui(product.condition === 'new' ? 'Nou' : 'Second-hand')}
              </span>
            </div>

            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{product.name}</h1>

            {/* Brand */}
            {product.brand_name && (
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-anthracite-500" />
                <span className="text-sm text-anthracite-300">Brand: <span className="text-white font-medium">{product.brand_name}</span></span>
              </div>
            )}

            {/* Variant Selector */}
            {variants.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  {ui("Variante disponibile")}</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedVariant(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      !selectedVariant
                        ? 'bg-gold-400/10 border-gold-400/50 text-gold-400'
                        : 'bg-anthracite-800 border-anthracite-700 text-anthracite-300 hover:border-anthracite-500'
                    }`}
                  >
                    Standard
                  </button>
                  {variants.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        selectedVariant?.id === v.id
                          ? 'bg-purple-500/10 border-purple-400/50 text-purple-400'
                          : 'bg-anthracite-800 border-anthracite-700 text-anthracite-300 hover:border-anthracite-500'
                      }`}
                    >
                      {v.label}
                      {v.price_override && (
                        <span className="ml-1.5 text-xs text-gold-400">€{Number(v.price_override).toLocaleString()}</span>
                      )}
                    </button>
                  ))}
                </div>
                {selectedVariant?.description_override && (
                  <p className="mt-3 text-sm text-anthracite-300 bg-anthracite-800 border border-anthracite-700 rounded-lg p-3">
                    {selectedVariant.description_override}
                  </p>
                )}
              </div>
            )}

            {/* Price */}
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-5 mb-6">
              <span className="text-3xl font-bold text-gold-400">
                {formatCatalogPrice(selectedVariant?.price_override ?? product.price_eur, locale, selectedVariant?.price_override != null ? undefined : product)}
              </span>
              <span className="text-sm text-anthracite-400 ml-2">{ui(product.price_eur === null && product.listed_price_amount == null ? "Confirmă prețul și disponibilitatea cu furnizorul." : "Preț publicat de furnizor")}</span>
              {selectedVariant?.price_override != null && selectedVariant.price_override !== product.price_eur && (
                <span className="ml-3 text-sm text-anthracite-500 line-through">
                  {formatCatalogPrice(product.price_eur, locale, product)}
                </span>
              )}
            </div>

            <section id="contact-furnizor" aria-label={ui('Contact direct')} className="scroll-mt-[calc(var(--app-header-height)+1rem)] mb-6 space-y-3 rounded-xl border border-gold-400/30 bg-anthracite-900 p-5">
              <h2 className="font-bold text-white">{ui('Contactează direct furnizorul')}</h2>
              <p className="text-lg font-semibold text-white">{supplier.company_name}</p>
              <p className="text-sm text-anthracite-300">{locale === 'en' ? 'No account needed for phone, email or the supplier website.' : 'Telefonul, emailul și site-ul furnizorului sunt accesibile fără cont.'}</p>
              <SupplierContactLinks supplierId={supplier.id} phone={supplier.phone} website={supplier.website} email={supplier.contact_email} />
              <p className="text-sm text-anthracite-300">{ui('Țara furnizorului')}: {supplier.country}</p>
              {product.brand_name && <p className="text-sm text-anthracite-300">{ui('Marcă')}: {product.brand_name}{product.brand_country ? ` · ${product.brand_country}` : ''}</p>}
              <p className="text-sm text-anthracite-400">{ui('Țara mărcii nu confirmă țara de fabricație. Solicită furnizorului detaliile de origine și condițiile de achiziție.')}</p>

              <SupplierSourceDetails supplier={supplier} />
            </section>

            {/* CTA Buttons */}
            {!supplier.listing_source_url && <button
              onClick={() => setShowModal(true)}
              className="w-full bg-gold-400 text-anthracite-950 font-bold py-4 rounded-xl hover:bg-gold-300 transition-colors flex items-center justify-center gap-2 text-lg mb-3"
            >
              <Send className="w-5 h-5" />
              {ui("Solicită Ofertă")}</button>}
            {!supplier.listing_source_url && <AddToCartButton product={product} supplier={supplier} variant={selectedVariant} />}

            {productSource && <a href={productSource} target="_blank" rel="noopener noreferrer" className="mb-6 inline-flex min-h-11 items-center text-sm text-gold-400 hover:underline">{ui('Fotografii și specificații: sursa oficială a produsului')}</a>}

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-white mb-2">{ui("Descriere")}</h3>
                <p className="text-sm text-anthracite-300 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {/* Specs */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-gold-400" />
                  {ui("Specificații Tehnice")}</h3>
                <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl overflow-hidden">
                  {Object.entries(product.specs).map(([key, value], i) => (
                    <div key={key} className={`flex items-center justify-between px-4 py-3 text-sm ${i > 0 ? 'border-t border-anthracite-700' : ''}`}>
                      <span className="text-anthracite-400">{key}</span>
                      <span className="text-white font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              {ui("Recenzii Furnizor")}</h2>
            {reviewCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-anthracite-600'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-white font-semibold">{ui(avgRating.toFixed(1))}</span>
                <span className="text-xs text-anthracite-500">({reviewCount} {ui(reviewCount === 1 ? 'recenzie' : 'recenzii')})</span>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-8 text-center">
              <Star className="w-8 h-8 text-anthracite-600 mx-auto mb-3" />
              <p className="text-anthracite-400">{ui("Nu există încă recenzii pentru acest furnizor.")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-anthracite-700 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-anthracite-300">
                          {ui((review.client_name || 'A')[0].toUpperCase())}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-white">{review.client_name || 'Anonim'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-anthracite-600'}`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.title && (
                    <p className="text-sm font-semibold text-white mb-1">{review.title}</p>
                  )}
                  {review.body && (
                    <p className="text-sm text-anthracite-300 leading-relaxed">{review.body}</p>
                  )}
                  <p className="text-xs text-anthracite-500 mt-2">
                    {ui(new Date(review.created_at).toLocaleDateString(ui('ro-RO'), { year: 'numeric', month: 'long', day: 'numeric' }))}
                  </p>
                </div>
              ))}
              {reviewCount > 3 && product?.supplier && (
                <Link
                  href={`/suppliers/${product.supplier.id}`}
                  className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  {ui("Vezi toate cele ")}{reviewCount} {ui("recenzii →")}</Link>
              )}
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-12"><BuyingGuide /></div>

      {/* Similar Products */}
        {similar.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-white mb-6">{ui("Produse Similare")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {similar.map((item) => (
                <Link
                  key={item.id}
                  href={`/products/${item.id}`}
                  className="bg-anthracite-800 border border-anthracite-700 rounded-xl overflow-hidden hover:border-anthracite-600 transition-colors group"
                >
                  <div className="aspect-[4/3] bg-anthracite-700 relative overflow-hidden">
                    {item.images && item.images.length > 0 ? (
                      <img src={item.images[0]} alt={item.name} className="w-full h-full object-contain" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-anthracite-500" />
                      </div>
                    )}
                    <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                      item.condition === 'new' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {ui(item.condition === 'new' ? 'Nou' : 'SH')}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-anthracite-400">{item.supplier?.company_name}</p>
                    <h3 className="text-sm font-semibold text-white mt-1 line-clamp-2">{item.name}</h3>
                    <span className="text-lg font-bold text-gold-400 mt-2 block">{formatCatalogPrice(item.price_eur, locale, item)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <ReportContentLink kind="products" id={product.id} />
    </main>
  );
}

function AddToCartButton({ product, supplier, variant }: { product: Product; supplier: SupplierInfo; variant: Variant | null }) {
  const ui = useUiText();
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const [added, setAdded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const cartId = variant ? `${product.id}:${variant.id}` : product.id;
  const isInCart = mounted && items.some((i) => i.product.id === cartId);
  useEffect(() => { setAdded(false); }, [cartId]);

  const handleAdd = () => {
    const price = variant?.price_override ?? product.price_eur;
    const cartProduct: CartProduct = {
      id: cartId,
      product_id: product.id,
      variant_id: variant?.id,
      variant_label: variant?.label,
      name: variant ? `${product.name} — ${variant.label}` : product.name,
      price_eur: price,
      ...(variant?.price_override == null ? { listed_price_amount: product.listed_price_amount, listed_price_currency: product.listed_price_currency } : {}),
      images: product.images || [],
      category: product.category,
      condition: product.condition,
      supplier_id: supplier.id,
      supplier_name: supplier.company_name,
    };
    addItem(cartProduct);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (isInCart || added) {
    return (
      <Link href="/cos-cerere" className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm mb-6">
        <Check className="w-4 h-4" />
        {ui("Vezi cererea mea")}</Link>
    );
  }

  return (
    <button
      onClick={handleAdd}
      className="w-full bg-anthracite-700 border border-anthracite-600 text-white font-semibold py-3 rounded-xl hover:bg-anthracite-600 hover:border-anthracite-500 transition-colors flex items-center justify-center gap-2 text-sm mb-6"
    >
      <ShoppingCart className="w-4 h-4" />
      {ui("Adaugă la Cerere")}</button>
  );
}
