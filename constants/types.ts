export type Sentiment = 'bullish' | 'bearish' | 'neutral';

export type Category = 'stocks' | 'crypto' | 'commodities' | 'forex' | 'macro';

export type AITag =
  | 'Bullish'
  | 'Bearish'
  | 'High Volatility'
  | 'Earnings'
  | 'Regulation'
  | 'Macro Event'
  | 'Breakout'
  | 'IPO'
  | 'M&A';

export interface MarketReaction {
  priceBefore: number;
  priceAfter: number;
  change5m: number;
  change30m: number;
  change1h: number;
  currency: string;
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  publishedAt: string;
  assetSymbol: string;
  assetName: string;
  category: Category;
  sentiment: Sentiment;
  marketReaction: MarketReaction;
  tags: AITag[];
  isBreaking?: boolean;
}

export interface Asset {
  symbol: string;
  name: string;
  category: Category;
  price: number;
  change24h: number;
  changePercent24h: number;
  currency: string;
}

export interface WatchlistEntry {
  symbol: string;
  addedAt: string;
}

export type SubscriptionTier = 'free' | 'pro';

export interface NotificationSettings {
  breakingNews: boolean;
  watchlistAlerts: boolean;
  marketOpen: boolean;
  dailyDigest: boolean;
}
