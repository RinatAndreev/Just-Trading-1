import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { normalizeFinnhubItems, type FinnhubNewsItem } from "./newsNormalizer";

const MAJOR_ASSETS = [
  { symbol: 'SPY', name: 'S&P 500 ETF', price: 524.80, changePercent: 0.42, currency: '$', category: 'stocks' },
  { symbol: 'QQQ', name: 'NASDAQ ETF', price: 447.20, changePercent: 0.85, currency: '$', category: 'stocks' },
  { symbol: 'DIA', name: 'Dow Jones ETF', price: 393.40, changePercent: 0.21, currency: '$', category: 'stocks' },
  { symbol: 'BTC', name: 'Bitcoin', price: 95400, changePercent: 3.59, currency: '$', category: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', price: 3690, changePercent: 6.03, currency: '$', category: 'crypto' },
  { symbol: 'XAU', name: 'Gold', price: 2198, changePercent: 1.57, currency: '$', category: 'commodities' },
  { symbol: 'OIL', name: 'Crude Oil', price: 79.60, changePercent: -3.40, currency: '$', category: 'commodities' },
];

const COINGECKO_IDS: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
};

interface LiveCryptoData {
  price: number;
  changePercent24h: number;
}

let cryptoCache: { data: Record<string, LiveCryptoData>; ts: number } | null = null;
const CRYPTO_CACHE_TTL = 60 * 1000;

async function fetchCoinGeckoPrices(): Promise<Record<string, LiveCryptoData>> {
  const now = Date.now();
  if (cryptoCache && now - cryptoCache.ts < CRYPTO_CACHE_TTL) {
    return cryptoCache.data;
  }

  try {
    const ids = Object.keys(COINGECKO_IDS).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });

    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);

    const raw = (await res.json()) as Record<string, { usd: number; usd_24h_change?: number }>;

    const mapped: Record<string, LiveCryptoData> = {};
    for (const [geckoId, symbol] of Object.entries(COINGECKO_IDS)) {
      if (raw[geckoId]) {
        mapped[symbol] = {
          price: raw[geckoId].usd,
          changePercent24h: parseFloat((raw[geckoId].usd_24h_change ?? 0).toFixed(2)),
        };
      }
    }

    cryptoCache = { data: mapped, ts: now };
    console.log(`[CoinGecko] Fetched live prices: BTC=$${mapped['BTC']?.price ?? '?'}, ETH=$${mapped['ETH']?.price ?? '?'}, SOL=$${mapped['SOL']?.price ?? '?'}`);
    return mapped;
  } catch (err) {
    console.warn('[CoinGecko] fetch failed, using cached/fallback data:', (err as Error).message);
    return cryptoCache?.data ?? {};
  }
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateHistory(symbol: string, currentPrice: number, changePercent: number, timeframe: string) {
  const configs: Record<string, { points: number; intervalMs: number; volatility: number }> = {
    '1D': { points: 78, intervalMs: 5 * 60 * 1000, volatility: 0.003 },
    '1W': { points: 84, intervalMs: 2 * 60 * 60 * 1000, volatility: 0.008 },
    '1M': { points: 30, intervalMs: 24 * 60 * 60 * 1000, volatility: 0.02 },
    '3M': { points: 90, intervalMs: 24 * 60 * 60 * 1000, volatility: 0.025 },
    '1Y': { points: 52, intervalMs: 7 * 24 * 60 * 60 * 1000, volatility: 0.035 },
  };

  const cfg = configs[timeframe] || configs['1M'];
  const { points, intervalMs, volatility } = cfg;
  const now = Date.now();
  const seed = symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const totalChangeRatio = changePercent / 100;
  const startPrice = currentPrice / (1 + totalChangeRatio);

  const data = [];
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

export async function registerRoutes(app: Express): Promise<Server> {
  app.get('/api/market/crypto-prices', async (_req, res) => {
    const prices = await fetchCoinGeckoPrices();
    const result = Object.entries(prices).map(([symbol, d]) => ({
      symbol,
      price: d.price,
      changePercent24h: d.changePercent24h,
    }));
    res.json(result);
  });

  app.get('/api/market/overview', async (_req, res) => {
    const live = await fetchCoinGeckoPrices();

    const assets = MAJOR_ASSETS.map(a => {
      const liveData = live[a.symbol];
      if (liveData) {
        return { ...a, price: liveData.price, changePercent: liveData.changePercent24h };
      }
      return a;
    });

    res.json(assets);
  });

  app.get('/api/market/quotes', async (req, res) => {
    const symbolsParam = req.query.symbols as string;
    if (!symbolsParam) {
      return res.status(400).json({ error: 'symbols parameter required' });
    }

    const live = await fetchCoinGeckoPrices();
    const requested = symbolsParam.split(',').map(s => s.trim().toUpperCase());

    const quotes = MAJOR_ASSETS
      .filter(a => requested.includes(a.symbol))
      .map(a => {
        const liveData = live[a.symbol];
        return {
          symbol: a.symbol,
          price: liveData ? liveData.price : a.price,
          changePercent24h: liveData ? liveData.changePercent24h : a.changePercent,
          currency: a.currency,
        };
      });

    res.json(quotes);
  });

  app.get('/api/market/history', async (req, res) => {
    const symbol = (req.query.symbol as string)?.toUpperCase();
    const timeframe = (req.query.timeframe as string) || '1M';

    const live = await fetchCoinGeckoPrices();

    const baseAsset = MAJOR_ASSETS.find(a => a.symbol === symbol) || {
      symbol: symbol || 'UNKNOWN',
      price: 100,
      changePercent: 0,
    };

    const liveData = live[symbol];
    const asset = liveData
      ? { ...baseAsset, price: liveData.price, changePercent: liveData.changePercent24h }
      : baseAsset;

    const history = generateHistory(asset.symbol, asset.price, asset.changePercent, timeframe);
    res.json(history);
  });

  const NEWS_CACHE_TTL = 5 * 60 * 1000;
  let newsCache: { data: unknown[]; ts: number } | null = null;

  app.get('/api/news', async (_req, res) => {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      return res.status(204).end();
    }

    const now = Date.now();
    if (newsCache && now - newsCache.ts < NEWS_CACHE_TTL) {
      return res.json(newsCache.data);
    }

    try {
      const [generalRes, cryptoRes] = await Promise.all([
        fetch(`https://finnhub.io/api/v1/news?category=general&token=${apiKey}`, {
          signal: AbortSignal.timeout(6000),
        }),
        fetch(`https://finnhub.io/api/v1/news?category=crypto&token=${apiKey}`, {
          signal: AbortSignal.timeout(6000),
        }),
      ]);

      const results: FinnhubNewsItem[] = [];

      if (generalRes.ok) {
        const generalItems = (await generalRes.json()) as FinnhubNewsItem[];
        results.push(...generalItems);
      }
      if (cryptoRes.ok) {
        const cryptoItems = (await cryptoRes.json()) as FinnhubNewsItem[];
        results.push(...cryptoItems);
      }

      if (results.length === 0) {
        return res.status(204).end();
      }

      results.sort((a, b) => b.datetime - a.datetime);

      const normalized = normalizeFinnhubItems(results).slice(0, 40);
      newsCache = { data: normalized, ts: now };

      console.log(`[Finnhub] Fetched ${normalized.length} news items (${results.length} raw)`);
      return res.json(normalized);
    } catch (err) {
      console.warn('[Finnhub] news fetch failed:', (err as Error).message);
      return res.status(204).end();
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
