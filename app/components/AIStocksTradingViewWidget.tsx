'use client'

import { useEffect, useRef, memo } from 'react'
import WidgetContainer from './Widget'

interface AIStocksTradingViewWidgetProps {
  symbols: string[]
  loading: boolean
}

function AIStocksTradingViewWidget({ symbols, loading }: AIStocksTradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || symbols.length === 0) return

    // Clear previous widget content
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      colorTheme: 'dark',
      dateRange: '1D',
      showChart: true,
      locale: 'en',
      largeChartUrl: '',
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: false,
      width: '100%',
      height: '100%',
      plotLineColorGrowing: 'rgba(34, 197, 94, 1)',
      plotLineColorFalling: 'rgba(239, 68, 68, 1)',
      gridLineColor: 'rgba(240, 243, 250, 0)',
      scaleFontColor: 'rgba(163, 163, 163, 1)',
      belowLineFillColorGrowing: 'rgba(34, 197, 94, 0.12)',
      belowLineFillColorFalling: 'rgba(239, 68, 68, 0.12)',
      belowLineFillColorGrowingBottom: 'rgba(34, 197, 94, 0)',
      belowLineFillColorFallingBottom: 'rgba(239, 68, 68, 0)',
      symbolActiveColor: 'rgba(34, 197, 94, 0.12)',
      tabs: [
        {
          title: 'AI Picks',
          symbols: symbols.map((s) => ({
            s,
            d: s.includes(':') ? s.split(':')[1] : s,
          })),
        },
      ],
    })

    containerRef.current.appendChild(script)
  }, [symbols])

  if (loading) {
    return (
      <WidgetContainer title="🤖 AI Stock Picks">
        <div className="flex items-center justify-center h-40">
          <div className="animate-pulse text-4xl">📊</div>
        </div>
      </WidgetContainer>
    )
  }

  if (symbols.length === 0) {
    return (
      <WidgetContainer title="🤖 AI Stock Picks">
        <div className="text-zinc-500 dark:text-zinc-400 text-base text-center py-8">
          No stock symbols returned from AI analysis
        </div>
      </WidgetContainer>
    )
  }

  return (
    <WidgetContainer title="🤖 AI Stock Picks">
      <div
        className="tradingview-widget-container flex flex-col"
        style={{ height: '100%', width: '100%' }}
      >
        <div
          ref={containerRef}
          className="tradingview-widget-container__widget flex-1"
          style={{ height: '100%', width: '100%' }}
        />
        <div className="mt-2 text-center flex-shrink-0">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Stocks selected by AI market analysis · Not financial advice
          </span>
        </div>
      </div>
    </WidgetContainer>
  )
}

export default memo(AIStocksTradingViewWidget)
