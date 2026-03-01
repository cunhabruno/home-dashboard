import { NextResponse } from 'next/server'
import { HfInference } from '@huggingface/inference'

interface SentimentResult {
  label: string
  score: number
}

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

interface NewsSentimentResponse {
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

// Cache for sentiment data (30 min TTL)
let sentimentCache: {
  data: NewsSentimentResponse
  timestamp: number
} | null = null

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

function normalizeSentimentLabel(
  label: string,
): 'positive' | 'negative' | 'neutral' {
  const lower = label.toLowerCase()
  if (lower === 'positive' || lower === 'label_2') return 'positive'
  if (lower === 'negative' || lower === 'label_0') return 'negative'
  return 'neutral'
}

function getMarketMood(overall: {
  positive: number
  negative: number
  neutral: number
}): string {
  const total = overall.positive + overall.negative + overall.neutral
  if (total === 0) return '😐 No data'

  const posRatio = overall.positive / total
  const negRatio = overall.negative / total

  if (posRatio > 0.6) return '🟢 Very Bullish'
  if (posRatio > 0.4) return '🟢 Bullish'
  if (negRatio > 0.6) return '🔴 Very Bearish'
  if (negRatio > 0.4) return '🔴 Bearish'
  return '🟡 Mixed / Neutral'
}

export async function GET() {
  console.log('🚀 News Sentiment API called at:', new Date().toISOString())

  // Check cache
  if (sentimentCache && Date.now() - sentimentCache.timestamp < CACHE_TTL) {
    const cacheAge = Math.round(
      (Date.now() - sentimentCache.timestamp) / 1000 / 60,
    )
    console.log(`✅ Returning cached sentiment data (${cacheAge} min old)`)
    return NextResponse.json(sentimentCache.data)
  }

  try {
    const hfToken = process.env.HUGGINGFACE_API_KEY
    const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY

    if (!hfToken) {
      return NextResponse.json(
        {
          error: 'Missing HUGGINGFACE_API_KEY in .env.local',
          news: [],
          overallSentiment: { positive: 0, negative: 0, neutral: 0 },
          marketMood: '⚠️ Not configured',
          lastUpdated: new Date().toISOString(),
        },
        { status: 200 },
      )
    }

    // Fetch financial news from Alpha Vantage News Sentiment endpoint
    let headlines: {
      title: string
      url: string
      source: string
      publishedAt: string
    }[] = []

    if (alphaVantageKey) {
      console.log('📰 Fetching financial news from Alpha Vantage...')
      const newsResponse = await fetch(
        `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=financial_markets,economy_monetary&limit=15&apikey=${alphaVantageKey}`,
      )
      const newsData = await newsResponse.json()

      if (newsData.feed && Array.isArray(newsData.feed)) {
        headlines = newsData.feed
          .slice(0, 12)
          .map(
            (item: {
              title: string
              url: string
              source: string
              time_published: string
            }) => ({
              title: item.title,
              url: item.url,
              source: item.source,
              publishedAt: item.time_published,
            }),
          )
      }
    }

    // Fallback: if no headlines from Alpha Vantage, use general finance RSS via a public API
    if (headlines.length === 0) {
      console.log('📰 Using fallback news source...')
      try {
        const rssResponse = await fetch(
          'https://newsdata.io/api/1/latest?apikey=pub_0&category=business&language=en&size=12',
        )
        const rssData = await rssResponse.json()
        if (rssData.results) {
          headlines = rssData.results
            .slice(0, 12)
            .map(
              (item: {
                title: string
                link: string
                source_name: string
                pubDate: string
              }) => ({
                title: item.title,
                url: item.link || '',
                source: item.source_name || 'News',
                publishedAt: item.pubDate || new Date().toISOString(),
              }),
            )
        }
      } catch {
        console.warn('⚠️ Fallback news source also failed')
      }
    }

    if (headlines.length === 0) {
      return NextResponse.json(
        {
          error: 'Unable to fetch financial news headlines',
          news: [],
          overallSentiment: { positive: 0, negative: 0, neutral: 0 },
          marketMood: '⚠️ No news available',
          lastUpdated: new Date().toISOString(),
        },
        { status: 200 },
      )
    }

    console.log(`✅ Fetched ${headlines.length} headlines`)

    // Run sentiment analysis via Hugging Face Inference
    console.log('🤖 Running sentiment analysis with DistilRoBERTa...')
    const hf = new HfInference(hfToken)

    const sentimentResults = await Promise.all(
      headlines.map(async (headline) => {
        try {
          const result = await hf.textClassification({
            model:
              'mrm8488/distilroberta-finetuned-financial-news-sentiment-analysis',
            inputs: headline.title,
          })

          // The model returns an array of labels with scores
          const topResult = result[0] as SentimentResult
          return {
            ...headline,
            sentiment: {
              label: normalizeSentimentLabel(topResult.label),
              score: topResult.score,
            },
          }
        } catch (err) {
          console.warn(
            `⚠️ Sentiment analysis failed for: "${headline.title}"`,
            err,
          )
          return {
            ...headline,
            sentiment: {
              label: 'neutral' as const,
              score: 0.5,
            },
          }
        }
      }),
    )

    // Calculate overall sentiment
    const overallSentiment = sentimentResults.reduce(
      (acc, item) => {
        acc[item.sentiment.label]++
        return acc
      },
      { positive: 0, negative: 0, neutral: 0 },
    )

    const response: NewsSentimentResponse = {
      news: sentimentResults,
      overallSentiment,
      marketMood: getMarketMood(overallSentiment),
      lastUpdated: new Date().toISOString(),
    }

    // Cache the result
    sentimentCache = {
      data: response,
      timestamp: Date.now(),
    }
    console.log('💾 Sentiment data cached for 24 hours')

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ News sentiment error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to analyze sentiment',
        news: [],
        overallSentiment: { positive: 0, negative: 0, neutral: 0 },
        marketMood: '❌ Error',
        lastUpdated: new Date().toISOString(),
      },
      { status: 200 },
    )
  }
}
