'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Dumbbell, ArrowLeft, Upload, X, Loader2, CheckCircle, AlertCircle, ImagePlus } from 'lucide-react';

const categories = [
  { value: 'cardio', label: 'Cardio' },
  { value: 'strength', label: 'Forță' },
  { value: 'functional', label: 'Funcțional' },
  { value: 'accessories', label: 'Accesorii' },
  { value: 'wellness', label: 'Wellness & Spa' },
  { value: 'lockers', label: 'Vestiare' },
  { value: 'reception', label: 'Recepție' },
];

const brands = [
  'Life Fitness', 'Technogym', 'Matrix', 'Precor', 'Hammer Strength',
  'Cybex', 'Star Trac', 'Nautilus', 'Body-Solid', 'Rogue Fitness',
  'Eleiko', 'Assault Fitness', 'Concept2', 'Peloton', 'NordicTrack', 'Hoist',
  'Altul',
];

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: '',
    category: '',
    brand: '',
    condition: 'new' as 'new' | 'used',
    price: '',
    description: '',
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = 6 - imageFiles.length;
    const newFiles = Array.from(files).slice(0, remaining);

    // Validate each file
    for (const file of newFiles) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`Fișierul "${file.name}" depășește limita de 5MB.`);
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        setError(`Fișierul "${file.name}" nu este un format acceptat (JPG, PNG, WebP, GIF).`);
        return;
      }
    }

    setError('');
    setImageFiles(prev => [...prev, ...newFiles]);

    // Generate previews
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImagePreviews(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!form.name || !form.category || !form.brand || !form.price) {
      setError('Completează toate câmpurile obligatorii (nume, categorie, brand, preț).');
      return;
    }

    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) {
      setError('Prețul trebuie să fie un număr pozitiv.');
      return;
    }

    setLoading(true);

    try {
      // Upload images first via /api/upload
      const uploadedUrls: string[] = [];
      
      if (imageFiles.length > 0) {
        setUploadingImages(true);
        for (const file of imageFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', 'products');

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.url) {
              uploadedUrls.push(uploadData.url);
            }
          }
        }
        setUploadingImages(false);
      }

      // Save product with image URLs
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Eroare la salvarea produsului.');
        return;
      }

      setSuccess('Produs adăugat cu succes! Redirecționare...');

      // Redirect to products list after 1.5 seconds
      setTimeout(() => {
        router.push('/supplier/products');
      }, 1500);
    } catch (err) {
      setError('Eroare de conexiune. Verifică conexiunea la internet.');
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-white">Adaugă Produs Nou</h1>
            <p className="text-anthracite-400 text-sm mt-1">Completează detaliile produsului pentru a-l lista pe platformă.</p>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Informații Produs</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Nume Produs *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="ex: Life Fitness Integrity Series Treadmill"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Categorie *</label>
                  <select
                    className="input-field"
                    value={form.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Selectează categoria...</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Brand *</label>
                  <select
                    className="input-field"
                    value={form.brand}
                    onChange={(e) => updateField('brand', e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Selectează brandul...</option>
                    {brands.map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Condiție *</label>
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
                      🆕 Nou
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
                      ♻️ Second-hand
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Preț (EUR) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-anthracite-400 text-sm font-medium">€</span>
                    <input
                      type="number"
                      className="input-field pl-8"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => updateField('price', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Descriere</label>
                <textarea
                  className="input-field min-h-[120px] resize-y"
                  placeholder="Descrie produsul: specificații tehnice, stare, accesorii incluse..."
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Imagini Produs</h2>
            <p className="text-sm text-anthracite-400 mb-4">Adaugă până la 6 imagini (max 5MB fiecare). Prima imagine va fi cea principală.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {imagePreviews.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-anthracite-700">
                  <img src={img} alt={`Produs ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    disabled={loading}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 text-xs bg-gold-400 text-anthracite-950 px-2 py-0.5 rounded font-medium">
                      Principală
                    </span>
                  )}
                </div>
              ))}

              {imagePreviews.length < 6 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-anthracite-600 hover:border-gold-400/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <ImagePlus className="w-8 h-8 text-anthracite-500 mb-2" />
                  <span className="text-xs text-anthracite-400">Adaugă imagine</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={loading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <Link
              href="/supplier/products"
              className="btn-ghost px-6 py-3"
            >
              Anulează
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-3.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadingImages ? 'Se încarcă imaginile...' : 'Se salvează...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Publică Produsul
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
