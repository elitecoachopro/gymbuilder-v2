'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import { useCompareStore } from '@/store/compare';
import { GitCompareArrows, X, Package, ArrowLeft, Loader2, Star } from 'lucide-react';

interface ProductDetail {
  id: string;
  name: string;
  price_eur: number;
  category: string;
  condition: string;
  images: string[];
  specs: Record<string, string>;
  description: string | null;
  supplier?: { id: string; company_name: string; city: string; country: string };
  brand_name?: string;
}

interface ReviewStats {
  avgRating: number;
  count: number;
}

const categoryDisplayMap: Record<string, string> = {
  cardio: 'Cardio',
  strength: 'Forță',
  functional: 'Funcțional',
  accessories: 'Accesorii',
  wellness: 'Wellness',
  lockers: 'Vestiare',
  reception: 'Recepție',
};

export default function ComparePage() {
  const searchParams = useSearchParams();
  const ids = searchParams?.get('ids')?.split(',').filter(Boolean) || [];
  
  const removeFromCompare = useCompareStore((s) => s.removeItem);
  const clearAll = useCompareStore((s) => s.clearAll);

  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [ratings, setRatings] = useState<Record<string, ReviewStats>>({});
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    async function fetchProducts() {
      setLoading(true);
      try {
        const results = await Promise.all(
          ids.map(async (id) => {
            const res = await fetch(`/api/products/${id}`);
            if (res.ok) {
              const data = await res.json();
              return data.product as ProductDetail;
            }
            return null;
          })
        );
        const valid = results.filter(Boolean) as ProductDetail[];
        setProducts(valid);

        // Fetch ratings per supplier
        const supplierIds = Array.from(new Set(valid.map(p => p.supplier?.id).filter(Boolean)));
        const ratingResults: Record<string, ReviewStats> = {};
        await Promise.all(
          supplierIds.map(async (sid) => {
            try {
              const res = await fetch(`/api/reviews?supplier_id=${sid}`);
              if (res.ok) {
                const data = await res.json();
                if (data.stats) {
                  ratingResults[sid!] = data.stats;
                }
              }
            } catch {}
          })
        );
        setRatings(ratingResults);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const handleRemove = (productId: string) => {
    removeFromCompare(productId);
    setProducts(products.filter(p => p.id !== productId));
  };

  // Collect all spec keys across products
  const allSpecKeys = Array.from(new Set(products.flatMap(p => Object.keys(p.specs || {}))));

  if (!mounted) {
    return (
      <main className="min-h-screen bg-anthracite-950">
        <div className="pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-anthracite-950">

      <section className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/products" className="text-sm text-anthracite-400 hover:text-gold-400 transition-colors flex items-center gap-1 mb-2">
                <ArrowLeft className="w-4 h-4" /> Înapoi la Catalog
              </Link>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <GitCompareArrows className="w-8 h-8 text-blue-400" />
                Comparator Produse
              </h1>
              <p className="text-anthracite-400 text-sm mt-1">
                {products.length} produse în comparație
              </p>
            </div>
            {products.length > 0 && (
              <button
                onClick={() => { clearAll(); setProducts([]); }}
                className="text-sm text-anthracite-400 hover:text-red-400 transition-colors"
              >
                Șterge tot
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-anthracite-900 border border-anthracite-700 rounded-2xl">
              <GitCompareArrows className="w-16 h-16 text-anthracite-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Niciun produs de comparat</h2>
              <p className="text-anthracite-400 mb-6">
                Selectează cel puțin 2 produse din catalog pentru a le compara side-by-side.
              </p>
              <Link href="/products" className="btn-primary inline-flex items-center gap-2">
                <Package className="w-4 h-4" />
                Explorează Catalog
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr>
                    <th className="text-left text-xs text-anthracite-500 uppercase tracking-wider font-medium p-3 w-36">
                      Criteriu
                    </th>
                    {products.map((product) => (
                      <th key={product.id} className="p-3 text-center min-w-[200px]">
                        <button
                          onClick={() => handleRemove(product.id)}
                          className="absolute top-2 right-2 text-anthracite-500 hover:text-red-400 transition-colors"
                          title="Elimină din comparație"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Image Row */}
                  <tr className="border-t border-anthracite-800">
                    <td className="p-3 text-sm text-anthracite-400 font-medium">Imagine</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-3 text-center">
                        <div className="relative inline-block">
                          <button
                            onClick={() => handleRemove(product.id)}
                            className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-anthracite-800 border border-anthracite-600 rounded-full flex items-center justify-center text-anthracite-400 hover:text-red-400 hover:border-red-400/50 transition-colors"
                            title="Elimină din comparație"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <Link href={`/products/${product.id}`}>
                            <div className="w-40 h-32 bg-anthracite-800 rounded-xl overflow-hidden mx-auto border border-anthracite-700 hover:border-anthracite-500 transition-colors">
                              {product.images && product.images[0] ? (
                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-8 h-8 text-anthracite-500" />
                                </div>
                              )}
                            </div>
                          </Link>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Name Row */}
                  <tr className="border-t border-anthracite-800">
                    <td className="p-3 text-sm text-anthracite-400 font-medium">Nume</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-3 text-center">
                        <Link href={`/products/${product.id}`} className="text-sm font-semibold text-white hover:text-gold-400 transition-colors">
                          {product.name}
                        </Link>
                      </td>
                    ))}
                  </tr>

                  {/* Price Row */}
                  <tr className="border-t border-anthracite-800 bg-anthracite-900/30">
                    <td className="p-3 text-sm text-anthracite-400 font-medium">Preț</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-3 text-center">
                        <span className="text-lg font-bold text-gold-400">€{Number(product.price_eur).toLocaleString()}</span>
                      </td>
                    ))}
                  </tr>

                  {/* Brand Row */}
                  <tr className="border-t border-anthracite-800">
                    <td className="p-3 text-sm text-anthracite-400 font-medium">Brand</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-3 text-center">
                        <span className="text-sm text-anthracite-200">{product.brand_name || '—'}</span>
                      </td>
                    ))}
                  </tr>

                  {/* Category Row */}
                  <tr className="border-t border-anthracite-800 bg-anthracite-900/30">
                    <td className="p-3 text-sm text-anthracite-400 font-medium">Categorie</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-3 text-center">
                        <span className="text-sm text-anthracite-200">{categoryDisplayMap[product.category] || product.category}</span>
                      </td>
                    ))}
                  </tr>

                  {/* Condition Row */}
                  <tr className="border-t border-anthracite-800">
                    <td className="p-3 text-sm text-anthracite-400 font-medium">Stare</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-3 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          product.condition === 'new' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {product.condition === 'new' ? 'Nou' : 'Second-hand'}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Supplier Row */}
                  <tr className="border-t border-anthracite-800 bg-anthracite-900/30">
                    <td className="p-3 text-sm text-anthracite-400 font-medium">Furnizor</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-3 text-center">
                        {product.supplier ? (
                          <Link href={`/suppliers/${product.supplier.id}`} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                            {product.supplier.company_name}
                          </Link>
                        ) : (
                          <span className="text-sm text-anthracite-500">—</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Rating Row */}
                  <tr className="border-t border-anthracite-800">
                    <td className="p-3 text-sm text-anthracite-400 font-medium">Rating Mediu</td>
                    {products.map((product) => {
                      const supplierId = product.supplier?.id;
                      const stats = supplierId ? ratings[supplierId] : null;
                      return (
                        <td key={product.id} className="p-3 text-center">
                          {stats && stats.count > 0 ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                              <span className="text-sm font-semibold text-white">{stats.avgRating.toFixed(1)}</span>
                              <span className="text-xs text-anthracite-500">({stats.count})</span>
                            </div>
                          ) : (
                            <span className="text-xs text-anthracite-500">Fără recenzii</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Specs Rows */}
                  {allSpecKeys.length > 0 && (
                    <tr className="border-t border-anthracite-700">
                      <td colSpan={products.length + 1} className="p-3">
                        <span className="text-xs font-bold text-anthracite-300 uppercase tracking-wider">Specificații</span>
                      </td>
                    </tr>
                  )}
                  {allSpecKeys.map((key, idx) => (
                    <tr key={key} className={`border-t border-anthracite-800 ${idx % 2 === 0 ? 'bg-anthracite-900/30' : ''}`}>
                      <td className="p-3 text-sm text-anthracite-400 font-medium capitalize">{key}</td>
                      {products.map((product) => (
                        <td key={product.id} className="p-3 text-center">
                          <span className="text-sm text-anthracite-200">
                            {product.specs?.[key] || '—'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
