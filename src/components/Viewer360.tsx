'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCw, Loader2 } from 'lucide-react';

interface Viewer360Props {
  images: string[];
  productName: string;
  locale?: string;
}

export default function Viewer360({ images, productName, locale = 'ro' }: Viewer360Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [allLoaded, setAllLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const lastIndexRef = useRef(0);
  const frameCount = images.length;
  const sensitivity = 3; // pixels per frame

  // Preload all images for smooth rotation
  useEffect(() => {
    let loaded = 0;
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

  // Hide hint after first interaction or after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleStart = useCallback((clientX: number) => {
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

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => { if (isDragging) handleEnd(); };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientX);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    }
  };

  const onTouchEnd = () => handleEnd();

  // Loading progress
  const loadProgress = frameCount > 0 ? Math.round((loadedCount / frameCount) * 100) : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square bg-anthracite-900 rounded-2xl overflow-hidden select-none touch-none"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Loading overlay */}
      {!allLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-anthracite-900/90 z-20">
          <Loader2 className="w-8 h-8 text-gold-400 animate-spin mb-3" />
          <span className="text-sm text-anthracite-300">
            {locale === 'en' ? 'Loading 360° view...' : 'Se încarcă vizualizarea 360°...'} {loadProgress}%
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
      <img
        src={images[currentIndex]}
        alt={`${productName} - 360° view (frame ${currentIndex + 1}/${frameCount})`}
        className="w-full h-full object-contain"
        draggable={false}
      />

      {/* 360° badge */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-anthracite-900/80 backdrop-blur-sm border border-anthracite-700 rounded-lg px-2.5 py-1.5 z-10">
        <RotateCw className="w-3.5 h-3.5 text-gold-400" />
        <span className="text-xs font-medium text-white">360°</span>
      </div>

      {/* Frame counter */}
      <div className="absolute bottom-3 right-3 bg-anthracite-900/80 backdrop-blur-sm border border-anthracite-700 rounded-lg px-2.5 py-1.5 z-10">
        <span className="text-xs text-anthracite-300">
          {currentIndex + 1} / {frameCount}
        </span>
      </div>

      {/* Drag hint overlay */}
      {showHint && allLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="flex items-center gap-2 bg-anthracite-900/90 backdrop-blur-sm border border-anthracite-700 rounded-xl px-4 py-3 animate-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gold-400">
              <path d="M4 12h16M4 12l3-3M4 12l3 3M20 12l-3-3M20 12l-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm text-white font-medium">{locale === 'en' ? 'Drag to rotate' : 'Trage pentru a roti'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
