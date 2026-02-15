# Dashboard Setup Instructions

## API Keys Required

To enable real-time AI market analysis, you need two free API keys:

### 1. Finnhub API (Stock Market Data)
- Visit: https://finnhub.io/register
- Sign up for a free account
- Copy your API key
- Add to `.env.local`: `FINNHUB_API_KEY=your_key_here`

### 2. Google Gemini API (AI Analysis)
- Visit: https://aistudio.google.com/app/apikey
- Sign in with your Google account
- Click "Create API Key"
- Add to `.env.local`: `GEMINI_API_KEY=your_key_here`

### Setup Steps
1. Copy `.env.local` file (already created)
2. Replace `your_gemini_api_key_here` with your actual Google Gemini API key
3. Replace `your_finnhub_api_key_here` with your actual Finnhub API key
4. Restart your development server: `pnpm dev`

### Free Tier Limits
- **Finnhub**: 60 API calls/minute (sufficient for dashboard)
- **Google Gemini**: 15 requests/minute, 1500 requests/day (FREE - more than enough for this dashboard)

## Widget Features
- Real-time stock quotes for major tech companies
- Live market indices (S&P 500, Dow Jones, Nasdaq)
- AI-powered market analysis and opportunities
- Auto-refresh capability
