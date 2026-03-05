import { NextResponse } from 'next/server'

interface MarketTicker {
  symbol: string
  price: number
  change: number
  changePercent: number
}

// Cache for 5 minutes
let tickerCache: {
  data: { btc: MarketTicker; spx: MarketTicker }
  timestamp: number
} | null = null

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function GET() {
  if (tickerCache && Date.now() - tickerCache.timestamp < CACHE_TTL) {
    return NextResponse.json(tickerCache.data)
  }

  try {
    const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY

    // Fetch BTC from CoinGecko (free, no key needed)
    let btc: MarketTicker = {
      symbol: 'BTC',
      price: 0,
      change: 0,
      changePercent: 0,
    }

    try {
      const btcResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
      )
      const btcData = await btcResponse.json()
      if (btcData.bitcoin) {
        const price = btcData.bitcoin.usd
        const changePct = btcData.bitcoin.usd_24h_change ?? 0
        btc = {
          symbol: 'BTC',
          price,
          change: (price * changePct) / 100,
          changePercent: changePct,
        }
      }
    } catch (err) {
      console.warn('⚠️ BTC fetch failed:', err)
    }

    // Fetch SPX (via SPY ETF) from Alpha Vantage
    let spx: MarketTicker = {
      symbol: 'SPX',
      price: 0,
      change: 0,
      changePercent: 0,
    }

    if (alphaVantageKey) {
      try {
        const spyResponse = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${alphaVantageKey}`,
        )
        const spyData = await spyResponse.json()
        const quote = spyData['Global Quote']
        if (quote) {
          spx = {
            symbol: 'SPX',
            price: parseFloat(quote['05. price']) || 0,
            change: parseFloat(quote['09. change']) || 0,
            changePercent:
              parseFloat(quote['10. change percent']?.replace('%', '')) || 0,
          }
        }
      } catch (err) {
        console.warn('⚠️ SPX fetch failed:', err)
      }
    }

    const data = { btc, spx }

    tickerCache = { data, timestamp: Date.now() }

    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Ticker API error:', error)
    return NextResponse.json(
      {
        btc: { symbol: 'BTC', price: 0, change: 0, changePercent: 0 },
        spx: { symbol: 'SPX', price: 0, change: 0, changePercent: 0 },
      },
      { status: 200 },
    )
  }
}
