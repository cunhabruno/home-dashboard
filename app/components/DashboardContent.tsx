'use client';

import { useState, useCallback, useEffect } from 'react';
import DashboardCarousel from './DashboardCarousel';
import WeatherWidget from './WeatherWidget';
import StockMarketWidget from './StockMarketWidget';
import AIStocksTradingViewWidget from './AIStocksTradingViewWidget';
import TradingViewWidget from './TradingViewWidget';
import NewsSentimentWidget from './NewsSentimentWidget';
import type { MarketAnalysisData } from './MarketCarousel';

export default function DashboardContent() {
  const [analysisData, setAnalysisData] = useState<MarketAnalysisData | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

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

  const slides = [
    {
      key: 'weather',
      label: 'Weather',
      content: <WeatherWidget />,
    },
    {
      key: 'analysis',
      label: 'Market Analysis',
      content: (
        <StockMarketWidget
          data={analysisData}
          loading={analysisLoading}
          error={analysisError}
          onRefresh={fetchMarketData}
        />
      ),
    },
    {
      key: 'aistocks',
      label: 'AI Stock Picks',
      content: (
        <AIStocksTradingViewWidget
          symbols={analysisData?.symbols ?? []}
          loading={analysisLoading}
        />
      ),
    },
    {
      key: 'tradingview',
      label: 'Market Data',
      content: <TradingViewWidget />,
    },
    {
      key: 'sentiment',
      label: 'News Sentiment',
      content: <NewsSentimentWidget />,
    },
  ];

  return <DashboardCarousel slides={slides} autoPlayInterval={12000} />;
}
