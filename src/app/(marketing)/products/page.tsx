'use client';

import { useUiText } from '@/i18n/useUiText';

import type { Product as ProductRow, SupplierProfile, Brand } from '@/types/database';
import Link from 'next/link';
import ProductPhoto from '@/components/ProductPhoto';
import { useSearchParams } from 'next/navigation';
import Footer from '@/components/layout/Footer';
import MarketNavigation from '@/components/MarketNavigation';
import BuyingGuide from '@/components/BuyingGuide';
import SupplierSourceDetails, { type SupplierSourceInfo } from '@/components/SupplierSourceDetails';
import { formatCatalogPrice, type PublishedPrice } from '@/lib/catalog-price';
import { useClientLocale } from '@/i18n/client';
import SupplierContactLinks from '@/components/SupplierContactLinks';
import { isMarket, marketName } from '@/lib/markets';
import { Search, Dumbbell, Heart, SlidersHorizontal, Loader2, X, RotateCcw, ChevronDown, ChevronUp, GitCompareArrows, Building2, MapPin, BadgeCheck, ArrowRight } from 'lucide-react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { useCompareStore, CompareProduct } from '@/store/compare';

type CatalogProduct = Pick<ProductRow, 'id' | 'supplier_id' | 'name' | 'category' | 'condition' | 'price_eur' | 'listed_price_amount' | 'listed_price_currency' | 'description'> & {
  images: string[] | null; brand: Pick<Brand, 'name' | 'country'> | null;
  supplier: Pick<SupplierProfile, 'company_name' | 'verified' | 'country' | 'phone' | 'website' | 'contact_email' | 'listing_source_url' | 'listing_checked_at' | 'catalog_url'> | null;
};

const categories = [
  { slug: 'all', name: 'Toate' },
  { slug: 'cardio', name: 'Cardio' },
  { slug: 'strength', name: 'Forță' },
  { slug: 'functional', name: 'Funcțional' },
  { slug: 'accessories', name: 'Accesorii' },
  { slug: 'wellness', name: 'Wellness' },
  { slug: 'lockers', name: 'Vestiare' },
  { slug: 'reception', name: 'Recepție' },
];

const categoryDisplayMap: Record<string, string> = {
  cardio: 'Cardio',
  strength: 'Forță',
  functional: 'Funcțional',
  accessories: 'Accesorii',
  wellness: 'Wellness',
  lockers: 'Vestiare',
  reception: 'Recepție',
};

interface Product extends PublishedPrice {
  id: string;
  supplierId: string;
  name: string;
  brand: string;
  category: string;
  condition: string;
  price: number | null;
  description?: string | null;
  images?: string[] | null;
  supplier: string;
  supplierVerified?: boolean;
  supplierCountry?: string;
  brandCountry?: string | null;
  supplierPhone?: string | null;
  supplierEmail?: string | null;
  supplierWebsite?: string | null;
}

interface ApprovedSupplier extends SupplierSourceInfo {
  id: string;
  company_name: string;
  country?: string;
  contact_email?: string | null;
  phone?: string | null;
  website?: string | null;
  city?: string;
  description?: string | null;
  logo_url?: string;
  verified?: boolean;
  product_count: number;
}

// Fallback data when Supabase is not connected

export default function ProductsPage() {
  const ui = useUiText();
  const locale = useClientLocale();
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString() || '';
  const ownQuery = useRef<string | null>(null);
  const externalQuery = useRef<string | null>(null);
  const urlCondition = searchParams?.get('condition') || 'all';
  const urlCategory = searchParams?.get('category') || 'all';
  const urlSupplier = searchParams?.get('supplier') || '';
  const urlMarket = searchParams?.get('market') || '';
  const market = isMarket(urlMarket) ? urlMarket : '';
  const selectedMarketName = marketName(market);

  const [activeCategory, setActiveCategory] = useState(urlCategory);
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');
  const [suggestions, setSuggestions] = useState<{type: string; id: string; text: string; subtitle?: string; image?: string | null}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [toast, setToast] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvedSuppliers, setApprovedSuppliers] = useState<ApprovedSupplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  const user = useAuthStore(s => s.user);
  const [fetchError, setFetchError] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pages, setPages] = useState(1);
  useEffect(() => {
    if (!user) { setFavorites([]); return; }
    let active = true;
    fetch('/api/client/favorites').then(async res => { if (!res.ok) return; const data = await res.json(); if (active) setFavorites(data.ids || []); }).catch(() => {});
    return () => { active = false; };
  }, [user]);

  // Advanced filters
  const [showFilters, setShowFilters] = useState(urlCondition !== 'all' || urlCategory !== 'all');
  const [conditionFilter, setConditionFilter] = useState(urlCondition);
  const [priceMin, setPriceMin] = useState(searchParams?.get('price_min') || '');
  const [priceMax, setPriceMax] = useState(searchParams?.get('price_max') || '');
  const [sortBy, setSortBy] = useState(searchParams?.get('sort') || 'recommended');

  useEffect(() => {
    if (ownQuery.current === queryString) { ownQuery.current = null; return; }
    externalQuery.current = queryString;
    const params = new URLSearchParams(queryString);
    setActiveCategory(params.get('category') || 'all'); setConditionFilter(params.get('condition') || 'all');
    setSearchQuery(params.get('search') || ''); setPriceMin(params.get('price_min') || ''); setPriceMax(params.get('price_max') || '');
    setSortBy(params.get('sort') || 'recommended'); setPage(1);
  }, [queryString]);
  useEffect(() => {
    const filters = { category: activeCategory === 'all' ? '' : activeCategory, condition: conditionFilter === 'all' ? '' : conditionFilter, search: searchQuery, price_min: priceMin, price_max: priceMax, sort: sortBy === 'recommended' ? '' : sortBy };
    if (externalQuery.current !== null) {
      const source = new URLSearchParams(externalQuery.current);
      if (Object.entries(filters).every(([key, value]) => value === (['category', 'condition'].includes(key) && source.get(key) === 'all' || key === 'sort' && source.get(key) === 'recommended' ? '' : source.get(key) || ''))) externalQuery.current = null;
      return;
    }
    const params = new URLSearchParams(queryString);
    Object.entries(filters).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key));
    const next = params.toString();
    if (next !== queryString) { ownQuery.current = next; window.history.replaceState(null, '', next ? `/products?${next}` : '/products'); }
  }, [queryString, activeCategory, conditionFilter, searchQuery, priceMin, priceMax, sortBy]);

  const catalogTitle = conditionFilter === 'new'
    ? 'Echipamente Noi'
    : conditionFilter === 'used'
      ? 'Echipamente Second-Hand'
      : 'Echipamente';
  const showSuppliersSection = conditionFilter !== 'used' && (!!market || !urlSupplier);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchApprovedSuppliers() {
      setLoadingSuppliers(true);
      setApprovedSuppliers([]);
      try {
        const params = new URLSearchParams({ limit: '12' });
        if (market) params.set('market', market);
        const res = await fetch(`/api/suppliers?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error('suppliers');
        const data = await res.json();
        if (!controller.signal.aborted) setApprovedSuppliers(data.suppliers || []);
      } catch {
        if (!controller.signal.aborted) setApprovedSuppliers([]);
      } finally {
        if (!controller.signal.aborted) setLoadingSuppliers(false);
      }
    }
    fetchApprovedSuppliers();
    return () => controller.abort();
  }, [market]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return activeCategory !== 'all' || conditionFilter !== 'all' || priceMin !== '' || priceMax !== '';
  }, [activeCategory, conditionFilter, priceMin, priceMax]);

  // Autocomplete - fetch suggestions on input change
  const suggestionsAbort = useRef<AbortController | null>(null);
  const fetchSuggestions = useCallback(async (q: string) => {
    suggestionsAbort.current?.abort();
    const controller = new AbortController(); suggestionsAbort.current = controller;
    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    try {
      const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(q)}`, { signal: controller.signal });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions((data.suggestions || []).length > 0);
    } catch { if (!controller.signal.aborted) setSuggestions([]); }
  }, []);

  const handleSearchInput = (value: string) => {
    setPage(1);
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
  };

  // Close suggestions on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { setPage(1); }, [activeCategory, searchQuery, conditionFilter, priceMin, priceMax, urlSupplier, sortBy, market]);

  // Fetch products from API
  useEffect(() => {
    const controller = new AbortController();
    async function fetchProducts() {
      setFetchError('');
      try {
        const params = new URLSearchParams({ page: String(page), sort: sortBy });
        if (activeCategory !== 'all') params.set('category', activeCategory);
        if (searchQuery) params.set('search', searchQuery);
        if (conditionFilter !== 'all') params.set('condition', conditionFilter);
        if (priceMin) params.set('price_min', priceMin);
        if (priceMax) params.set('price_max', priceMax);
        if (urlSupplier) params.set('supplier', urlSupplier);
        if (market) params.set('market', market);

        const res = await fetch(`/api/products?${params.toString()}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setPages(data.pages || 1);
          setTotalCount(data.count || 0);
          if (data.products && data.products.length > 0) {
            const mapped = data.products.map((p: CatalogProduct) => ({
              id: p.id,
              supplierId: p.supplier_id,
              name: p.name,
              brand: p.brand?.name || '',
              category: p.category,
              condition: p.condition,
              price: p.price_eur === null ? null : Number(p.price_eur),
              listed_price_amount: p.listed_price_amount,
              listed_price_currency: p.listed_price_currency,
              description: p.description,
              images: p.images,
              supplier: p.supplier?.company_name || 'Furnizor Gym Builder',
              supplierVerified: p.supplier?.verified || false,
              supplierCountry: p.supplier?.country,
              brandCountry: p.brand?.country,
              supplierPhone: p.supplier?.phone,
              supplierEmail: p.supplier?.contact_email,
              supplierWebsite: p.supplier?.website,
            }));
            setProducts(mapped);
          } else {
            setProducts([]);
          }
        } else { const data = await res.json(); throw new Error(data.error || 'Eroare la încărcarea produselor.'); }
      } catch (error) {
        if (!controller.signal.aborted) { setProducts([]); setTotalCount(0); setPages(1); setFetchError(error instanceof Error ? error.message : 'Eroare de conexiune.'); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    setLoading(true);
    const debounce = setTimeout(fetchProducts, 300);
    return () => { clearTimeout(debounce); controller.abort(); };
  }, [activeCategory, searchQuery, conditionFilter, priceMin, priceMax, urlSupplier, page, sortBy, market]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const toggleFavorite = async (productId: string) => {
    if (!user) { showToast('Autentifică-te pentru a salva favoritele.'); return; }
    try {
      const res = await fetch('/api/client/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: productId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Eroare la salvarea favoritelor.');
      setFavorites(current => data.favorited ? Array.from(new Set([...current, productId])) : current.filter(id => id !== productId));
      showToast(data.message);
    } catch (error) { showToast(error instanceof Error ? error.message : 'Eroare de rețea.'); }
  };


  const resetFilters = () => {
    setActiveCategory('all');
    setConditionFilter('all');
    setPriceMin('');
    setPriceMax('');
    setSearchQuery('');
    setSortBy('recommended');
    ownQuery.current = null; externalQuery.current = null;
    window.history.replaceState(null, '', '/products');
  };

  const filteredProducts = products;

  const conditionLabel = (c: string) => c === 'new' ? 'Nou' : c === 'used' ? 'Second-hand' : c;

  // Compare
  const compareItems = useCompareStore((s) => s.items);
  const addToCompare = useCompareStore((s) => s.addItem);
  const removeFromCompare = useCompareStore((s) => s.removeItem);
  const isInCompare = useCompareStore((s) => s.isInCompare);
  const [compareMounted, setCompareMounted] = useState(false);
  useEffect(() => { setCompareMounted(true); }, []);

  const toggleCompare = (product: Product) => {
    if (isInCompare(product.id)) {
      removeFromCompare(product.id);
    } else {
      const cp: CompareProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        condition: product.condition,
        brand: product.brand,
        supplier: product.supplier,
        images: product.images || [],
      };
      const added = addToCompare(cp);
      if (!added) showToast('Maxim 4 produse pentru comparație');
    }
  };

  return (
    <main className="min-h-screen">

      {/* Toast */}
      {toast && (
        <div className="fixed top-[calc(var(--app-header-height)+1rem)] right-4 z-50 bg-anthracite-800 border border-gold-400/30 text-gold-400 px-4 py-3 rounded-lg shadow-lg text-sm">
          {ui(toast)}
        </div>
      )}

      <section className="pt-24 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Catalog <span className="gold-gradient">{conditionFilter === 'used' && selectedMarketName ? `${ui(catalogTitle)} · ${ui(selectedMarketName)}` : ui(selectedMarketName || catalogTitle)}</span>
          </h1>
          <p className="text-anthracite-300 text-lg max-w-2xl">
            {ui("Fotografii, specificații și date de contact pentru echipamente fitness. Discută achiziția direct cu furnizorul.")}</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-10">
        <MarketNavigation condition={conditionFilter} selected={market} />
      </div>

      {/* Approved Suppliers — visible even before they publish products */}
      {showSuppliersSection && (
        <section className="px-4 pb-10">
          <div className="max-w-7xl mx-auto rounded-3xl border border-gold-400/25 bg-gradient-to-br from-gold-400/10 via-anthracite-900 to-anthracite-900 p-5 sm:p-7 md:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-[0.18em] mb-2">
                  <BadgeCheck className="w-4 h-4" /> {ui("Furnizori de echipamente")}</div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">{ui("Descoperă furnizorii de echipamente")}</h2>
                <p className="text-anthracite-300 mt-2 max-w-2xl">
                  {ui("Explorează furnizorii, cataloagele și datele lor de contact. Profilurile documentate din surse publice sunt marcate separat.")}</p>
              </div>
              <Link
                href={market ? `/suppliers?market=${market}` : "/suppliers"}
                className="inline-flex items-center gap-2 text-sm font-semibold text-gold-400 hover:text-gold-300 transition-colors whitespace-nowrap"
              >
                {ui("Vezi toți furnizorii ")}<ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loadingSuppliers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1].map((item) => (
                  <div key={item} className="h-44 rounded-2xl bg-anthracite-800/80 border border-anthracite-700 animate-pulse" />
                ))}
              </div>
            ) : approvedSuppliers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {approvedSuppliers.map((supplier) => (
                  <article key={supplier.id} className="group rounded-2xl border border-anthracite-700 bg-anthracite-950/70 p-5 hover:border-gold-400/45 transition-colors flex flex-col">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-anthracite-800 border border-anthracite-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {supplier.logo_url ? (
                          <img src={supplier.logo_url} alt={ui(`Logo ${supplier.company_name}`)} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Building2 className="w-7 h-7 text-gold-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <h3 className="font-bold text-white leading-snug group-hover:text-gold-400 transition-colors">{supplier.company_name}</h3>
                          {supplier.verified && <BadgeCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" aria-label="Furnizor verificat" />}
                        </div>
                        <p className="flex items-center gap-1.5 text-sm text-anthracite-400 mt-1">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          {[supplier.city, supplier.country].filter(Boolean).join(', ') || ui('Locație disponibilă în profil')}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-anthracite-300 mt-4 line-clamp-2 min-h-10">
                      {supplier.description || ui('Furnizor aprobat de echipamente profesionale pentru săli de fitness.')}
                    </p>

                    <div className="mt-4"><SupplierSourceDetails supplier={supplier} /></div>
                    <div className="mt-4"><SupplierContactLinks supplierId={supplier.id} phone={supplier.phone} website={supplier.website} email={supplier.contact_email} /></div>

                    <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-anthracite-800">
                      <span className="text-xs text-anthracite-400">
                        <strong className="text-white">{supplier.product_count || 0}</strong> {ui("produse publicate")}</span>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/products?supplier=${supplier.id}${market ? `&market=${market}` : ""}`}
                          className="text-xs font-semibold text-anthracite-300 hover:text-white transition-colors"
                        >
                          {ui("Produse")}</Link>
                        <Link
                          href={`/suppliers/${supplier.id}`}
                          className="inline-flex items-center gap-1.5 bg-gold-400 text-anthracite-950 px-3 py-2 rounded-lg text-xs font-bold hover:bg-gold-300 transition-colors"
                        >
                          {ui("Vezi profilul ")}<ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-anthracite-700 py-10 text-center">
                <Building2 className="w-10 h-10 text-anthracite-600 mx-auto mb-3" />
                <p className="text-anthracite-400">{ui("Furnizorii aprobați vor apărea aici.")}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Search & Filters Bar */}
      <section className="py-6 px-4 border-b border-anthracite-800 sticky top-[var(--app-header-height)] z-40 bg-anthracite-950/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1" ref={searchRef}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-anthracite-400 z-10" />
              <input
                type="text"
                aria-label={ui("Caută echipamente și branduri")} placeholder={ui("Caută echipamente, branduri...")}
                className="input-field pl-12"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-anthracite-900 border border-anthracite-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  {suggestions.map((s, i) => (
                    <Link
                      key={`${s.type}-${s.id}-${i}`}
                      href={s.type === 'product' ? `/products/${s.id}` : s.type === 'supplier' ? `/suppliers/${s.id}` : s.type === 'category' ? `/products?category=${s.id}` : `/products?search=${encodeURIComponent(s.text)}`}
                      onClick={() => { setShowSuggestions(false); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-anthracite-800 transition-colors border-b border-anthracite-800 last:border-0"
                    >
                      {s.image ? (
                        <img src={s.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-anthracite-700 flex items-center justify-center flex-shrink-0">
                          {s.type === 'product' ? <Dumbbell className="w-5 h-5 text-anthracite-400" /> : <Search className="w-5 h-5 text-anthracite-400" />}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{s.text}</p>
                        {s.subtitle && <p className="text-anthracite-400 text-sm truncate">{s.subtitle}</p>}
                      </div>
                      <span className="text-xs text-anthracite-500 capitalize flex-shrink-0">
                        {ui(s.type === 'product' ? 'Produs' : s.type === 'supplier' ? 'Furnizor' : s.type === 'brand' ? 'Brand' : 'Categorie')}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center gap-2 ${showFilters ? 'border-gold-400 text-gold-400' : ''}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {ui("Filtre Avansate")}{hasActiveFilters && (
                <span className="w-2 h-2 bg-gold-400 rounded-full" />
              )}
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => { setPage(1); setActiveCategory(cat.slug); }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.slug
                    ? 'bg-gold-400 text-anthracite-950'
                    : 'border border-anthracite-600 text-anthracite-300 hover:border-gold-400 hover:text-gold-400'
                }`}
              >
                {ui(cat.name)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <section className="px-4 py-5 border-b border-anthracite-800 bg-anthracite-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Condition Filter */}
              <div>
                <p className="block text-xs font-medium text-anthracite-400 uppercase tracking-wider mb-2">
                  {ui("Stare")}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConditionFilter('all')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      conditionFilter === 'all'
                        ? 'bg-gold-400/10 text-gold-400 border border-gold-400/30'
                        : 'bg-anthracite-800 text-anthracite-300 border border-anthracite-700 hover:border-anthracite-500'
                    }`}
                  >
                    {ui("Toate")}</button>
                  <button
                    onClick={() => setConditionFilter('new')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      conditionFilter === 'new'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-anthracite-800 text-anthracite-300 border border-anthracite-700 hover:border-anthracite-500'
                    }`}
                  >
                    {ui("Nou")}</button>
                  <button
                    onClick={() => setConditionFilter('used')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      conditionFilter === 'used'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-anthracite-800 text-anthracite-300 border border-anthracite-700 hover:border-anthracite-500'
                    }`}
                  >
                    Second-hand
                  </button>
                </div>
              </div>

              {/* Price Range */}
              <div className="sm:col-span-2">
                <label htmlFor="field-marketingproducts-26187" className="block text-xs font-medium text-anthracite-400 uppercase tracking-wider mb-2">
                  {ui("Interval Preț (EUR)")}</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-anthracite-500 text-sm">&euro;</span>
                    <input id="field-marketingproducts-26187"
                      type="number"
                      aria-label={ui("Preț minim EUR")} placeholder="Min"
                      className="input-field pl-8 text-sm"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      min="0"
                    />
                  </div>
                  <span className="text-anthracite-500">—</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-anthracite-500 text-sm">&euro;</span>
                    <input
                      type="number"
                      aria-label={ui("Preț maxim EUR")} placeholder="Max"
                      className="input-field pl-8 text-sm"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              <div className="flex items-end">
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-anthracite-800 border border-anthracite-700 text-anthracite-300 hover:text-white hover:border-anthracite-500 text-sm font-medium transition-colors w-full justify-center"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {ui("Resetează Filtre")}</button>
                )}
              </div>
            </div>

            {/* Active filters summary */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span className="text-xs text-anthracite-500">{ui("Filtre active:")}</span>
                {activeCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gold-400/10 text-gold-400 text-xs">
                    {ui(categoryDisplayMap[activeCategory] || activeCategory)}
                    <button aria-label={ui("Elimină filtrul")} onClick={() => setActiveCategory('all')} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {conditionFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gold-400/10 text-gold-400 text-xs">
                    {ui(conditionFilter === 'new' ? 'Nou' : 'Second-hand')}
                    <button aria-label={ui("Elimină filtrul")} onClick={() => setConditionFilter('all')} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {priceMin && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gold-400/10 text-gold-400 text-xs">
                    Min: &euro;{priceMin}
                    <button aria-label={ui("Elimină filtrul")} onClick={() => setPriceMin('')} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {priceMax && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gold-400/10 text-gold-400 text-xs">
                    Max: &euro;{priceMax}
                    <button aria-label={ui("Elimină filtrul")} onClick={() => setPriceMax('')} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Products Grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <p className="text-anthracite-400 text-sm">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> {ui("Se caută...")}</span>
              ) : (
                <>
                  <span className="text-white font-semibold text-base">{totalCount}</span>{ui(' ')}
                  {ui(totalCount === 1 ? 'produs găsit' : 'produse găsite')}
                </>
              )}
            </p>
            <select
              className="bg-anthracite-800 border border-anthracite-600 rounded-lg px-3 py-2 text-sm text-anthracite-200"
              value={sortBy}
              onChange={(e) => { setPage(1); setSortBy(e.target.value); }}
            >
              <option value="recommended">{ui("Sortare: Recomandate")}</option>
              <option value="price_asc">{ui("Preț: Crescător")}</option>
              <option value="price_desc">{ui("Preț: Descrescător")}</option>
              <option value="newest">{ui("Cele mai noi")}</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
            </div>
          ) : fetchError ? <p role="alert" className="text-red-400 py-8">{ui(fetchError)}</p> : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Dumbbell className="w-12 h-12 text-anthracite-600 mx-auto mb-4" />
              <p className="text-anthracite-400 mb-4">{ui("Nu s-au găsit produse cu aceste filtre.")}</p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-400/10 text-gold-400 text-sm font-medium hover:bg-gold-400/20 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {ui("Resetează Filtre")}</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="card-hover group flex flex-col">
                  {/* Image */}
                  <div className="relative h-52 bg-anthracite-700 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    <ProductPhoto productId={product.id} productName={product.name} images={product.images || []} className="h-full" />
                    <button
                      aria-label={ui(favorites.includes(product.id) ? "Elimină din favorite" : "Adaugă la favorite")} aria-pressed={favorites.includes(product.id)} onClick={(e) => { e.preventDefault(); toggleFavorite(product.id); }}
                      className="absolute top-3 right-3 w-8 h-8 bg-anthracite-800/80 rounded-full flex items-center justify-center hover:bg-anthracite-700 transition-all"
                    >
                      <Heart className={`w-4 h-4 transition-colors ${
                        favorites.includes(product.id) ? 'text-red-400 fill-red-400' : 'text-anthracite-300 hover:text-red-400'
                      }`} />
                    </button>
                    <span className={`pointer-events-none absolute top-3 left-3 px-2 py-0.5 rounded text-xs font-medium ${
                      product.condition === 'new' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {ui(conditionLabel(product.condition))}
                    </span>
                  </div>

                  {/* Info */}
                  <Link href={`/products/${product.id}`} className="block flex-1">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gold-400 font-medium">{product.brand}</span>
                      <span className="text-xs text-anthracite-500">&middot;</span>
                      <span className="text-xs text-anthracite-400">{ui(categoryDisplayMap[product.category] || product.category)}</span>
                    </div>
                    <h3 className="text-white font-semibold line-clamp-2 group-hover:text-gold-400 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-anthracite-500 flex items-center gap-1">
                      {ui("de la ")}{product.supplier}
                      {product.supplierVerified && (
                        <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 24 24" aria-label={ui("Furnizor Verificat")}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      )}
                    </p>
                    <p className="text-xs text-anthracite-300">{ui('Țara furnizorului')}: {product.supplierCountry || ui('Nespecificată')}</p>
                    {product.brandCountry && <p className="text-xs text-anthracite-300">{ui('Țara mărcii')}: {product.brandCountry}</p>}
                  </div>
                  </Link>

                  <div className="mt-4"><SupplierContactLinks supplierId={product.supplierId} phone={product.supplierPhone} website={product.supplierWebsite} email={product.supplierEmail} /></div>

                  {/* Price + Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-3 border-t border-anthracite-700">
                    <span className="text-xl font-bold text-gold-400">{formatCatalogPrice(product.price, locale, product)}</span>
                    <div className="flex items-center gap-2">
                      {/* Compare checkbox */}
                      {compareMounted && (
                        <button
                          onClick={() => toggleCompare(product)}
                          className={`px-2.5 py-2 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors border ${
                            isInCompare(product.id)
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : 'bg-anthracite-800 text-anthracite-400 border-anthracite-700 hover:border-anthracite-500 hover:text-anthracite-200'
                          }`}
                          title={ui(isInCompare(product.id) ? 'Elimină din comparație' : 'Adaugă la comparație')}
                        >
                          <GitCompareArrows className="w-3.5 h-3.5" />
                          {ui(isInCompare(product.id) ? '✓' : '')}
                        </button>
                      )}

                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Compare Bar - Fixed bottom */}
      {compareMounted && compareItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-anthracite-900/95 backdrop-blur-xl border-t border-anthracite-700 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <GitCompareArrows className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-anthracite-300">
                <span className="text-white font-semibold">{compareItems.length}</span>{ui("/4 produse selectate")}</span>
              <div className="hidden sm:flex items-center gap-2 ml-2">
                {compareItems.map((item) => (
                  <div key={String(item.id)} className="flex items-center gap-1.5 bg-anthracite-800 border border-anthracite-700 rounded-lg px-2.5 py-1">
                    <span className="text-xs text-anthracite-200 max-w-[120px] truncate">{item.name}</span>
                    <button aria-label={ui("Elimină din comparație")}
                      onClick={() => removeFromCompare(item.id)}
                      className="text-anthracite-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => useCompareStore.getState().clearAll()}
                className="text-xs text-anthracite-400 hover:text-white transition-colors"
              >
                {ui("Șterge tot")}</button>
              <Link
                href={`/compare?ids=${compareItems.map(i => i.id).join(',')}`}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                  compareItems.length >= 2
                    ? 'bg-blue-500 text-white hover:bg-blue-400'
                    : 'bg-anthracite-700 text-anthracite-500 cursor-not-allowed pointer-events-none'
                }`}
              >
                <GitCompareArrows className="w-4 h-4" />
                {ui("Compară Acum")}</Link>
            </div>
          </div>
        </div>
      )}

      {pages > 1 && <nav aria-label="Paginare catalog" className="flex justify-center items-center gap-4 py-8"><button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{ui("Înapoi")}</button><span>{page} / {pages}</span><button className="btn-secondary" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>{ui("Înainte")}</button></nav>}
      <div className="max-w-7xl mx-auto px-4 pb-12"><BuyingGuide /></div>
      <Footer />
    </main>
  );
}
