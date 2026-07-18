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

function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  
  // Exact match
  if (t === q) return 100;
  // Starts with
  if (t.startsWith(q)) return 80;
  // Contains
  if (t.includes(q)) return 60;
  
  // Check words
  const words = t.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(q)) return 70;
    if (word.includes(q)) return 50;
    const maxDist = q.length <= 4 ? 1 : q.length <= 7 ? 2 : 3;
    const dist = levenshtein(q, word);
    if (dist <= maxDist) return 40 - dist * 5;
  }
  
  return 0;
}

interface Suggestion {
  type: 'product' | 'supplier' | 'category' | 'brand';
  id: string;
  text: string;
  subtitle?: string;
  image?: string | null;
  score: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const supabase = getSupabase();
    const suggestions: Suggestion[] = [];

    // Fetch products (only name, category, brand for speed)
    const { data: products } = await supabase
      .from('products')
      .select('id, name, category, brand_id, images, price_eur')
      .eq('status', 'active')
      .limit(200);

    // Fetch brands
    const { data: brands } = await supabase
      .from('brands')
      .select('id, name')
      .limit(50);

    // Fetch suppliers
    const { data: suppliers } = await supabase
      .from('supplier_profiles')
      .select('id, company_name, logo_url')
      .eq('status', 'approved')
      .limit(50);

    const brandMap = new Map((brands || []).map(b => [b.id, b.name]));

    // Score products
    if (products) {
      for (const p of products) {
        const brandName = brandMap.get(p.brand_id) || '';
        const nameScore = fuzzyScore(query, p.name);
        const brandScore = brandName ? fuzzyScore(query, brandName) * 0.8 : 0;
        const catScore = p.category ? fuzzyScore(query, p.category) * 0.7 : 0;
        const bestScore = Math.max(nameScore, brandScore, catScore);

        if (bestScore > 0) {
          suggestions.push({
            type: 'product',
            id: p.id,
            text: p.name,
            subtitle: [brandName, p.category, `${p.price_eur}€`].filter(Boolean).join(' · '),
            image: p.images?.[0] || null,
            score: bestScore,
          });
        }
      }
    }

    // Score suppliers
    if (suppliers) {
      for (const s of suppliers) {
        const score = fuzzyScore(query, s.company_name);
        if (score > 0) {
          suggestions.push({
            type: 'supplier',
            id: s.id,
            text: s.company_name,
            subtitle: 'Furnizor',
            image: s.logo_url,
            score: score * 0.9,
          });
        }
      }
    }

    // Score brands as category suggestions
    if (brands) {
      for (const b of brands) {
        const score = fuzzyScore(query, b.name);
        if (score > 0) {
          suggestions.push({
            type: 'brand',
            id: b.id,
            text: b.name,
            subtitle: 'Brand',
            image: null,
            score: score * 0.85,
          });
        }
      }
    }

    // Deduplicate categories and score them
    if (products) {
      const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
      for (const cat of categories) {
        const score = fuzzyScore(query, cat);
        if (score > 0) {
          suggestions.push({
            type: 'category',
            id: cat,
            text: cat,
            subtitle: 'Categorie',
            image: null,
            score: score * 0.75,
          });
        }
      }
    }

    // Sort by score and return top 5
    suggestions.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      suggestions: suggestions.slice(0, 5).map(({ score, ...rest }) => rest),
    });
  } catch (error) {
    console.error('Autocomplete API error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
