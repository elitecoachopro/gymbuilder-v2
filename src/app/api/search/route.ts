import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const dynamic = 'force-dynamic';

/**
 * Levenshtein distance for fuzzy matching
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Check if a word fuzzy-matches a target (tolerance based on word length)
 */
function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return true;
  // Split target into words and check each
  const words = t.split(/\s+/);
  for (const word of words) {
    const maxDist = q.length <= 4 ? 1 : q.length <= 7 ? 2 : 3;
    if (levenshtein(q, word) <= maxDist) return true;
    // Also check if query is a prefix with tolerance
    if (word.startsWith(q.substring(0, Math.max(2, q.length - 1)))) return true;
  }
  return false;
}

/**
 * Calculate relevance score (higher = more relevant)
 */
function calculateRelevance(query: string, item: {
  name: string;
  description: string | null;
  category: string | null;
  brand_name: string | null;
  supplier_name: string | null;
}): number {
  const q = query.toLowerCase();
  const terms = q.split(/\s+/).filter(t => t.length > 1);
  let score = 0;

  for (const term of terms) {
    const name = (item.name || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();
    const brand = (item.brand_name || '').toLowerCase();
    const supplier = (item.supplier_name || '').toLowerCase();

    // Exact match in name (highest priority)
    if (name === q) score += 100;
    // Name starts with query
    else if (name.startsWith(term)) score += 50;
    // Exact word match in name
    else if (name.split(/\s+/).includes(term)) score += 40;
    // Partial match in name
    else if (name.includes(term)) score += 30;
    // Fuzzy match in name
    else if (fuzzyMatch(term, name)) score += 20;

    // Brand match
    if (brand.includes(term)) score += 25;
    else if (fuzzyMatch(term, brand)) score += 15;

    // Category match
    if (cat.includes(term)) score += 20;
    else if (fuzzyMatch(term, cat)) score += 10;

    // Supplier match
    if (supplier.includes(term)) score += 15;
    else if (fuzzyMatch(term, supplier)) score += 8;

    // Description match (lowest priority)
    if (desc.includes(term)) score += 10;
    else if (fuzzyMatch(term, desc.substring(0, 200))) score += 5;
  }

  return score;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const type = searchParams.get('type') || 'all'; // 'all', 'products', 'suppliers'

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [], total: 0 });
    }

    const supabase = getSupabase();
    const results: any[] = [];

    if (type === 'all' || type === 'products') {
      // Fetch products with broad search
      const { data: products } = await supabase
        .from('products')
        .select('id, name, category, brand_id, condition, price_eur, description, images, supplier_id, status')
        .eq('status', 'active')
        .limit(200);

      if (products && products.length > 0) {
        // Get brand names
        const brandIds = Array.from(new Set(products.map(p => p.brand_id).filter(Boolean)));
        let brandMap = new Map<string, string>();
        if (brandIds.length > 0) {
          const { data: brands } = await supabase
            .from('brands')
            .select('id, name')
            .in('id', brandIds);
          brandMap = new Map((brands || []).map(b => [b.id, b.name]));
        }

        // Get supplier names
        const supplierIds = Array.from(new Set(products.map(p => p.supplier_id).filter(Boolean)));
        let supplierMap = new Map<string, string>();
        if (supplierIds.length > 0) {
          const { data: suppliers } = await supabase
            .from('supplier_profiles')
            .select('id, company_name')
            .in('id', supplierIds);
          supplierMap = new Map((suppliers || []).map(s => [s.id, s.company_name]));
        }

        // Score and filter products
        for (const product of products) {
          const brandName = brandMap.get(product.brand_id) || null;
          const supplierName = supplierMap.get(product.supplier_id) || null;

          const score = calculateRelevance(query, {
            name: product.name,
            description: product.description,
            category: product.category,
            brand_name: brandName,
            supplier_name: supplierName,
          });

          if (score > 0) {
            results.push({
              type: 'product',
              id: product.id,
              name: product.name,
              category: product.category,
              brand: brandName,
              supplier: supplierName,
              price_eur: product.price_eur,
              condition: product.condition,
              image: product.images?.[0] || null,
              score,
            });
          }
        }
      }
    }

    if (type === 'all' || type === 'suppliers') {
      // Fetch suppliers
      const { data: suppliers } = await supabase
        .from('supplier_profiles')
        .select('id, company_name, description, country, city, logo_url')
        .eq('status', 'approved')
        .limit(100);

      if (suppliers) {
        for (const supplier of suppliers) {
          const score = calculateRelevance(query, {
            name: supplier.company_name,
            description: supplier.description,
            category: null,
            brand_name: null,
            supplier_name: supplier.company_name,
          });

          if (score > 0) {
            results.push({
              type: 'supplier',
              id: supplier.id,
              name: supplier.company_name,
              description: supplier.description?.substring(0, 100) || null,
              location: [supplier.city, supplier.country].filter(Boolean).join(', '),
              image: supplier.logo_url,
              score,
            });
          }
        }
      }
    }

    // Sort by relevance score (highest first)
    results.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      results: results.slice(0, limit),
      total: results.length,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ results: [], total: 0 }, { status: 500 });
  }
}
