'use client';

import { createContext, memo, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Crown, Clock3, Zap, Loader2, Megaphone, Package, Pause, Play } from 'lucide-react';
import { useClientLocale } from '@/i18n/client';
import { formatCatalogPrice } from '@/lib/catalog-price';
import { promotionCountdown, SUPER_PRICE_HOURS, type PromotionListing, type PromotionResponse } from '@/lib/promotions';
import ProductPhoto from '@/components/ProductPhoto';

export default function PromotedOffers() {
  const locale = useClientLocale();
  const en = locale === 'en';
  const [data, setData] = useState<PromotionResponse | null>(null);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const pending = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    pending.current?.abort();
    const controller = new AbortController();pending.current=controller;
    try {
      const response = await fetch('/api/promotions',{cache:'no-store',signal:controller.signal});
      if (!response.ok) throw new Error('Promotions unavailable');
      const next: PromotionResponse = await response.json();
      if (!controller.signal.aborted) {setData(next);setError(false);setNow(Date.now());}
    } catch {if (!controller.signal.aborted) setError(true);}
  },[]);
  useEffect(()=>{
    void load();
    const refresh=window.setInterval(load,30000);
    window.addEventListener('focus',load);
    return ()=>{pending.current?.abort();window.clearInterval(refresh);window.removeEventListener('focus',load);};
  },[load]);
  useEffect(() => {
    if (!data) return;
    const ends = [data.ofertaZilei, ...data.oferteleSaptamanii, ...(data.superPret ?? []), ...Object.values(data.catalogSelections || {}).flat()].filter((offer): offer is PromotionListing => !!offer)
      .map(offer => Date.parse(offer.ends_at)).filter(end => end > now);
    if (!ends.length) return;
    const timer = window.setTimeout(() => {setNow(Date.now());void load();}, Math.min(Math.max(1, Math.min(...ends) - Date.now() + 1), 2147483647));
    return () => window.clearTimeout(timer);
  }, [data, now, load]);
  const daily = data?.ofertaZilei && Date.parse(data.ofertaZilei.ends_at) > now ? data.ofertaZilei : null;
  const valid = (offers: PromotionListing[] = []) => offers.filter(offer => Date.parse(offer.ends_at) > now);
  const paidWeekly = valid(data?.oferteleSaptamanii);
  const paidSuper = valid(data?.superPret);
  const weekly = paidWeekly.length ? paidWeekly : valid(data?.catalogSelections?.oferteleSaptamanii);
  const superPrices = paidSuper.length ? paidSuper.slice(0,1) : valid(data?.catalogSelections?.superPret);
  const superPrice = superPrices[0];
  const rotatingDumbbells = !paidSuper.length && superPrices.length > 1;
  const dailyChoice = daily || valid(data?.catalogSelections?.ofertaZilei)[0];
  const catalogCopy = en ? 'Equipment from our published catalog, rotating automatically. Catalog prices are shown; no discount is implied.' : 'Echipamente din catalogul publicat, în rotație automată. Afișăm prețul din catalog, fără reduceri presupuse.';
  const empty = (kind: 'daily' | 'weekly' | 'super') => {
    const unavailableMessage = en ? 'Promotions are temporarily unavailable.' : 'Promovările nu pot fi încărcate momentan.';
    const emptyMessage = kind === 'super' ? (en ? 'No Super price offers at the moment.' : 'Nicio ofertă Super preț activă momentan.') : kind === 'daily'
      ? (en ? 'No promoted daily offer at the moment.' : 'Nicio ofertă a zilei promovată momentan.')
      : (en ? 'No weekly offers are currently promoted.' : 'Nicio ofertă promovată în această săptămână.');
    return <div className="rounded-2xl border border-anthracite-700 bg-anthracite-900 p-8 text-center sm:p-12">
      {!data && !error ? <div role="status" className="flex items-center justify-center gap-3 text-anthracite-300"><Loader2 className="h-6 w-6 animate-spin text-gold-400" aria-hidden="true" />{en ? 'Loading promotions…' : 'Se încarcă promovările…'}</div>
        : <><Package className="mx-auto mb-3 h-10 w-10 text-anthracite-400" aria-hidden="true" /><p className="text-anthracite-200">{error || data?.catalogUnavailable ? unavailableMessage : emptyMessage}</p>
        <Link href="/supplier/dashboard#promotions" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-gold-400 hover:underline">{en ? 'Promote your equipment' : 'Promovează-ți echipamentul'}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></>}
    </div>;
  };
  return <div className="pb-16">
    <section id="super-pret" aria-labelledby="super-price-heading" className="mx-auto max-w-7xl scroll-mt-[calc(var(--app-header-height)+1rem)] px-4 py-12 sm:py-16">
      <div className="mb-6 flex items-start gap-3"><Zap className="mt-1 h-6 w-6 shrink-0 text-gold-400" aria-hidden="true" /><div>
        <h2 id="super-price-heading" className="text-2xl font-bold text-white sm:text-3xl">{en ? 'Super price' : 'Super preț'}</h2>
        <p className="mt-2 text-sm text-anthracite-300">{rotatingDumbbells ? (en ? 'Dumbbells from the catalog, rotating every 6 seconds. Pause to inspect an item. Published prices; no discount is implied. Paid promotions have priority.' : 'Gantere din catalog, în rotație la 6 secunde. Oprește rularea pentru a analiza un produs. Prețuri publicate, fără reduceri presupuse. Promovările plătite au prioritate.') : (en ? 'One exclusive product for 12 hours. A new selection appears when its display period ends.' : 'Un singur produs exclusiv timp de 12 ore. Selecția se schimbă la încheierea perioadei de afișare.')}</p>
      </div></div>
      {rotatingDumbbells ? <OfferCarousel offers={superPrices} label={en ? 'Super price dumbbells' : 'Gantere Super Preț'} featured superPrice countdown /> : superPrice ? <ExclusiveOffer key={superPrice.id} offer={superPrice} superPrice /> : empty('super')}
    </section>
    <section id="oferta-zilei" aria-labelledby="daily-offer-heading" className="scroll-mt-[calc(var(--app-header-height)+1rem)] bg-anthracite-900/50 px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-start gap-3"><Crown className="mt-1 h-6 w-6 shrink-0 text-gold-400" aria-hidden="true" /><div>
          <h2 id="daily-offer-heading" className="text-2xl font-bold text-white sm:text-3xl">{en ? 'Offer of the day' : 'Oferta zilei'}</h2>
          <p className="mt-2 text-sm text-anthracite-300">{en ? 'One exclusive product for 24 hours. The countdown shows the remaining display time.' : 'Un singur produs exclusiv timp de 24 de ore. Cronometrul arată timpul de afișare rămas.'}</p>
        </div></div>
        {dailyChoice ? <ExclusiveOffer key={dailyChoice.id} offer={dailyChoice} /> : empty('daily')}
      </div>
    </section>
    <section id="ofertele-saptamanii" aria-labelledby="weekly-offers-heading" className="mx-auto max-w-7xl scroll-mt-[calc(var(--app-header-height)+1rem)] px-4 pt-12 sm:pt-16">
      <div className="mb-6 flex items-start gap-3"><Megaphone className="mt-1 h-6 w-6 shrink-0 text-gold-400" aria-hidden="true" /><div>
        <h2 id="weekly-offers-heading" className="text-2xl font-bold text-white sm:text-3xl">{en ? 'Offers of the week' : 'Ofertele săptămânii'}</h2>
        <p className="mt-2 text-sm text-anthracite-300">{weekly.some(offer=>offer.selection==='catalog') ? catalogCopy : en ? 'Paid promotions for 7 days. Offers rotate automatically; you can pause rotation at any time.' : 'Oferte promovate timp de 7 zile. Ofertele rulează automat; poți opri rularea oricând.'}</p>
      </div></div>
      {weekly.length ? <OfferCarousel offers={weekly} label={en ? 'Weekly offers' : 'Ofertele săptămânii'} /> : empty('weekly')}
    </section>
  </div>;
}

const PromotionClock = createContext(0);

function ExclusiveOffer({offer,superPrice=false}:{offer:PromotionListing;superPrice?:boolean}) {
  const [now,setNow]=useState(()=>Date.now());
  useEffect(()=>{
    const timer=window.setInterval(()=>setNow(Date.now()),1000);
    return ()=>window.clearInterval(timer);
  },[]);
  if (Date.parse(offer.ends_at)<=now) return null;
  return <PromotionClock.Provider value={now}><PromotionCard offer={offer} featured superPrice={superPrice} countdown /></PromotionClock.Provider>;
}

const PromotionCard = memo(function PromotionCard({ offer, featured = false, superPrice = false, countdown = false }: { offer: PromotionListing; featured?: boolean; superPrice?: boolean; countdown?: boolean }) {
  const locale = useClientLocale();
  const en = locale === 'en';
  let promotionBadge = en ? 'Promoted · 7 days' : 'Promovat · 7 zile';
  if (featured) promotionBadge = en ? 'Premium promotion · 24 hours' : 'Promovare premium · 24 de ore';
  if (superPrice) promotionBadge = en ? `Super price · ${SUPER_PRICE_HOURS} hours` : `Super preț · ${SUPER_PRICE_HOURS} ore`;
  const catalog = offer.selection === 'catalog';
  if (catalog) promotionBadge = `${en ? 'Catalog selection' : 'Selecție din catalog'}${countdown ? ` · ${superPrice ? 12 : 24} ${en ? 'hours' : 'ore'}` : ''}`;
  const href = offer.product_id ? `/products/${offer.product_id}` : `/suppliers/${offer.supplier_id}`;
  const image = offer.image_url || offer.product?.images[0];
  const galleryImages = image ? [image, ...(offer.product?.images || []).filter(photo => photo !== image)] : [];
  return <article className={`h-full overflow-hidden rounded-2xl border bg-anthracite-800 ${featured ? 'border-gold-400/40 md:grid md:grid-cols-2' : 'flex flex-col border-anthracite-700'}`}>
    <div className={`flex items-center justify-center bg-anthracite-900 ${featured ? 'h-72 md:h-full md:min-h-80' : 'h-52'}`}>
      {offer.product && image ? <ProductPhoto productId={offer.product.id} productName={offer.product.name} images={galleryImages} className="h-full" />
        : image ? <Link href={href} className="block h-full w-full"><img src={image} alt={offer.title} className="h-full w-full object-contain" loading="lazy" /></Link>
        : <Package className="h-16 w-16 text-anthracite-400" aria-hidden="true" />}
    </div>
    <div className={`flex flex-1 flex-col ${featured ? 'p-6 sm:p-8' : 'p-5'}`}>
      <span className="mb-3 w-fit rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1 text-xs font-semibold text-gold-400">{promotionBadge}</span>
      <h3 className={`font-semibold text-white ${featured ? 'text-2xl' : 'text-lg'}`}><Link href={href} className="hover:text-gold-400">{offer.title}</Link></h3>
      <p className="mt-2 text-sm text-anthracite-300">{offer.brand_name && offer.brand_name !== offer.supplier?.company_name ? `${offer.brand_name} · ` : ''}{offer.supplier?.company_name}{offer.supplier?.country ? ` · ${offer.supplier.country}` : ''}</p>
      {offer.description && <p className={`mt-3 text-sm leading-relaxed text-anthracite-200 ${featured ? '' : 'line-clamp-3'}`}>{offer.description}</p>}
      <p className="my-4 text-2xl font-bold text-gold-400">{formatCatalogPrice(offer.price_eur, locale, catalog ? offer : undefined)}</p>
      {superPrice && <>
        <p className="mb-3 text-sm text-anthracite-200">{offer.product?.condition === 'used' ? (en ? 'Second-hand equipment' : 'Echipament second-hand') : (en ? 'New equipment' : 'Echipament nou')}</p>
      </>}
      {countdown && <PromotionCountdown endsAt={offer.ends_at} catalog={catalog} />}
      {(!catalog || countdown) && <p className="mb-4 text-xs text-anthracite-300">{catalog ? (en ? 'Displayed until: ' : 'Afișat până la: ') : (en ? 'Promotion ends: ' : 'Promovat până la: ')}<time dateTime={offer.ends_at}>{new Date(offer.ends_at).toLocaleString(en ? 'en-GB' : 'ro-RO', { dateStyle: 'short', timeStyle: 'short' })}</time></p>}
      <Link href={href} className="mt-auto inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-gold-400 px-5 py-2 text-sm font-bold text-anthracite-950 hover:bg-gold-300">{catalog ? (en ? 'View equipment' : 'Vezi echipamentul') : (en ? 'View offer' : 'Vezi oferta')}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
    </div>
  </article>;
});

function PromotionCountdown({ endsAt, catalog }: { endsAt: string; catalog: boolean }) {
  const en = useClientLocale() === 'en';
  const now = useContext(PromotionClock);
  return (
        <div role="timer" aria-live="off" aria-label={en ? 'Time remaining' : 'Timp rămas'} className="mb-4 rounded-xl border border-gold-400/30 bg-gold-400/10 p-3 text-gold-300">
          <span className="flex items-center gap-2 text-xs"><Clock3 className="h-4 w-4" aria-hidden="true" />{catalog ? (en ? 'Catalog selection expires in' : 'Selecția din catalog expiră în') : (en ? 'Ends in' : 'Expiră în')}</span>
          <span className="mt-1 block font-mono text-2xl font-bold tabular-nums">{promotionCountdown(endsAt, now)}</span>
          <span className="text-xs">{en ? 'hours : minutes : seconds' : 'ore : minute : secunde'}</span>
        </div>
  );
}

function CarouselClock({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [now, setNow] = useState(()=>Date.now());
  useEffect(()=>{
    if (!enabled) return;
    const timer=window.setInterval(()=>setNow(Date.now()),1000);
    return ()=>window.clearInterval(timer);
  },[enabled]);
  return <PromotionClock.Provider value={now}>{children}</PromotionClock.Provider>;
}

function OfferCarousel({ offers, label, featured = false, superPrice = false, countdown = false }: { offers: PromotionListing[]; label: string; featured?: boolean; superPrice?: boolean; countdown?: boolean }) {
  const en = useClientLocale() === 'en';
  const track = useRef<HTMLDivElement>(null);
  const carousel = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [inViewport, setInViewport] = useState(false);
  useEffect(()=>{
    const element = carousel.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries=>setInViewport(entries.some(entry=>entry.isIntersecting)));
    observer.observe(element);
    return ()=>observer.disconnect();
  },[]);
  const [position, setPosition] = useState({ first: 0, visible: 1 });
  const move = useCallback((direction: number) => {
    const element = track.current;
    const card = element?.firstElementChild as HTMLElement | null;
    if (!element || !card) return;
    const max = element.scrollWidth - element.clientWidth;
    const step = card.getBoundingClientRect().width + 16;
    const left = direction > 0 ? (element.scrollLeft >= max - 2 ? 0 : Math.min(max, element.scrollLeft + step)) : (element.scrollLeft <= 2 ? max : Math.max(0, element.scrollLeft - step));
    element.scrollTo({ left, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, []);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stop = () => { if (preference.matches) setPlaying(false); };
    stop();
    preference.addEventListener('change', stop);
    return () => preference.removeEventListener('change', stop);
  }, []);
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const measure = () => {
      const card = element.firstElementChild as HTMLElement | null;
      if (!card) return;
      const step = card.getBoundingClientRect().width + 16;
      const first = Math.round(element.scrollLeft / step);
      const visible = Math.max(1, Math.round((element.clientWidth + 16) / step));
      setPosition(previous => previous.first === first && previous.visible === visible ? previous : { first, visible });
    };
    measure();
    const observer = new ResizeObserver(measure); observer.observe(element);
    element.addEventListener('scroll', measure, { passive: true });
    return () => { observer.disconnect(); element.removeEventListener('scroll', measure); };
  }, [offers.length]);
  useEffect(() => {
    if (!playing || hovered || !inViewport || offers.length <= position.visible) return;
    const timer = window.setInterval(() => { if (!document.hidden) move(1); }, 6000);
    return () => window.clearInterval(timer);
  }, [playing, hovered, inViewport, offers.length, position.visible, move]);
  useEffect(() => {
    const element = carousel.current;
    const pauseForFocus = (event: FocusEvent) => {
      if (!(event.target as HTMLElement).closest('[data-carousel-playback]')) setPlaying(false);
    };
    element?.addEventListener('focusin', pauseForFocus);
    return () => element?.removeEventListener('focusin', pauseForFocus);
  }, []);
  const hasMore = offers.length > position.visible;
  return <CarouselClock enabled={countdown}><div ref={carousel} role="region" aria-roledescription={en ? 'carousel' : 'carusel'} aria-label={label}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-anthracite-300" aria-live={playing ? 'off' : 'polite'}>{position.first + 1}–{Math.min(offers.length, position.first + position.visible)} / {offers.length} {en ? 'offers' : 'oferte'}</p>
      <div className="flex items-center gap-2">
        <button type="button" disabled={!hasMore} onClick={() => { setPlaying(false); move(-1); }} aria-label={en ? 'Previous offers' : 'Ofertele precedente'} className="flex h-11 w-11 items-center justify-center rounded-lg border border-anthracite-600 text-white hover:border-gold-400 disabled:opacity-40"><ChevronLeft aria-hidden="true" /></button>
        <button type="button" data-carousel-playback disabled={!hasMore} aria-pressed={playing} onClick={() => setPlaying(value => !value)} className="flex min-h-11 items-center gap-2 rounded-lg border border-anthracite-600 px-3 text-sm text-white hover:border-gold-400 disabled:opacity-40">{playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}{en ? (playing ? 'Pause rotation' : 'Start rotation') : (playing ? 'Oprește rularea' : 'Pornește rularea')}</button>
        <button type="button" disabled={!hasMore} onClick={() => { setPlaying(false); move(1); }} aria-label={en ? 'Next offers' : 'Ofertele următoare'} className="flex h-11 w-11 items-center justify-center rounded-lg border border-anthracite-600 text-white hover:border-gold-400 disabled:opacity-40"><ChevronRight aria-hidden="true" /></button>
      </div>
    </div>
    <div ref={track} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)} onPointerDown={() => setPlaying(false)} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
      {offers.map((offer, index) => <div key={offer.id} role="group" aria-roledescription={en ? 'slide' : 'diapozitiv'} aria-label={`${index + 1} / ${offers.length}`} className={`min-w-0 shrink-0 basis-full snap-start ${featured ? '' : 'sm:basis-[calc(50%_-_0.5rem)] lg:basis-[calc(33.333%_-_0.667rem)]'}`}><PromotionCard offer={offer} featured={featured} superPrice={superPrice} countdown={countdown} /></div>)}
    </div>
  </div></CarouselClock>;
}
