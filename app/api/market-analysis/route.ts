import { NextResponse } from 'next/server'

interface StockQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
}

interface AlphaVantageStock {
  ticker: string
  price: string
  change_percentage: string
  volume?: string
}

interface MarketAnalysis {
  summary: string
  opportunities: string[]
  riskLevel: 'Low' | 'Medium' | 'High'
  error?: string
}

// Cache for market data (1 hour TTL)
let marketDataCache: {
  data: MarketAnalysis
  timestamp: number
} | null = null

const CACHE_TTL = 60 * 60 * 1000 // 1 hour in milliseconds

export async function GET() {
  console.log('🚀 Market Analysis API called at:', new Date().toISOString())

  // Check if we have valid cached data
  if (marketDataCache && Date.now() - marketDataCache.timestamp < CACHE_TTL) {
    const cacheAge = Math.round(
      (Date.now() - marketDataCache.timestamp) / 1000 / 60,
    )
    console.log(`✅ Returning cached data (${cacheAge} minutes old)`)
    return NextResponse.json(marketDataCache.data)
  }

  console.log('🔄 Cache expired or empty, fetching fresh data...')

  try {
    const geminiKey = process.env.GEMINI_API_KEY
    const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY

    console.log('🔑 API Keys status:', {
      gemini: geminiKey ? `Set (${geminiKey.substring(0, 10)}...)` : 'Missing',
      alphaVantage: alphaVantageKey
        ? `Set (${alphaVantageKey.substring(0, 10)}...)`
        : 'Missing',
    })

    if (!geminiKey || !alphaVantageKey) {
      console.warn('⚠️  Missing API keys')
      return NextResponse.json(
        {
          error:
            'Missing API keys. Please set GEMINI_API_KEY and ALPHA_VANTAGE_API_KEY in .env.local',
          summary: '⚠️ API keys not configured',
          opportunities: [
            'Add GEMINI_API_KEY to your .env.local file',
            'Add ALPHA_VANTAGE_API_KEY to your .env.local file',
            'Restart the development server',
            'Get free API keys from aistudio.google.com and alphavantage.co',
          ],
          riskLevel: 'Medium',
        },
        { status: 200 },
      )
    }

    // Fetch real-time market data from Alpha Vantage
    console.log('📊 Fetching market overview and top gainers/losers...')

    // Get market overview data - top gainers, losers, and most active
    const overviewResponse = await fetch(
      `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${alphaVantageKey}`,
    )
    const overviewData = await overviewResponse.json()

    if (overviewData.Note || overviewData['Error Message']) {
      throw new Error('Alpha Vantage API limit reached or error occurred')
    }

    // Get top 5 gainers and losers
    const topGainers = overviewData.top_gainers?.slice(0, 5) || []
    const topLosers = overviewData.top_losers?.slice(0, 5) || []
    const mostActive = overviewData.most_actively_traded?.slice(0, 5) || []

    console.log('✅ Market overview fetched')
    console.log('📈 Top gainers:', topGainers.length)
    console.log('📉 Top losers:', topLosers.length)
    console.log('🔥 Most active:', mostActive.length)

    // Fetch major indices using Global Quote
    console.log('📊 Fetching major market indices...')
    const indices = ['SPY', 'QQQ', 'DIA'] // ETFs that track major indices
    const indicesData: StockQuote[] = []

    for (const symbol of indices) {
      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageKey}`,
        )
        const data = await response.json()

        if (data['Global Quote']) {
          const quote = data['Global Quote']
          indicesData.push({
            symbol,
            price: parseFloat(quote['05. price']) || 0,
            change: parseFloat(quote['09. change']) || 0,
            changePercent:
              parseFloat(quote['10. change percent']?.replace('%', '')) || 0,
          })
        }

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 300))
      } catch (err) {
        console.error(`Error fetching ${symbol}:`, err)
      }
    }

    console.log('✅ Market indices fetched:', indicesData.length, 'indices')
    console.log('📊 Sample index:', indicesData[0])

    // Prepare market data summary for AI
    const marketSummary = `
Current Market Data (${new Date().toLocaleString()}):

Major Market ETFs:
${indicesData.map((idx) => `${idx.symbol}: $${idx.price.toFixed(2)} (${idx.changePercent >= 0 ? '+' : ''}${idx.changePercent.toFixed(2)}%)`).join('\n')}

Top 5 Gainers Today:
${topGainers.map((stock: AlphaVantageStock) => `${stock.ticker}: $${parseFloat(stock.price).toFixed(2)} (+${stock.change_percentage})`).join('\n')}

Top 5 Losers Today:
${topLosers.map((stock: AlphaVantageStock) => `${stock.ticker}: $${parseFloat(stock.price).toFixed(2)} (${stock.change_percentage})`).join('\n')}

Most Actively Traded:
${mostActive
  .slice(0, 3)
  .map(
    (stock: AlphaVantageStock) =>
      `${stock.ticker}: $${parseFloat(stock.price).toFixed(2)} (${stock.change_percentage}) - Vol: ${stock.volume}`,
  )
  .join('\n')}
`

    // Use Google Gemini to analyze the market data
    const prompt = `You are a professional market analyst with access to Alpha Vantage API.

ALPHA VANTAGE API KEY: ${alphaVantageKey}

You have access to the following Alpha Vantage API functions:
- GLOBAL_QUOTE: Get real-time quote for any stock symbol
- TIME_SERIES_INTRADAY: Get intraday time series data
- SECTOR: Get sector performance data
- OVERVIEW: Get company fundamentals and overview
- NEWS_SENTIMENT: Get market news and sentiment analysis
- ECONOMIC_INDICATORS: GDP, inflation, interest rates, etc.

Current Market Snapshot:
${marketSummary}

TASK: Based on the current market data above, analyze market conditions and identify the best investment opportunities. Consider:
1. Market momentum and trends from the gainers/losers
2. Sector rotation opportunities
3. Risk factors and market sentiment
4. Specific stocks or sectors showing strong signals

Provide your analysis in this EXACT JSON format (no other text):
{
  "summary": "[emoji 📈/📊/📉] + [comprehensive 2-sentence market analysis with key insights]",
  "opportunities": ["[actionable opportunity 1]", "[actionable opportunity 2]", "[actionable opportunity 3]", "[actionable opportunity 4]"],
  "riskLevel": "Low" or "Medium" or "High"
}

Make each opportunity specific and actionable (under 15 words). Focus on the strongest signals from the data.
Return ONLY the JSON object, no other text.`

    console.log('🤖 Calling Gemini API...')
    console.log('📝 Prompt length:', prompt.length, 'characters')

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': geminiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
          },
        }),
      },
    )

    console.log(
      '📡 Gemini API response status:',
      aiResponse.status,
      aiResponse.statusText,
    )

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('❌ Gemini API error response:', errorText)
      throw new Error(`Failed to get AI analysis: ${aiResponse.statusText}`)
    }

    const aiData = await aiResponse.json()
    console.log('🔍 Gemini finish reason:', aiData.candidates[0].finishReason)

    if (aiData.candidates[0].finishReason === 'MAX_TOKENS') {
      console.warn('⚠️ Response was truncated due to MAX_TOKENS')
    }

    const responseText = aiData.candidates[0].content.parts[0].text
    console.log('✨ AI Response text:', responseText)

    // Remove markdown code blocks if present
    let cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    // If response doesn't start with {, try to extract JSON object
    if (!cleanedText.startsWith('{')) {
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanedText = jsonMatch[0]
        console.log('🔧 Extracted JSON from response')
      }
    }

    console.log('🧹 Cleaned text for parsing:', cleanedText)

    const analysis = JSON.parse(cleanedText)
    console.log('✅ Successfully parsed analysis:', analysis)
    console.log('🎯 Final response ready')

    // Cache the successful response
    marketDataCache = {
      data: analysis,
      timestamp: Date.now(),
    }
    console.log('💾 Data cached for 1 hour')

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('❌ Market analysis error:', error)
    console.error(
      '📋 Error stack:',
      error instanceof Error ? error.stack : 'No stack trace',
    )
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to analyze market',
        summary: '❌ Unable to fetch market analysis',
        opportunities: [
          'Check your API keys are valid',
          'Ensure you have not exceeded API rate limits',
          'Verify your internet connection',
          'Try refreshing in a few moments',
        ],
        riskLevel: 'Medium',
      },
      { status: 200 },
    )
  }
}
