'use client';

import WidgetContainer from './Widget';
import type { MarketAnalysisData } from './MarketCarousel';

interface StockMarketWidgetProps {
  data: MarketAnalysisData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function StockMarketWidget({ data: analysis, loading, error, onRefresh }: StockMarketWidgetProps) {
  if (loading) {
    return (
      <WidgetContainer title="Market Analysis">
        <div className="flex items-center justify-center h-40">
          <div className="animate-pulse text-4xl">📊</div>
        </div>
      </WidgetContainer>
    );
  }

  if (error || !analysis) {
    return (
      <WidgetContainer title="Market Analysis">
        <div className="text-red-500">
          <p>{error || 'Unable to load market data'}</p>
          <button 
            onClick={onRefresh}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </WidgetContainer>
    );
  }

  const riskColors = {
    Low: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    Medium: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
    High: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
  };

  return (
    <WidgetContainer title="Market Analysis">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm leading-relaxed text-zinc-900 dark:text-zinc-100">
            {analysis.summary}
          </p>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${riskColors[analysis.riskLevel]}`}>
            {analysis.riskLevel} Risk
          </span>
        </div>
        
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <h3 className="text-sm font-semibold mb-3 text-zinc-900 dark:text-zinc-100">
            🎯 Opportunities to Watch
          </h3>
          <ul className="space-y-2">
            {analysis.opportunities.map((opportunity, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{opportunity}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Updated: {analysis.lastUpdated}
          </span>
          <button 
            onClick={onRefresh}
            className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-xs font-medium"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            ⚠️ <strong>Disclaimer:</strong> This is AI-generated analysis for informational purposes only. Not financial advice. Always do your own research and consult with financial advisors.
          </p>
        </div>
      </div>
    </WidgetContainer>
  );
}
