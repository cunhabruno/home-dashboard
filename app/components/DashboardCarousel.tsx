'use client';

import { useState, useCallback, useRef, useEffect, ReactNode } from 'react';

interface CarouselSlide {
  key: string;
  label: string;
  content: ReactNode;
}

interface DashboardCarouselProps {
  slides: CarouselSlide[];
  autoPlayInterval?: number; // in ms, default 10s
}

const SWIPE_THRESHOLD = 50;

export default function DashboardCarousel({ slides, autoPlayInterval = 10000 }: DashboardCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const draggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragOffsetRef = useRef(0);
  const activeIndexRef = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const autoPlayTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const userInteracted = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((index: number) => {
    setActiveIndex(index);
    activeIndexRef.current = index;
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((i) => {
      const next = (i + 1) % slides.length;
      activeIndexRef.current = next;
      return next;
    });
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => {
      const next = (i - 1 + slides.length) % slides.length;
      activeIndexRef.current = next;
      return next;
    });
  }, [slides.length]);

  // Auto-play logic
  const startAutoPlay = useCallback(() => {
    if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    autoPlayTimer.current = setInterval(() => {
      goNext();
    }, autoPlayInterval);
  }, [autoPlayInterval, goNext]);

  const pauseAutoPlay = useCallback(() => {
    if (autoPlayTimer.current) {
      clearInterval(autoPlayTimer.current);
      autoPlayTimer.current = null;
    }
  }, []);

  // On user interaction, pause auto-play and resume after 30s
  const handleUserInteraction = useCallback(() => {
    userInteracted.current = true;
    pauseAutoPlay();
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      userInteracted.current = false;
      startAutoPlay();
    }, 30000);
  }, [pauseAutoPlay, startAutoPlay]);

  useEffect(() => {
    startAutoPlay();
    return () => {
      pauseAutoPlay();
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [startAutoPlay, pauseAutoPlay]);

  // Swipe / drag handling
  const getClientX = (e: React.TouchEvent | React.MouseEvent) =>
    'touches' in e ? e.touches[0].clientX : e.clientX;
  const getClientY = (e: React.TouchEvent | React.MouseEvent) =>
    'touches' in e ? e.touches[0].clientY : e.clientY;

  const handleDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    draggingRef.current = true;
    setIsDragging(true);
    dragStartX.current = getClientX(e);
    dragStartY.current = getClientY(e);
    dragOffsetRef.current = 0;
    isHorizontalSwipe.current = null;
  }, []);

  const handleDragMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!draggingRef.current) return;

    const currentX = getClientX(e);
    const currentY = getClientY(e);
    const diffX = currentX - dragStartX.current;
    const diffY = currentY - dragStartY.current;

    if (isHorizontalSwipe.current === null && (Math.abs(diffX) > 5 || Math.abs(diffY) > 5)) {
      isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
    }

    if (isHorizontalSwipe.current) {
      dragOffsetRef.current = diffX;
      setDragOffset(diffX);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);

    const offset = dragOffsetRef.current;

    if (isHorizontalSwipe.current) {
      handleUserInteraction();
      if (offset < -SWIPE_THRESHOLD) {
        goNext();
      } else if (offset > SWIPE_THRESHOLD) {
        goPrev();
      }
    }

    dragOffsetRef.current = 0;
    setDragOffset(0);
    isHorizontalSwipe.current = null;
  }, [goNext, goPrev, handleUserInteraction]);

  const handleNavClick = useCallback((index: number) => {
    handleUserInteraction();
    goTo(index);
  }, [goTo, handleUserInteraction]);

  const handlePrevClick = useCallback(() => {
    handleUserInteraction();
    goPrev();
  }, [goPrev, handleUserInteraction]);

  const handleNextClick = useCallback(() => {
    handleUserInteraction();
    goNext();
  }, [goNext, handleUserInteraction]);

  // Progress bar width for auto-play
  const [progress, setProgress] = useState(0);
  const progressAnimRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const progressStartRef = useRef(0);

  useEffect(() => {
    progressStartRef.current = Date.now();

    const animate = () => {
      if (userInteracted.current) {
        setProgress(0);
        return;
      }
      const elapsed = Date.now() - progressStartRef.current;
      const pct = Math.min((elapsed / autoPlayInterval) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        progressAnimRef.current = requestAnimationFrame(animate);
      }
    };
    progressAnimRef.current = requestAnimationFrame(animate);

    return () => {
      if (progressAnimRef.current) cancelAnimationFrame(progressAnimRef.current);
    };
  }, [activeIndex, autoPlayInterval]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Slides */}
      <div
        className="flex-1 min-h-0 overflow-hidden touch-pan-y"
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <div
          className={`flex h-full ${isDragging ? '' : 'transition-transform duration-500 ease-in-out'}`}
          style={{ transform: `translateX(calc(-${activeIndex * 100}% + ${dragOffset}px))` }}
        >
          {slides.map((slide) => (
            <div key={slide.key} className="w-full flex-shrink-0 h-full px-3">
              {slide.content}
            </div>
          ))}
        </div>
      </div>

      {/* Auto-play progress bar */}
      <div className="h-0.5 bg-zinc-200 dark:bg-zinc-800 mx-4 mt-1 rounded-full overflow-hidden flex-shrink-0">
        <div
          className="h-full bg-blue-500/60 rounded-full transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Dot indicators + labels */}
      <div className="flex items-center justify-center gap-2 mt-1 pb-1 flex-wrap flex-shrink-0">
        {slides.map((slide, index) => (
          <button
            key={slide.key}
            onClick={() => handleNavClick(index)}
            aria-label={`Go to ${slide.label}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              index === activeIndex
                ? 'bg-blue-500/20 text-blue-500 dark:text-blue-400'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                index === activeIndex ? 'bg-blue-500' : 'bg-zinc-400 dark:bg-zinc-500'
              }`}
            />
            {slide.label}
          </button>
        ))}
      </div>
    </div>
  );
}
