'use client'

import { useState, useEffect, useCallback } from 'react'
import WidgetContainer from './Widget'

interface NewsItem {
  title: string
  url: string
  source: string
  publishedAt: string
  sentiment: {
    label: 'positive' | 'negative' | 'neutral'
    score: number
  }
}

interface SentimentData {
  news: NewsItem[]
  overallSentiment: {
    positive: number
    negative: number
    neutral: number
  }
  marketMood: string
  lastUpdated: string
  error?: string
}

const sentimentConfig = {
  positive: {
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    icon: '📈',
    bar: 'bg-green-500',
  },
  negative: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    icon: '📉',
    bar: 'bg-red-500',
  },
  neutral: {
    color: 'text-zinc-600 dark:text-zinc-400',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    border: 'border-zinc-200 dark:border-zinc-700',
    icon: '➡️',
    bar: 'bg-zinc-400',
  },
}

export default function NewsSentimentWidget() {
  const [data, setData] = useState<SentimentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSentiment = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/news-sentiment')
      if (!response.ok) throw new Error('Failed to fetch sentiment data')
      const result: SentimentData = await response.json()
      if (result.error && result.news.length === 0) {
        throw new Error(result.error)
      }
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sentiment')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSentiment()
  }, [fetchSentiment])

  if (loading) {
    return (
      <WidgetContainer title="News Sentiment">
        <div className="flex items-center justify-center h-40">
          <div className="animate-pulse text-4xl">🧠</div>
        </div>
      </WidgetContainer>
    )
  }

  if (error || !data) {
    return (
      <WidgetContainer title="News Sentiment">
        <div className="text-red-500">
          <p>{error || 'Unable to load sentiment data'}</p>
          <button
            onClick={fetchSentiment}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </WidgetContainer>
    )
  }

  const total =
    data.overallSentiment.positive +
    data.overallSentiment.negative +
    data.overallSentiment.neutral
  const posPercent = total > 0 ? (data.overallSentiment.positive / total) * 100 : 0
  const negPercent = total > 0 ? (data.overallSentiment.negative / total) * 100 : 0
  const neuPercent = total > 0 ? (data.overallSentiment.neutral / total) * 100 : 0

  return (
    <WidgetContainer title="News Sentiment">
      <div className="space-y-4">
        {/* Market mood header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {data.marketMood}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Based on {total} financial headlines
            </div>
          </div>
          <div className="text-4xl">🧠</div>
        </div>

        {/* Sentiment bar */}
        <div className="space-y-2">
          <div className="flex h-3 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
            {posPercent > 0 && (
              <div
                className="bg-green-500 transition-all duration-500"
                style={{ width: `${posPercent}%` }}
              />
            )}
            {neuPercent > 0 && (
              <div
                className="bg-zinc-400 transition-all duration-500"
                style={{ width: `${neuPercent}%` }}
              />
            )}
            {negPercent > 0 && (
              <div
                className="bg-red-500 transition-all duration-500"
                style={{ width: `${negPercent}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-green-600 dark:text-green-400 font-medium">
              ↑ {data.overallSentiment.positive} Positive
            </span>
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">
              → {data.overallSentiment.neutral} Neutral
            </span>
            <span className="text-red-600 dark:text-red-400 font-medium">
              ↓ {data.overallSentiment.negative} Negative
            </span>
          </div>
        </div>

        {/* News headlines */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
          <h3 className="text-sm font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
            📰 Latest Headlines
          </h3>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {data.news.map((item, index) => {
              const cfg = sentimentConfig[item.sentiment.label]
              return (
                <div
                  key={index}
                  className={`flex items-start gap-2 p-2 rounded-lg border ${cfg.bg} ${cfg.border}`}
                >
                  <span className="text-sm flex-shrink-0 mt-0.5">
                    {cfg.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs font-medium leading-snug line-clamp-2 hover:underline ${cfg.color}`}
                    >
                      {item.title}
                    </a>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {item.source}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        {Math.round(item.sentiment.score * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Model: DistilRoBERTa Financial Sentiment
          </span>
          <button
            onClick={fetchSentiment}
            className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-xs font-medium"
          >
            Refresh
          </button>
        </div>
      </div>
    </WidgetContainer>
  )
}
