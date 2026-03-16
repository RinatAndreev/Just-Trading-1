import { Asset } from '@/constants/types';
import { getApiUrl } from '@/lib/query-client';

export interface ChartDataPoint {
  time: number;
  price: number;
}

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1H' | '4H' | '12H' | '1D' | '1W' | '1M' | '3M' | '1Y';

export interface MarketQuote {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume?: number;
  marketCap?: number;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateChartData(
  symbol: string,
  currentPrice: number,
  changePercent: number,
  timeframe: Timeframe
): ChartDataPoint[] {
  const now = Date.now();
  const configs: Record<Timeframe, { points: number; intervalMs: number; volatility: number }> = {
    '1m':  { points: 60, intervalMs: 60 * 1000,                volatility: 0.0008 },
    '5m':  { points: 60, intervalMs: 5 * 60 * 1000,            volatility: 0.001 },
    '15m': { points: 60, intervalMs: 15 * 60 * 1000,           volatility: 0.0015 },
    '30m': { points: 60, intervalMs: 30 * 60 * 1000,           volatility: 0.002 },
    '1H':  { points: 60, intervalMs: 60 * 60 * 1000,           volatility: 0.003 },
    '4H':  { points: 60, intervalMs: 4 * 60 * 60 * 1000,       volatility: 0.006 },
    '12H': { points: 42, intervalMs: 12 * 60 * 60 * 1000,      volatility: 0.01 },
    '1D':  { points: 78, intervalMs: 5 * 60 * 1000,            volatility: 0.003 },
    '1W':  { points: 84, intervalMs: 2 * 60 * 60 * 1000,       volatility: 0.008 },
    '1M':  { points: 30, intervalMs: 24 * 60 * 60 * 1000,      volatility: 0.02 },
    '3M':  { points: 90, intervalMs: 24 * 60 * 60 * 1000,      volatility: 0.025 },
    '1Y':  { points: 52, intervalMs: 7 * 24 * 60 * 60 * 1000,  volatility: 0.035 },
  };

  const { points, intervalMs, volatility } = configs[timeframe];
  const seed = symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const totalChangeRatio = changePercent / 100;
  const startPrice = currentPrice / (1 + totalChangeRatio);

  const data: ChartDataPoint[] = [];
  let price = startPrice;

  for (let i = 0; i < points; i++) {
    const t = now - (points - i) * intervalMs;
    const progress = i / (points - 1);
    const trendNudge = (totalChangeRatio * progress) / points;
    const noise = (seededRandom(seed + i * 7.3) - 0.5) * 2 * volatility;
    price = price * (1 + trendNudge + noise);
    if (price <= 0) price = startPrice * 0.01;
    data.push({ time: t, price });
  }

  data[data.length - 1] = { time: now, price: currentPrice };
  return data;
}

export async function fetchMarketQuotes(symbols: string[]): Promise<MarketQuote[]> {
  try {
    const url = new URL('/api/market/quotes', getApiUrl());
    url.searchParams.set('symbols', symbols.join(','));
    const res = await fetch(url.toString());
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return [];
}

export async function fetchChartHistory(symbol: string, timeframe: Timeframe): Promise<ChartDataPoint[]> {
  try {
    const url = new URL('/api/market/history', getApiUrl());
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('timeframe', timeframe);
    const res = await fetch(url.toString());
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return [];
}
