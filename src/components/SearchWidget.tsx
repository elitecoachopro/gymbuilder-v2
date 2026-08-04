'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Dumbbell, Heart, Zap, Wrench, LayoutGrid } from 'lucide-react';
import { useClientTranslations } from '@/i18n/client';

interface Category {
  slug: string;
  icon: React.ReactNode;
  labelKey: string;
}

const categories: Category[] = [
  { slug: 'all', icon: <LayoutGrid className="w-5 h-5" />, labelKey: 'catAll' },
  { slug: 'cardio', icon: <Heart className="w-5 h-5" />, labelKey: 'catCardio' },
  { slug: 'strength', icon: <Dumbbell className="w-5 h-5" />, labelKey: 'catStrength' },
  { slug: 'functional', icon: <Zap className="w-5 h-5" />, labelKey: 'catFunctional' },
  { slug: 'accessories', icon: <Wrench className="w-5 h-5" />, labelKey: 'catAccessories' },
];

export default function SearchWidget() {
  const { t } = useClientTranslations('searchWidget');
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [count, setCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch product count based on category and search
  const fetchCount = useCallback(async (category: string, search: string) => {
    setLoadingCount(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/products/count?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCount(data.count);
      }
    } catch {
      // Keep previous count on error
    } finally {
      setLoadingCount(false);
    }
  }, []);

  // Fetch count on mount and when category changes
  useEffect(() => {
    fetchCount(activeCategory, searchQuery);
  }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced fetch on search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCount(activeCategory, value);
    }, 300);
  };

  // Navigate to products page with filters
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (activeCategory !== 'all') params.set('category', activeCategory);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    router.push(`/products?${params.toString()}`);
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Button text with live count
  const getButtonText = () => {
    if (loadingCount) return t('searching');
    if (count === null) return t('search');
    if (count === 0) return t('noResults');
    return t('searchCount').replace('{count}', count.toString());
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Category Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setActiveCategory(cat.slug)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              activeCategory === cat.slug
                ? 'bg-gold-400 text-anthracite-900 shadow-lg shadow-gold-400/20'
                : 'bg-anthracite-800 text-anthracite-300 hover:bg-anthracite-700 hover:text-white border border-anthracite-700'
            }`}
          >
            {cat.icon}
            <span>{t(cat.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* Search Input + Button */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-anthracite-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('placeholder')}
            className="w-full pl-12 pr-4 py-4 bg-anthracite-800 border border-anthracite-700 rounded-xl text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/20 transition-all"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loadingCount}
          className="px-8 py-4 bg-gold-400 hover:bg-gold-500 text-anthracite-900 font-bold rounded-xl transition-all duration-200 whitespace-nowrap shadow-lg shadow-gold-400/20 hover:shadow-gold-400/30 active:scale-[0.97] disabled:opacity-70"
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
}
