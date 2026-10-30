'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Expand, Loader2, Package, X } from 'lucide-react';
import { useClientLocale } from '@/i18n/client';
import Modal from '@/components/Modal';

const Viewer360 = dynamic(() => import('@/components/Viewer360'), {
  loading: () => <Loader2 className="m-auto h-8 w-8 animate-spin text-gold-400" />,
});

interface ProductPhotoProps {
  productId: string;
  productName: string;
  images: string[];
  images360?: string[];
  imageIndex?: number;
  className?: string;
}

export default function ProductPhoto(props: ProductPhotoProps) {
  const [open, setOpen] = useState(false);
  const locale = useClientLocale();
  const { productName, images, imageIndex = 0, className = '' } = props;
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog"
      aria-label={`${locale === 'en' ? 'Open photos' : 'Deschide fotografiile'}: ${productName}`}
      className={`relative block w-full cursor-zoom-in overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400 ${className}`}>
      {images[imageIndex] ? <img src={images[imageIndex]} alt={productName} className="h-full w-full object-contain" loading="lazy" />
        : <Package className="m-auto h-12 w-12 text-anthracite-400" />}
      <span className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-lg border border-anthracite-600 bg-anthracite-950/90 px-2 py-1.5 text-xs text-white">
        <Expand className="h-4 w-4" aria-hidden="true" />{locale === 'en' ? 'Enlarge' : 'Mărește'}
      </span>
    </button>
    {open && <PhotoDialog {...props} onClose={() => setOpen(false)} />}
  </>;
}

function PhotoDialog({ productId, productName, images, images360, imageIndex = 0, onClose }: ProductPhotoProps & { onClose: () => void }) {
  const locale = useClientLocale();
  const en = locale === 'en';
  const [frames, setFrames] = useState(images360 || []);
  const [checking, setChecking] = useState(images360 === undefined);
  const [failed, setFailed] = useState(false);
  const [index, setIndex] = useState(imageIndex);
  const [mode, setMode] = useState<'gallery' | '360'>(images360 && images360.length >= 12 ? '360' : 'gallery');

  useEffect(() => {
    if (images360 !== undefined) return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/products/${encodeURIComponent(productId)}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Product unavailable');
        const data = await response.json();
        const available: string[] = Array.isArray(data.product?.images_360)
          ? data.product.images_360.filter((value: unknown): value is string => typeof value === 'string' && value.length > 0) : [];
        if (controller.signal.aborted) return;
        setFrames(available);
        if (available.length >= 12) setMode('360');
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        if (!controller.signal.aborted) setChecking(false);
      }
    }
    load();
    return () => controller.abort();
  }, [productId, images360]);

  const has360 = frames.length >= 12;
  const step = (delta: number) => setIndex(previous => (previous + delta + images.length) % images.length);
  return <Modal label={`${productName} — ${en ? 'photos' : 'fotografii'}`} onClose={onClose}>
    <section className="w-full rounded-2xl border border-anthracite-600 bg-anthracite-950 p-3 sm:p-5">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white sm:text-lg">{productName}</h2>
          <p className="mt-1 text-sm text-anthracite-300">{has360 ? (en ? 'Interactive 360° view' : 'Vizualizare interactivă 360°') : (en ? 'Product photos' : 'Fotografii echipament')}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={en ? 'Close photos' : 'Închide fotografiile'} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-anthracite-600 text-white hover:bg-anthracite-800">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>
      {has360 && <div className="mb-3 flex gap-2">
        {(['360', 'gallery'] as const).map(value => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} className={`min-h-11 rounded-lg border px-4 text-sm ${mode === value ? 'border-gold-400 text-gold-400' : 'border-anthracite-600 text-white'}`}>
          {value === '360' ? '360°' : (en ? 'Photos' : 'Fotografii')}
        </button>)}
      </div>}
      {checking ? <div className="flex min-h-64 items-center justify-center gap-3 text-anthracite-200" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-gold-400" aria-hidden="true" />{en ? 'Loading viewer…' : 'Se încarcă vizualizatorul…'}
      </div> : mode === '360' && has360 ? <Viewer360 images={frames} productName={productName} locale={locale} autoRotate className="!aspect-auto h-[min(55dvh,32rem)]" /> : <>
        <div className="flex h-[min(55dvh,32rem)] items-center justify-center rounded-xl bg-anthracite-900">
          {images[index] ? <img src={images[index]} alt={`${productName} — ${index + 1}/${images.length}`} className="h-full w-full object-contain" />
            : <p className="text-anthracite-300">{en ? 'No photos available.' : 'Nu sunt fotografii disponibile.'}</p>}
        </div>
        {images.length > 1 && <div className="mt-3 flex items-center justify-center gap-4">
          <button type="button" onClick={() => step(-1)} aria-label={en ? 'Previous photo' : 'Imaginea precedentă'} className="flex h-11 w-11 items-center justify-center rounded-lg border border-anthracite-600"><ChevronLeft aria-hidden="true" /></button>
          <span className="text-sm text-anthracite-200" aria-live="polite">{index + 1} / {images.length}</span>
          <button type="button" onClick={() => step(1)} aria-label={en ? 'Next photo' : 'Imaginea următoare'} className="flex h-11 w-11 items-center justify-center rounded-lg border border-anthracite-600"><ChevronRight aria-hidden="true" /></button>
        </div>}
      </>}
      {!checking && !has360 && <p className="mt-3 text-sm text-anthracite-300">{failed
        ? (en ? 'The 360° view could not be checked. Close and reopen to retry.' : 'Vizualizarea 360° nu a putut fi verificată. Închide și redeschide pentru a reîncerca.')
        : (en ? '360° view unavailable: the supplier has not provided a rotation photo sequence.' : 'Vizualizare 360° indisponibilă: furnizorul nu a publicat o serie de fotografii pentru rotire.')}</p>}
      <Link href={`/products/${productId}`} onClick={onClose} className="mt-3 inline-flex min-h-11 items-center text-sm text-gold-400 hover:underline">{en ? 'Product specifications and contact' : 'Specificații și contact furnizor'} →</Link>
    </section>
  </Modal>;
}
