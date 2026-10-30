'use client';
import ReportContentLink from '@/components/ReportContentLink';
import Modal from '@/components/Modal';
import ProductPhoto from '@/components/ProductPhoto';
import { supplierTelephone, supplierWebsite } from '@/lib/supplier-contact';
import BuyingGuide from '@/components/BuyingGuide';
import SupplierContactLinks from '@/components/SupplierContactLinks';
import SupplierSourceDetails, { type SupplierSourceInfo } from '@/components/SupplierSourceDetails';
import { formatCatalogPrice, type PublishedPrice } from '@/lib/catalog-price';
import { useClientLocale } from '@/i18n/client';

import { createContactSender } from '@/lib/contact-sender';
import { useUiText } from '@/i18n/useUiText';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Globe, MapPin, Star, Package, Send, X, Loader2, Building2, Phone, MessageSquare, Camera } from 'lucide-react';

interface SupplierProfile extends SupplierSourceInfo {
  id: string;
  company_name: string;
  country: string;
  city: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  phone: string | null;
  contact_email: string | null;
  plan: string;
  verified: boolean;
  created_at: string;
}

interface Product extends PublishedPrice {
  id: string;
  name: string;
  description: string | null;
  category: string;
  condition: string;
  price_eur: number | null;
  images: string[];
  status: string;
}

interface Review {
  id: string;
  client_name: string;
  rating: number;
  title: string;
  body: string | null;
  created_at: string;
}

interface SupplierData {
  supplier: SupplierProfile;
  products: Product[];
  stats: { totalProducts: number; avgRating: number; reviewCount: number };
}

export default function SupplierProfilePage() {
  const ui = useUiText();
  const locale = useClientLocale();
  const [sendContact] = useState(() => createContactSender('/api/contact/supplier'));
  const params = useParams();
  const supplierId = params?.id as string;

  const [data, setData] = useState<SupplierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  // Gallery state
  const [galleryImages, setGalleryImages] = useState<{id: string; image_url: string; caption: string; created_at: string}[]>([]);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState({ avgRating: 0, count: 0 });
  const [reviewForm, setReviewForm] = useState({ name: '', email: '', rating: 5, title: '', body: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (!supplierId) return;
    const controller = new AbortController();
    setError('');
    setData(null); setGalleryImages([]); setReviews([]);
    async function fetchGallery() {
      try {
        const res = await fetch(`/api/supplier/gallery?supplier_id=${supplierId}`, { signal: controller.signal });
        if (res.ok) {
          const json = await res.json();
          if (controller.signal.aborted) return;
          setGalleryImages(json.images || []);
        }
      } catch {}
    }

    async function fetchReviews() {
      try {
        const res = await fetch(`/api/reviews?supplier_id=${supplierId}`, { signal: controller.signal });
        if (res.ok) {
          const json = await res.json();
          if (controller.signal.aborted) return;
          setReviews(json.reviews || []);
          setReviewStats(json.stats || { avgRating: 0, count: 0 });
        }
      } catch {}
    }

    async function fetchSupplier() {
      setLoading(true);
      try {
        const res = await fetch(`/api/suppliers/${supplierId}`, { signal: controller.signal });
        if (res.ok) {
          const json = await res.json();
          if (controller.signal.aborted) return;
          setData(json);
        } else if (res.status === 404) {
          if (!controller.signal.aborted) setError('Furnizorul nu a fost găsit.');
        } else {
          if (!controller.signal.aborted) setError('Eroare la încărcarea profilului.');
        }
      } catch {
        if (!controller.signal.aborted) setError('Eroare de conexiune.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    fetchSupplier();
    fetchReviews();
    fetchGallery();
    return () => controller.abort();
  }, [supplierId]);

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewForm.name || !reviewForm.email || !reviewForm.title) return;
    setReviewLoading(true);
    setReviewError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier_id: supplierId, client_name: reviewForm.name, client_email: reviewForm.email, rating: reviewForm.rating, title: reviewForm.title, body: reviewForm.body }),
      });
      const json = await res.json();
      if (res.ok) {
        setReviewSuccess(true);
        setReviewForm({ name: '', email: '', rating: 5, title: '', body: '' });
      } else {
        setReviewError(json.error || 'Eroare la trimiterea recenziei.');
      }
    } catch {
      setReviewError('Eroare de conexiune.');
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setFormLoading(true); setFormError('');
    try {
      const res = await sendContact({ ...form, supplierId });
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

  if (loading) {
    return (
      <main className="min-h-screen bg-anthracite-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-anthracite-950 flex flex-col items-center justify-center px-4">
        <Building2 className="w-16 h-16 text-anthracite-600 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">{error || ui('Furnizor negăsit')}</h1>
        <Link href="/suppliers" className="text-gold-400 hover:underline text-sm mt-4">
          {ui("← Înapoi la furnizori")}</Link>
      </main>
    );
  }

  const { supplier, products, stats } = data;
  const websiteHref = supplierWebsite(supplier.website);
  const phoneHref = supplierTelephone(supplier.phone);

  return (
    <main className="min-h-screen bg-anthracite-950" data-supplier-id={supplier.id} data-supplier-name={supplier.company_name}>
      {/* Contact Modal */}
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
                <h3 className="text-lg font-bold text-white mb-1">{ui("Cerere Ofertă")}</h3>
                <p className="text-sm text-anthracite-400 mb-5">{ui("Trimite o cerere către ")}<span className="text-gold-400">{supplier.company_name}</span></p>

                {formError && <p role="alert" className="text-red-400 mb-3">{ui(formError)}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="field-suppliersid-7046" className="text-xs font-medium text-anthracite-300 mb-1 block">{ui("Nume complet *")}</label>
                    <input id="field-suppliersid-7046"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400/50"
                      placeholder={ui("Ion Popescu")}
                    />
                  </div>
                  <div>
                    <label htmlFor="field-suppliersid-7668" className="text-xs font-medium text-anthracite-300 mb-1 block">Email *</label>
                    <input id="field-suppliersid-7668"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400/50"
                      placeholder="email@exemplu.ro"
                    />
                  </div>
                  <div>
                    <label htmlFor="field-suppliersid-8291" className="text-xs font-medium text-anthracite-300 mb-1 block">{ui("Telefon")}</label>
                    <input id="field-suppliersid-8291"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400/50"
                      placeholder="+40 7XX XXX XXX"
                    />
                  </div>
                  <div>
                    <label htmlFor="field-suppliersid-8880" className="text-xs font-medium text-anthracite-300 mb-1 block">{ui("Mesaj *")}</label>
                    <textarea id="field-suppliersid-8880"
                      required
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400/50 resize-none h-28"
                      placeholder={ui("Descrie ce echipamente cauți, cantitate, buget estimat...")}
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

      {/* Header */}
      <div className="border-b border-anthracite-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/suppliers" className="inline-flex items-center gap-2 text-sm text-anthracite-400 hover:text-gold-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {ui("Înapoi la furnizori")}</Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Supplier Header */}
        <div className="bg-anthracite-800 border border-anthracite-700 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Logo */}
            <div className="w-24 h-24 bg-anthracite-700 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              {supplier.logo_url ? (
                <img src={supplier.logo_url} alt={supplier.company_name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-10 h-10 text-anthracite-500" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    {supplier.company_name}
                    {supplier.verified && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-medium">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        {ui("Furnizor Verificat")}</span>
                    )}
                  </h1>
                  <div className="flex items-center gap-4 flex-wrap text-sm text-anthracite-300">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-anthracite-500" />
                      {supplier.city}, {supplier.country}
                    </span>
                    {websiteHref && (
                      <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-gold-400 hover:underline">
                        <Globe className="w-4 h-4" />
                        Website
                      </a>
                    )}
                    {supplier.phone && !phoneHref && <span className="break-words">{ui("Telefon")}: {supplier.phone}</span>}
                    {phoneHref && (
                      <a href={phoneHref} className="flex items-center gap-1.5 hover:text-white">
                        <Phone className="w-4 h-4 text-anthracite-500" />
                        {supplier.phone}
                      </a>
                    )}
                  </div>
                </div>

                {!supplier.listing_source_url && <button
                  onClick={() => setShowModal(true)}
                  className="bg-gold-400 text-anthracite-950 font-bold px-6 py-3 rounded-lg hover:bg-gold-300 transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {ui("Cerere Ofertă")}</button>}
              </div>

              <div className="mt-5 space-y-4"><SupplierContactLinks supplierId={supplier.id} phone={supplier.phone} website={supplier.website} email={supplier.contact_email} /><SupplierSourceDetails supplier={supplier} /></div>

              {supplier.description && (
                <p className="text-anthracite-300 mt-4 leading-relaxed">{supplier.description}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-5 pt-5 border-t border-anthracite-700">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gold-400" />
                  <span className="text-sm text-white font-medium">{stats.totalProducts}</span>
                  <span className="text-sm text-anthracite-400">{ui("produse")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                  <span className="text-sm text-white font-medium">{ui(stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A')}</span>
                  <span className="text-sm text-anthracite-400">({stats.reviewCount} {ui("recenzii)")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    supplier.plan === 'premium' ? 'bg-gold-400/10 text-gold-400 border border-gold-400/30' :
                    supplier.plan === 'professional' ? 'bg-blue-400/10 text-blue-400 border border-blue-400/30' :
                    'bg-anthracite-700 text-anthracite-300 border border-anthracite-600'
                  }`}>
                    {ui(supplier.plan === 'premium' ? '⭐ Premium' : supplier.plan === 'professional' ? 'Pro' : 'Free')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gold-400" />
              {ui("Recenzii (")}{reviewStats.count})
            </h2>
            {reviewStats.count > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(reviewStats.avgRating) ? 'text-gold-400 fill-gold-400' : 'text-anthracite-600'}`} />
                  ))}
                </div>
                <span className="text-sm text-white font-medium">{reviewStats.avgRating}</span>
                <span className="text-sm text-anthracite-400">/ 5</span>
              </div>
            )}
          </div>

          {/* Existing Reviews */}
          {reviews.length > 0 ? (
            <div className="space-y-4 mb-8">
              {reviews.map((review) => (
                <div key={review.id} className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-anthracite-700 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-anthracite-300">{ui(review.client_name.charAt(0).toUpperCase())}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{review.client_name}</p>
                        <p className="text-xs text-anthracite-500">{ui(new Date(review.created_at).toLocaleDateString(ui('ro-RO')))}</p>
                      </div>
                    </div>
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-gold-400 fill-gold-400' : 'text-anthracite-600'}`} />
                      ))}
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{review.title}</h4>
                  {review.body && <p className="text-sm text-anthracite-300 leading-relaxed">{review.body}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-8 text-center mb-8">
              <MessageSquare className="w-10 h-10 text-anthracite-600 mx-auto mb-3" />
              <p className="text-anthracite-400">{ui("Nicio recenzie încă. Fii primul care lasă o recenzie!")}</p>
            </div>
          )}

          {/* Review Form */}
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">{ui("Lasă o recenzie")}</h3>

            {reviewSuccess ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-emerald-400 fill-emerald-400" />
                </div>
                <p className="text-white font-medium mb-1">{ui("Mulțumim pentru recenzie!")}</p>
                <p className="text-sm text-anthracite-400">{ui("Recenzia va fi publicată după verificare de către echipa noastră.")}</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {reviewError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-sm text-red-400">
                    {reviewError}
                  </div>
                )}

                {/* Star Rating */}
                <div>
                  <p className="text-xs font-medium text-anthracite-300 mb-2 block">Rating *</p>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <button
                        key={s}
                        type="button"
                        aria-label={`${s} / 5`}
                        aria-pressed={reviewForm.rating === s}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                        className="p-2"
                      >
                        <Star className={`w-7 h-7 transition-colors ${s <= (hoverRating || reviewForm.rating) ? 'text-gold-400 fill-gold-400' : 'text-anthracite-600 hover:text-anthracite-500'}`} />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-anthracite-400 self-center">{reviewForm.rating}/5</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="field-suppliersid-20351" className="text-xs font-medium text-anthracite-300 mb-1 block">{ui("Nume *")}</label>
                    <input id="field-suppliersid-20351"
                      type="text"
                      required
                      value={reviewForm.name}
                      onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                      className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400/50"
                      placeholder={ui("Numele tău")}
                    />
                  </div>
                  <div>
                    <label htmlFor="field-suppliersid-20982" className="text-xs font-medium text-anthracite-300 mb-1 block">Email *</label>
                    <input id="field-suppliersid-20982"
                      type="email"
                      required
                      value={reviewForm.email}
                      onChange={(e) => setReviewForm({ ...reviewForm, email: e.target.value })}
                      className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400/50"
                      placeholder="email@exemplu.ro"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="field-suppliersid-21643" className="text-xs font-medium text-anthracite-300 mb-1 block">{ui("Titlu recenzie *")}</label>
                  <input id="field-suppliersid-21643"
                    type="text"
                    required
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                    className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400/50"
                    placeholder={ui("Ex: Echipamente de calitate, livrare rapidă")}
                  />
                </div>

                <div>
                  <label htmlFor="field-suppliersid-22298" className="text-xs font-medium text-anthracite-300 mb-1 block">{ui("Detalii (opțional)")}</label>
                  <textarea id="field-suppliersid-22298"
                    value={reviewForm.body}
                    onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
                    className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400/50 resize-none h-24"
                    placeholder={ui("Descrie experiența ta cu acest furnizor...")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="bg-gold-400 text-anthracite-950 font-bold px-6 py-3 rounded-lg hover:bg-gold-300 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {reviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                  {ui("Trimite Recenzia")}</button>
              </form>
            )}
          </div>
        </div>

        {/* Gallery Section */}
        {galleryImages.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Camera className="w-5 h-5 text-gold-400" />
              <h2 className="text-xl font-bold text-white">{ui("Galerie Foto")}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {galleryImages.map((img) => (
                <a href={img.image_url} target="_blank" rel="noopener noreferrer" key={img.id} className="aspect-square rounded-lg overflow-hidden border border-anthracite-700 hover:border-gold-500/50 transition-colors cursor-pointer">
                  <img src={img.image_url} alt={img.caption || ui("Galerie Foto")} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Products Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">{ui("Produse (")}{products.length})</h2>
          </div>

          {products.length === 0 ? (
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-12 text-center">
              <Package className="w-12 h-12 text-anthracite-600 mx-auto mb-3" />
              <p className="text-anthracite-400">{ui("Acest furnizor nu are produse listate momentan.")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-anthracite-800 border border-anthracite-700 rounded-xl overflow-hidden hover:border-anthracite-600 transition-colors group">
                  {/* Product Image */}
                  <div className="aspect-[4/3] bg-anthracite-700 relative overflow-hidden">
                    <ProductPhoto productId={product.id} productName={product.name} images={product.images || []} className="h-full" />
                    <span className={`pointer-events-none absolute top-3 left-3 text-xs px-2 py-0.5 rounded-full font-medium ${
                      product.condition === 'new' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {ui(product.condition === 'new' ? 'Nou' : 'Second-hand')}
                    </span>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <span className="text-xs text-anthracite-400 uppercase tracking-wider">{ui(product.category)}</span>
                    <h3 className="text-sm font-semibold text-white mt-1 line-clamp-2"><Link href={`/products/${product.id}`} className="hover:text-gold-400 underline-offset-4 hover:underline">{product.name}</Link></h3>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-gold-400">{formatCatalogPrice(product.price_eur, locale, product)}</span>
                      <Link href={`/products/${product.id}${supplier.listing_source_url ? "#contact-furnizor" : ""}`}
                        className="min-h-11 inline-flex items-center text-xs bg-anthracite-700 text-anthracite-200 px-3 py-1.5 rounded-lg hover:bg-anthracite-600 transition-colors"
                      >
                        {ui("Vezi produsul")}</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 pb-12"><BuyingGuide /></div>
      <ReportContentLink kind="suppliers" id={supplier.id} />
    </main>
  );
}
