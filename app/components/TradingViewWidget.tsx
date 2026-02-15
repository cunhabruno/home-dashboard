'use client'

import { useEffect, useRef, memo } from 'react'
import WidgetContainer from './Widget'

function TradingViewWidget() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clear any previous widget content
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
      plotLineColorGrowing: 'rgba(41, 98, 255, 1)',
      plotLineColorFalling: 'rgba(255, 77, 92, 1)',
      gridLineColor: 'rgba(240, 243, 250, 0)',
      scaleFontColor: 'rgba(163, 163, 163, 1)',
      belowLineFillColorGrowing: 'rgba(41, 98, 255, 0.12)',
      belowLineFillColorFalling: 'rgba(255, 77, 92, 0.12)',
      belowLineFillColorGrowingBottom: 'rgba(41, 98, 255, 0)',
      belowLineFillColorFallingBottom: 'rgba(255, 77, 92, 0)',
      symbolActiveColor: 'rgba(41, 98, 255, 0.12)',
      tabs: [
        {
          title: 'Indices',
          symbols: [
            { s: 'FOREXCOM:SPXUSD', d: 'S&P 500' },
            { s: 'FOREXCOM:NSXUSD', d: 'US 100' },
            { s: 'FOREXCOM:DJI', d: 'Dow 30' },
            { s: 'INDEX:NKY', d: 'Nikkei 225' },
            { s: 'INDEX:DEU40', d: 'DAX Index' },
            { s: 'FOREXCOM:UKXGBP', d: 'UK 100' },
          ],
        },
        {
          title: 'Futures',
          symbols: [
            { s: 'CME_MINI:ES1!', d: 'S&P 500' },
            { s: 'CME:6E1!', d: 'Euro' },
            { s: 'COMEX:GC1!', d: 'Gold' },
            { s: 'NYMEX:CL1!', d: 'WTI Crude Oil' },
            { s: 'NYMEX:NG1!', d: 'Gas' },
            { s: 'CBOT:ZC1!', d: 'Corn' },
          ],
        },
        {
          title: 'Bonds',
          symbols: [
            { s: 'CBOT:ZB1!', d: 'T-Bond' },
            { s: 'CBOT:UB1!', d: 'Ultra T-Bond' },
            { s: 'EUREX:FGBL1!', d: 'Euro Bund' },
            { s: 'EUREX:FBTP1!', d: 'Euro BTP' },
            { s: 'EUREX:FGBM1!', d: 'Euro BOBL' },
          ],
        },
        {
          title: 'Forex',
          symbols: [
            { s: 'FX_IDC:USDBRL', d: 'USD to BRL' },
            { s: 'FX_IDC:GBPBRL', d: 'GBP to BRL' },
            { s: 'FX:EURUSD', d: 'EUR to USD' },
            { s: 'FX:GBPUSD', d: 'GBP to USD' },
            { s: 'FX:USDJPY', d: 'USD to JPY' },
            { s: 'FX:USDCHF', d: 'USD to CHF' },
            { s: 'FX:AUDUSD', d: 'AUD to USD' },
            { s: 'FX:USDCAD', d: 'USD to CAD' },
          ],
        },
      ],
    })

    containerRef.current.appendChild(script)
  }, [])

  return (
    <WidgetContainer title="📈 Market Data">
      <div
        className="tradingview-widget-container"
        style={{ height: '460px', width: '100%' }}
      >
        <div
          ref={containerRef}
          className="tradingview-widget-container__widget"
          style={{ height: '100%', width: '100%' }}
        />
        <div className="mt-2 text-center">
          <a
            href="https://www.tradingview.com/"
            rel="noopener nofollow noreferrer"
            target="_blank"
            className="text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            Track all markets on TradingView
          </a>
        </div>
      </div>
    </WidgetContainer>
  )
}

export default memo(TradingViewWidget)
