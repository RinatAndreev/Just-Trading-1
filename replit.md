# Just Trading — Financial News App

A mobile SaaS financial news aggregation app built with Expo + React Native.

## Architecture

- **Frontend**: Expo Router (file-based routing), React Native
- **Backend**: Express.js (port 5000) — serves API routes and landing page
- **State**: AsyncStorage for persistence, React Context for global state
- **Navigation**: 5-tab structure (Feed, Watchlist, Markets, Alerts, Settings)
- **Styling**: Dark trading theme with orange accent (#FF7A1A)

## Folder Structure

```
app/
  _layout.tsx          # Root layout with providers (QueryClient, AppProvider)
  (tabs)/
    _layout.tsx        # Tab bar (NativeTabs for iOS 26+, ClassicTabs fallback)
    index.tsx          # News Feed screen
    watchlist.tsx      # Watchlist screen
    categories.tsx     # Categories/Markets screen
    alerts.tsx         # Alerts & Notifications screen
    settings.tsx       # Settings screen
components/
  NewsCard.tsx         # News article card with market reaction
  MarketReactionIndicator.tsx  # 5m/30m/1h price change display
  SentimentBadge.tsx   # Bullish/Bearish/Neutral badge
  AITagsList.tsx       # AI-generated tags (Earnings, Regulation, etc.)
  AssetTag.tsx         # Asset symbol tag
  WatchlistItem.tsx    # Watchlist asset row with mini sparkline
  ErrorBoundary.tsx    # Error boundary wrapper
constants/
  colors.ts            # Full dark trading color palette
  types.ts             # TypeScript interfaces
  mockData.ts          # Mock news and asset data (12 news, 12 assets)
context/
  AppContext.tsx        # Global state: watchlist, subscription, notifications
server/
  index.ts             # Express server setup
  routes.ts            # API routes (currently minimal)
```

## Features

- **News Feed**: Scrollable news with filtering by category, search, watchlist prioritization
- **Market Reaction**: 5m / 30m / 1h price change indicators on every news card
- **AI Tags**: Automated tags (Bullish, Bearish, High Volatility, Earnings, Regulation, Macro Event)
- **Watchlist**: Add/remove assets; free plan = 2 assets, pro = unlimited
- **Categories**: Browse news by Stocks, Crypto, Commodities, Forex, Macro
- **Alerts**: Configure notifications; recent breaking news alerts
- **Subscription**: Free vs Pro ($10/month) with upgrade modal
- **Settings**: Category filters, app info, data sources

## Theme Colors

- Background: `#0F0F0F` (deep warm black)
- Accent: `#FF7A1A` (dark orange)
- Secondary text: `#B5B5B5`
- Bullish: `#00C878`, Bearish: `#FF4A5A`

## Data

All data is currently mock. The app is structured to support:
- Marketaux API
- Finnhub API
- NewsAPI
- CryptoPanic API

Replace `constants/mockData.ts` with real API calls when integrating.
