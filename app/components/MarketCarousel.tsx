'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import StockMarketWidget from './StockMarketWidget';
import TradingViewWidget from './TradingViewWidget';
import AIStocksTradingViewWidget from './AIStocksTradingViewWidget';

export interface MarketAnalysisData {
  summary: string;
  opportunities: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  symbols: string[];
  lastUpdated: string;
}

const slides = [
  { key: 'analysis', label: 'Market Analysis' },
  { key: 'aistocks', label: 'AI Stock Picks' },
  { key: 'tradingview', label: 'Market Data' },
] as const;

const SWIPE_THRESHOLD = 50;

export default function MarketCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisData, setAnalysisData] = useState<MarketAnalysisData | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const draggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragOffsetRef = useRef(0);
  const activeIndexRef = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const fetchMarketData = useCallback(async () => {
    try {
      setAnalysisLoading(true);
      setAnalysisError(null);
      const response = await fetch('/api/market-analysis');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch market analysis');
      }
      const data = await response.json();
      setAnalysisData({
        summary: data.summary,
        opportunities: data.opportunities,
        riskLevel: data.riskLevel,
        symbols: data.symbols || [],
        lastUpdated: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Failed to load market data');
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  const goTo = useCallback((index: number) => {
    setActiveIndex(index);
    activeIndexRef.current = index;
  }, []);
  const goPrev = useCallback(() => {
    setActiveIndex((i) => {
      const next = i === 0 ? slides.length - 1 : i - 1;
      activeIndexRef.current = next;
      return next;
    });
  }, []);
  const goNext = useCallback(() => {
    setActiveIndex((i) => {
      const next = i === slides.length - 1 ? 0 : i + 1;
      activeIndexRef.current = next;
      return next;
    });
  }, []);

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

    // Lock direction on first meaningful movement
    if (isHorizontalSwipe.current === null && (Math.abs(diffX) > 5 || Math.abs(diffY) > 5)) {
      isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
    }

    // Only apply horizontal drag offset
    if (isHorizontalSwipe.current) {
      const idx = activeIndexRef.current;
      const atStart = idx === 0 && diffX > 0;
      const atEnd = idx === slides.length - 1 && diffX < 0;
      const dampened = atStart || atEnd ? diffX * 0.3 : diffX;
      dragOffsetRef.current = dampened;
      setDragOffset(dampened);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);

    const offset = dragOffsetRef.current;

    if (isHorizontalSwipe.current) {
      if (offset < -SWIPE_THRESHOLD) {
        goNext();
      } else if (offset > SWIPE_THRESHOLD) {
        goPrev();
      }
    }

    dragOffsetRef.current = 0;
    setDragOffset(0);
    isHorizontalSwipe.current = null;
  }, [goNext, goPrev]);

  return (
    <div className="lg:col-span-2 relative">
      {/* Navigation arrows */}
      <button
        onClick={goPrev}
        aria-label="Previous slide"
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-200/80 dark:bg-zinc-700/80 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 transition-colors backdrop-blur-sm"
      >
        ‹
      </button>
      <button
        onClick={goNext}
        aria-label="Next slide"
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-200/80 dark:bg-zinc-700/80 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 transition-colors backdrop-blur-sm"
      >
        ›
      </button>

      {/* Slides */}
      <div
        className="overflow-hidden touch-pan-y"
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <div
          className={`flex ${isDragging ? '' : 'transition-transform duration-400 ease-in-out'}`}
          style={{ transform: `translateX(calc(-${activeIndex * 100}% + ${dragOffset}px))` }}
        >
          {slides.map((slide) => (
            <div key={slide.key} className="w-full flex-shrink-0">
              {slide.key === 'analysis' && <StockMarketWidget data={analysisData} loading={analysisLoading} error={analysisError} onRefresh={fetchMarketData} />}
              {slide.key === 'aistocks' && <AIStocksTradingViewWidget symbols={analysisData?.symbols ?? []} loading={analysisLoading} />}
              {slide.key === 'tradingview' && <TradingViewWidget />}
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators + labels */}
      <div className="flex items-center justify-center gap-3 mt-3">
        {slides.map((slide, index) => (
          <button
            key={slide.key}
            onClick={() => goTo(index)}
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
