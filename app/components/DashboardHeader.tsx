'use client'

import { useState, useEffect, useCallback } from 'react'

interface MarketTicker {
  symbol: string
  price: number
  change: number
  changePercent: number
}

interface TickerData {
  btc: MarketTicker
  spx: MarketTicker
}

function formatPrice(price: number, symbol: string): string {
  if (price === 0) return '—'
  if (symbol === 'BTC') {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }
  return price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })
}

function formatChange(changePercent: number): string {
  if (changePercent === 0) return '0.00%'
  const sign = changePercent > 0 ? '+' : ''
  return `${sign}${changePercent.toFixed(2)}%`
}

export default function DashboardHeader() {
  const [now, setNow] = useState(new Date())
  const [ticker, setTicker] = useState<TickerData | null>(null)

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch ticker data
  const fetchTicker = useCallback(async () => {
    try {
      const res = await fetch('/api/ticker')
      if (res.ok) {
        const data: TickerData = await res.json()
        setTicker(data)
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchTicker()
    const interval = setInterval(fetchTicker, 5 * 60 * 1000) // refresh every 5 min
    return () => clearInterval(interval)
  }, [fetchTicker])

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const renderTicker = (t: MarketTicker) => {
    const isPositive = t.changePercent > 0
    const isNegative = t.changePercent < 0
    const color = isPositive
      ? 'text-green-600 dark:text-green-400'
      : isNegative
        ? 'text-red-600 dark:text-red-400'
        : 'text-zinc-500 dark:text-zinc-400'
    const arrow = isPositive ? '▲' : isNegative ? '▼' : ''

    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          {t.symbol}
        </span>
        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          {formatPrice(t.price, t.symbol)}
        </span>
        <span className={`text-xs font-semibold ${color}`}>
          {arrow} {formatChange(t.changePercent)}
        </span>
      </div>
    )
  }

  return (
    <header className="flex items-center justify-between px-1 py-2 flex-shrink-0">
      {/* Left: Date & Time */}
      <div className="flex items-baseline gap-3">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {timeStr}
        </h1>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {dateStr}
        </span>
      </div>

      {/* Right: Tickers */}
      {ticker && (
        <div className="flex items-center gap-5">
          {renderTicker(ticker.btc)}
          <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-700" />
          {renderTicker(ticker.spx)}
        </div>
      )}
    </header>
  )
}
