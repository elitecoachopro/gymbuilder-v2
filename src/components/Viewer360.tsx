'use client';

import { useUiText } from '@/i18n/useUiText';
import { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCw, Loader2, Play, Pause } from 'lucide-react';

interface Viewer360Props {
  images: string[];
  productName: string;
  locale?: string;
  autoRotate?: boolean;
  className?: string;
}

export default function Viewer360({ images, productName, locale = 'ro', autoRotate = false, className = '' }: Viewer360Props) {
  const ui = useUiText();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [allLoaded, setAllLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const lastIndexRef = useRef(0);
  const availableImages = images.filter(src => !failedImages.includes(src));
  const frameCount = availableImages.length;
  const sensitivity = 3; // pixels per frame

  // Preload all images for smooth rotation
  useEffect(() => {
    let loaded = 0;
    setLoadedCount(0);
    setAllLoaded(images.length === 0);
    setCurrentIndex(0);
    setFailedImages([]);
    const imgElements: HTMLImageElement[] = [];

    images.forEach((src) => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        setLoadedCount(loaded);
        if (loaded === images.length) {
          setAllLoaded(true);
        }
      };
      img.onerror = () => {
        setFailedImages(previous => [...previous, src]);
        loaded++;
        setLoadedCount(loaded);
        if (loaded === images.length) {
          setAllLoaded(true);
        }
      };
      img.src = src;
      imgElements.push(img);
    });

    return () => {
      imgElements.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [images]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setPlaying(autoRotate && !preference.matches);
    sync();
    preference.addEventListener('change', sync);
    return () => preference.removeEventListener('change', sync);
  }, [autoRotate]);

  useEffect(() => {
    const pauseWhenHidden = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, []);

  useEffect(() => {
    if (!playing || !allLoaded || frameCount < 2) return;
    const timer = window.setInterval(() => setCurrentIndex(index => (index + 1) % frameCount), 120);
    return () => window.clearInterval(timer);
  }, [playing, allLoaded, frameCount]);

  // Hide hint after first interaction or after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleStart = useCallback((clientX: number) => {
    setPlaying(false);
    setIsDragging(true);
    setShowHint(false);
    startXRef.current = clientX;
    lastIndexRef.current = currentIndex;
  }, [currentIndex]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    const deltaX = clientX - startXRef.current;
    const frameDelta = Math.round(deltaX / sensitivity);
    let newIndex = (lastIndexRef.current + frameDelta) % frameCount;
    if (newIndex < 0) newIndex += frameCount;
    setCurrentIndex(newIndex);
  }, [isDragging, frameCount, sensitivity]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0 || frameCount < 2 || !allLoaded) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    handleStart(event.clientX);
  };

  // Loading progress
  const loadProgress = frameCount > 0 ? Math.round((loadedCount / images.length) * 100) : 0;

  return (
    <div className={`relative w-full aspect-square bg-anthracite-900 rounded-2xl overflow-hidden select-none ${className}`}>
    <div
      ref={containerRef}
      role="slider" tabIndex={0} aria-label={`${productName} 360°`} aria-valuemin={1} aria-valuemax={Math.max(1, frameCount)} aria-valuenow={frameCount ? currentIndex % frameCount + 1 : 1}
      onKeyDown={event => { if (event.target === event.currentTarget && frameCount > 1 && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); setPlaying(false); setCurrentIndex(index => (index + (event.key === 'ArrowRight' ? 1 : -1) + frameCount) % frameCount); setShowHint(false); } }}
      onFocus={() => setPlaying(false)}
      className="h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400"
      onPointerDown={onPointerDown}
      onPointerMove={event => { if (event.isPrimary) handleMove(event.clientX); }}
      onPointerUp={handleEnd}
      onPointerCancel={handleEnd}
      onLostPointerCapture={handleEnd}
      style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'pan-y pinch-zoom' }}
    >
      {/* Loading overlay */}
      {!allLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-anthracite-900/90 z-20">
          <Loader2 className="w-8 h-8 text-gold-400 animate-spin mb-3" />
          <span className="text-sm text-anthracite-300">
            {ui(locale === 'en' ? 'Loading 360° view...' : 'Se încarcă vizualizarea 360°...')} {loadProgress}%
          </span>
          <div className="w-48 h-1.5 bg-anthracite-700 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gold-400 rounded-full transition-all duration-200"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Current frame */}
      {frameCount > 0 ? <img
        src={availableImages[currentIndex % frameCount]}
        alt={ui(`${productName} - 360° view (frame ${currentIndex + 1}/${frameCount})`)}
        className="w-full h-full object-contain"
        draggable={false}
      /> : <p role="status" className="flex h-full items-center justify-center p-6 text-anthracite-200">{locale === 'en' ? '360° photos could not be loaded.' : 'Fotografiile 360° nu au putut fi încărcate.'}</p>}

    </div>

      {/* 360° badge */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-anthracite-900/80 backdrop-blur-sm border border-anthracite-700 rounded-lg px-2.5 py-1.5 z-10">
        <RotateCw className="w-3.5 h-3.5 text-gold-400" />
        <span className="text-xs font-medium text-white">360°</span>
      </div>

      <div className="absolute bottom-3 left-3 flex gap-2 z-10">
        {[{ label: 'Imaginea precedentă', delta: -1, icon: '←' }, { label: 'Imaginea următoare', delta: 1, icon: '→' }].map(action => <button key={action.label} type="button" aria-label={ui(action.label)} disabled={frameCount < 2 || !allLoaded} className="min-h-11 min-w-11 rounded-lg bg-anthracite-900/90 border border-anthracite-600 text-white" onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); setPlaying(false); setCurrentIndex(index => (index + action.delta + frameCount) % frameCount); setShowHint(false); }}>{action.icon}</button>)}
        <button type="button" aria-label={locale === 'en' ? (playing ? 'Pause rotation' : 'Start rotation') : (playing ? 'Oprește rotirea' : 'Pornește rotirea')} aria-pressed={playing}
          disabled={frameCount < 2 || !allLoaded} onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); setPlaying(value => !value); setShowHint(false); }}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-anthracite-600 bg-anthracite-900/90 text-white disabled:opacity-40">
          {playing ? <Pause className="h-5 w-5" aria-hidden="true" /> : <Play className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {/* Frame counter */}
      <div className="absolute bottom-3 right-3 bg-anthracite-900/80 backdrop-blur-sm border border-anthracite-700 rounded-lg px-2.5 py-1.5 z-10">
        <span className="text-xs text-anthracite-300">
          {frameCount ? currentIndex % frameCount + 1 : 0} / {frameCount}
        </span>
      </div>

      {/* Drag hint overlay */}
      {showHint && allLoaded && frameCount > 1 && !playing && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="flex items-center gap-2 bg-anthracite-900/90 backdrop-blur-sm border border-anthracite-700 rounded-xl px-4 py-3 motion-safe:animate-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gold-400">
              <path d="M4 12h16M4 12l3-3M4 12l3 3M20 12l-3-3M20 12l-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm text-white font-medium">{ui(locale === 'en' ? 'Drag to rotate' : 'Trage pentru a roti')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
