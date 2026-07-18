'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Search, Dumbbell, Heart, SlidersHorizontal, Mail, Loader2, X, RotateCcw, ChevronDown, ChevronUp, GitCompareArrows } from 'lucide-react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useCompareStore, CompareProduct } from '@/store/compare';

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

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  condition: string;
  price: number;
  description?: string;
  images?: string[];
  supplier: string;
  supplierVerified?: boolean;
}

// Fallback data when Supabase is not connected
const fallbackProducts: Product[] = [
  { id: 1, name: 'Life Fitness Integrity Series Treadmill', brand: 'Life Fitness', category: 'cardio', condition: 'new', price: 8500, supplier: 'FitPro Equipment' },
  { id: 2, name: 'Technogym Selection Pro Chest Press', brand: 'Technogym', category: 'strength', condition: 'new', price: 4200, supplier: 'GymTech Solutions' },
  { id: 3, name: 'Matrix Rower', brand: 'Matrix', category: 'cardio', condition: 'new', price: 2800, supplier: 'Nordic Fitness' },
  { id: 4, name: 'Hammer Strength HD Elite Power Rack', brand: 'Hammer Strength', category: 'strength', condition: 'new', price: 3600, supplier: 'FitPro Equipment' },
  { id: 5, name: 'Precor EFX 885 Elliptical', brand: 'Precor', category: 'cardio', condition: 'used', price: 3200, supplier: 'EuroGym Direct' },
  { id: 6, name: 'Cybex VR3 Leg Press', brand: 'Cybex', category: 'strength', condition: 'new', price: 5100, supplier: 'Fitness Factory' },
  { id: 7, name: 'TRX Suspension Training Set Pro', brand: 'TRX', category: 'functional', condition: 'new', price: 450, supplier: 'IronWorks RO' },
  { id: 8, name: 'Concept2 RowErg', brand: 'Concept2', category: 'cardio', condition: 'new', price: 1200, supplier: 'Nordic Fitness' },
  { id: 9, name: 'Eleiko IWF Competition Set', brand: 'Eleiko', category: 'strength', condition: 'new', price: 2800, supplier: 'EuroGym Direct' },
];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const urlCondition = searchParams?.get('condition') || 'all';
  const urlCategory = searchParams?.get('category') || 'all';

  const [activeCategory, setActiveCategory] = useState(urlCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{type: string; id: string; text: string; subtitle?: string; image?: string | null}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [toast, setToast] = useState('');
  const [showContactModal, setShowContactModal] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'api' | 'fallback'>('fallback');

  // Advanced filters
  const [showFilters, setShowFilters] = useState(urlCondition !== 'all' || urlCategory !== 'all');
  const [conditionFilter, setConditionFilter] = useState(urlCondition);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState('recommended');

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return activeCategory !== 'all' || conditionFilter !== 'all' || priceMin !== '' || priceMax !== '';
  }, [activeCategory, conditionFilter, priceMin, priceMax]);

  // Autocomplete - fetch suggestions on input change
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    try {
      const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions((data.suggestions || []).length > 0);
    } catch { setSuggestions([]); }
  }, []);

  const handleSearchInput = (value: string) => {
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

  // Fetch products from API
  useEffect(() => {
    async function fetchProducts() {
      try {
        const params = new URLSearchParams();
        if (activeCategory !== 'all') params.set('category', activeCategory);
        if (searchQuery) params.set('search', searchQuery);
        if (conditionFilter !== 'all') params.set('condition', conditionFilter);
        if (priceMin) params.set('price_min', priceMin);
        if (priceMax) params.set('price_max', priceMax);

        const res = await fetch(`/api/products?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.products && data.products.length > 0) {
            const mapped = data.products.map((p: any) => ({
              id: p.id,
              name: p.name,
              brand: p.brand?.name || p.brand || '',
              category: p.category,
              condition: p.condition,
              price: Number(p.price_eur),
              description: p.description,
              images: p.images,
              supplier: p.supplier?.company_name || p.supplier_profiles?.company_name || 'Furnizor GymBuilder',
              supplierVerified: p.supplier?.verified || false,
            }));
            setProducts(mapped);
            setDataSource('api');
          } else {
            setProducts(fallbackProducts);
            setDataSource('fallback');
          }
        } else {
          setProducts(fallbackProducts);
          setDataSource('fallback');
        }
      } catch {
        setProducts(fallbackProducts);
        setDataSource('fallback');
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    const debounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounce);
  }, [activeCategory, searchQuery, conditionFilter, priceMin, priceMax]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const toggleFavorite = (productId: number) => {
    if (favorites.includes(productId)) {
      setFavorites(favorites.filter(id => id !== productId));
      showToast('Eliminat din favorite');
    } else {
      setFavorites([...favorites, productId]);
      showToast('Adăugat la favorite ❤️');
    }
  };

  const resetFilters = () => {
    setActiveCategory('all');
    setConditionFilter('all');
    setPriceMin('');
    setPriceMax('');
    setSearchQuery('');
  };

  // Client-side filter + sort for fallback data
  const filteredProducts = useMemo(() => {
    let result = dataSource === 'fallback'
      ? products.filter((p) => {
          const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
          const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesCondition = conditionFilter === 'all' || p.condition === conditionFilter;
          const matchesPriceMin = !priceMin || p.price >= Number(priceMin);
          const matchesPriceMax = !priceMax || p.price <= Number(priceMax);
          return matchesCategory && matchesSearch && matchesCondition && matchesPriceMin && matchesPriceMax;
        })
      : products;

    // Sort
    if (sortBy === 'price_asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      result = [...result].reverse();
    }

    return result;
  }, [products, dataSource, activeCategory, searchQuery, conditionFilter, priceMin, priceMax, sortBy]);

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
        images: product.images,
      };
      const added = addToCompare(cp);
      if (!added) showToast('Maxim 4 produse pentru comparație');
    }
  };

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-anthracite-800 border border-gold-400/30 text-gold-400 px-4 py-3 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass-card p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowContactModal(null)}
              className="absolute top-4 right-4 text-anthracite-400 hover:text-white text-xl"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Cerere Ofertă</h3>
            <p className="text-sm text-anthracite-400 mb-6">
              Solicită ofertă pentru: {products.find(p => p.id === showContactModal)?.name}
            </p>
            <form onSubmit={(e) => { e.preventDefault(); showToast('Cerere de ofertă trimisă cu succes!'); setShowContactModal(null); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Nume *</label>
                <input type="text" className="input-field" placeholder="Numele tău" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Email *</label>
                <input type="email" className="input-field" placeholder="email@exemplu.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Cantitate</label>
                <input type="number" className="input-field" placeholder="1" min="1" defaultValue={1} />
              </div>
              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Mesaj</label>
                <textarea className="input-field min-h-[80px] resize-y" placeholder="Detalii suplimentare..." />
              </div>
              <button type="submit" className="btn-primary w-full py-3">
                Trimite Cererea de Ofertă
              </button>
            </form>
          </div>
        </div>
      )}

      <section className="pt-24 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Catalog <span className="gold-gradient">Echipamente</span>
          </h1>
          <p className="text-anthracite-300 text-lg max-w-2xl">
            Echipamente fitness de la branduri premium, verificate și gata de livrare.
          </p>
        </div>
      </section>

      {/* Search & Filters Bar */}
      <section className="py-6 px-4 border-b border-anthracite-800 sticky top-16 z-40 bg-anthracite-950/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1" ref={searchRef}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-anthracite-400 z-10" />
              <input
                type="text"
                placeholder="Caută echipamente, branduri..."
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
                      href={s.type === 'product' ? `/products/${s.id}` : s.type === 'supplier' ? `/suppliers/${s.id}` : `/products?category=${s.id}`}
                      onClick={() => { setShowSuggestions(false); setSearchQuery(s.text); }}
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
                        {s.type === 'product' ? 'Produs' : s.type === 'supplier' ? 'Furnizor' : s.type === 'brand' ? 'Brand' : 'Categorie'}
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
              Filtre Avansate
              {hasActiveFilters && (
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
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.slug
                    ? 'bg-gold-400 text-anthracite-950'
                    : 'border border-anthracite-600 text-anthracite-300 hover:border-gold-400 hover:text-gold-400'
                }`}
              >
                {cat.name}
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
                <label className="block text-xs font-medium text-anthracite-400 uppercase tracking-wider mb-2">
                  Stare
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConditionFilter('all')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      conditionFilter === 'all'
                        ? 'bg-gold-400/10 text-gold-400 border border-gold-400/30'
                        : 'bg-anthracite-800 text-anthracite-300 border border-anthracite-700 hover:border-anthracite-500'
                    }`}
                  >
                    Toate
                  </button>
                  <button
                    onClick={() => setConditionFilter('new')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      conditionFilter === 'new'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-anthracite-800 text-anthracite-300 border border-anthracite-700 hover:border-anthracite-500'
                    }`}
                  >
                    Nou
                  </button>
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
                <label className="block text-xs font-medium text-anthracite-400 uppercase tracking-wider mb-2">
                  Interval Preț (EUR)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-anthracite-500 text-sm">&euro;</span>
                    <input
                      type="number"
                      placeholder="Min"
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
                      placeholder="Max"
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
                    Resetează Filtre
                  </button>
                )}
              </div>
            </div>

            {/* Active filters summary */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span className="text-xs text-anthracite-500">Filtre active:</span>
                {activeCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gold-400/10 text-gold-400 text-xs">
                    {categoryDisplayMap[activeCategory] || activeCategory}
                    <button onClick={() => setActiveCategory('all')} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {conditionFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gold-400/10 text-gold-400 text-xs">
                    {conditionFilter === 'new' ? 'Nou' : 'Second-hand'}
                    <button onClick={() => setConditionFilter('all')} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {priceMin && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gold-400/10 text-gold-400 text-xs">
                    Min: &euro;{priceMin}
                    <button onClick={() => setPriceMin('')} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {priceMax && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gold-400/10 text-gold-400 text-xs">
                    Max: &euro;{priceMax}
                    <button onClick={() => setPriceMax('')} className="hover:text-white"><X className="w-3 h-3" /></button>
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
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Se caută...
                </span>
              ) : (
                <>
                  <span className="text-white font-semibold text-base">{filteredProducts.length}</span>{' '}
                  {filteredProducts.length === 1 ? 'produs găsit' : 'produse găsite'}
                  {dataSource === 'api' && <span className="ml-2 text-emerald-400 text-xs">(date live)</span>}
                </>
              )}
            </p>
            <select
              className="bg-anthracite-800 border border-anthracite-600 rounded-lg px-3 py-2 text-sm text-anthracite-200"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recommended">Sortare: Recomandate</option>
              <option value="price_asc">Preț: Crescător</option>
              <option value="price_desc">Preț: Descrescător</option>
              <option value="newest">Cele mai noi</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Dumbbell className="w-12 h-12 text-anthracite-600 mx-auto mb-4" />
              <p className="text-anthracite-400 mb-4">Nu s-au găsit produse cu aceste filtre.</p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-400/10 text-gold-400 text-sm font-medium hover:bg-gold-400/20 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Resetează Filtre
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="card-hover group flex flex-col">
                  {/* Image */}
                  <Link href={`/products/${product.id}`} className="block">
                  <div className="relative h-52 bg-anthracite-700 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {product.images && product.images[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Dumbbell className="w-16 h-16 text-anthracite-500" />
                    )}
                    <button
                      onClick={(e) => { e.preventDefault(); toggleFavorite(product.id); }}
                      className="absolute top-3 right-3 w-8 h-8 bg-anthracite-800/80 rounded-full flex items-center justify-center hover:bg-anthracite-700 transition-all"
                    >
                      <Heart className={`w-4 h-4 transition-colors ${
                        favorites.includes(product.id) ? 'text-red-400 fill-red-400' : 'text-anthracite-300 hover:text-red-400'
                      }`} />
                    </button>
                    <span className={`absolute top-3 left-3 px-2 py-0.5 rounded text-xs font-medium ${
                      product.condition === 'new' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {conditionLabel(product.condition)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gold-400 font-medium">{product.brand}</span>
                      <span className="text-xs text-anthracite-500">&middot;</span>
                      <span className="text-xs text-anthracite-400">{categoryDisplayMap[product.category] || product.category}</span>
                    </div>
                    <h3 className="text-white font-semibold line-clamp-2 group-hover:text-gold-400 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-anthracite-500 flex items-center gap-1">
                      de la {product.supplier}
                      {product.supplierVerified && (
                        <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 24 24" aria-label="Furnizor Verificat"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      )}
                    </p>
                  </div>
                  </Link>

                  {/* Price + Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-3 border-t border-anthracite-700">
                    <span className="text-xl font-bold text-gold-400">&euro;{product.price.toLocaleString()}</span>
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
                          title={isInCompare(product.id) ? 'Elimină din comparație' : 'Adaugă la comparație'}
                        >
                          <GitCompareArrows className="w-3.5 h-3.5" />
                          {isInCompare(product.id) ? '✓' : ''}
                        </button>
                      )}
                      <button
                        onClick={() => setShowContactModal(product.id)}
                        className="px-3 py-2 bg-gold-400/10 rounded-lg flex items-center gap-1.5 hover:bg-gold-400 hover:text-anthracite-950 text-gold-400 transition-colors text-sm font-medium"
                      >
                        <Mail className="w-3.5 h-3.5" /> Ofertă
                      </button>
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
                <span className="text-white font-semibold">{compareItems.length}</span>/4 produse selectate
              </span>
              <div className="hidden sm:flex items-center gap-2 ml-2">
                {compareItems.map((item) => (
                  <div key={String(item.id)} className="flex items-center gap-1.5 bg-anthracite-800 border border-anthracite-700 rounded-lg px-2.5 py-1">
                    <span className="text-xs text-anthracite-200 max-w-[120px] truncate">{item.name}</span>
                    <button
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
                Șterge tot
              </button>
              <Link
                href={`/compare?ids=${compareItems.map(i => i.id).join(',')}`}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                  compareItems.length >= 2
                    ? 'bg-blue-500 text-white hover:bg-blue-400'
                    : 'bg-anthracite-700 text-anthracite-500 cursor-not-allowed pointer-events-none'
                }`}
              >
                <GitCompareArrows className="w-4 h-4" />
                Compară Acum
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
