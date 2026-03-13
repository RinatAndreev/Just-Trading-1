# Just Trading — Financial Intelligence App

A mobile SaaS financial news aggregation and trading intelligence app built with Expo + React Native.

## Architecture

- **Frontend**: Expo Router (file-based routing), React Native
- **Backend**: Express.js (port 5000) — serves market data API routes and landing page
- **State**: AsyncStorage for persistence, React Context for global state, React Query for server state
- **Navigation**: 5-tab structure (Feed, Watchlist, Markets, Portfolio, Settings) + push screen (Chart)
- **Styling**: Dark trading theme with orange accent (#FF7A1A)

## Folder Structure

```
app/
  _layout.tsx              # Root layout with providers
  chart/[symbol].tsx       # Chart screen (push) — tap any asset to open
  (tabs)/
    _layout.tsx            # NativeTabs (iOS 26+ liquid glass) / ClassicTabs fallback
    index.tsx              # News Feed + "Most Market Moving Today" section
    watchlist.tsx          # Watchlist with real SVG sparkline charts
    categories.tsx         # Markets tab: Market Overview + category news
    portfolio.tsx          # Portfolio tracker with P/L
    settings.tsx           # Settings, auth, subscription
    alerts.tsx             # Hidden (href: null) — notification settings
  (auth)/
    login.tsx              # Login screen
    register.tsx           # Register screen
components/
  NewsCard.tsx             # News card: sentiment, impact score, market reaction, share
  MarketReactionIndicator.tsx  # 5m/30m/1h price change display
  SentimentBadge.tsx       # Bullish/Bearish/Neutral badge
  AITagsList.tsx           # AI-generated news tags
  AssetTag.tsx             # Asset symbol badge
  WatchlistItem.tsx        # Watchlist asset row with real SVG mini chart
  MiniChart.tsx            # Reusable SVG sparkline chart
  ImpactScore.tsx          # Impact score badge (1–10 scale)
  ErrorBoundary.tsx        # Error boundary wrapper
services/
  newsService.ts           # News fetching + top movers sorting
  marketService.ts         # Market data + chart data generation
hooks/
  useNews.ts               # News queries + filtering hook
  useMarketData.ts         # Market overview + asset queries
  usePortfolio.ts          # Enriched portfolio calculations
utils/
  formatters.ts            # formatPrice, formatChange, timeAgo, formatVolume
  impactScore.ts           # Heuristic impact scoring (keyword-based, 1–10)
constants/
  colors.ts                # Full dark trading color palette
  types.ts                 # TypeScript interfaces
  mockData.ts              # Mock news (12 items) and assets (12 symbols)
context/
  AppContext.tsx            # watchlist, subscription, auth, notifications, categories
  PortfolioContext.tsx      # Portfolio positions with AsyncStorage persistence
server/
  index.ts                 # Express server setup
  routes.ts                # /api/market/overview, /api/market/quotes, /api/market/history
```

## Features (MVP Complete)

| Feature | Status |
|---|---|
| News feed with headline, source, timestamp, asset | ✅ |
| Sentiment badge (bullish/bearish/neutral) | ✅ |
| Market reaction timeline (5m / 30m / 1h) | ✅ |
| AI-generated tags (Earnings, Regulation, Macro, etc.) | ✅ |
| Asset watchlist (free: 2, pro: unlimited) | ✅ |
| Category + search filtering | ✅ |
| Impact score (heuristic, 1–10, keyword-based) | ✅ |
| "Most Market Moving Today" horizontal section | ✅ |
| Shareable news cards (native Share API) | ✅ |
| Tap asset symbol → open chart screen | ✅ |
| Interactive SVG price chart (5 timeframes) | ✅ |
| Market Overview (S&P, NASDAQ, BTC, ETH, Gold, Oil) | ✅ |
| Portfolio tracker with P/L (top/worst gainer) | ✅ |
| Services layer (newsService, marketService) | ✅ |
| Custom hooks (useNews, useMarketData, usePortfolio) | ✅ |
| Auth (local login/register) | ✅ |
| Free/Pro subscription model | ✅ |
| Dark trading theme throughout | ✅ |

## API Integration Path

The service layer is ready for real API integration. To plug in real data:
1. `services/newsService.ts` — replace fallback with Finnhub / NewsAPI / Marketaux calls
2. `services/marketService.ts` — replace generateChartData with real OHLC data from Twelve Data / Alpha Vantage
3. `server/routes.ts` — proxy real API calls to hide API keys from the client
4. Add API keys as environment variables

## Theme Colors

- Background: `#0F0F0F`, Card: `#161616`, Secondary: `#1A1A1A`
- Accent: `#FF7A1A` (orange), Pro/Gold: `#FFD700`
- Bullish: `#00C878`, Bearish: `#FF4A5A`, Neutral: `#888888`
