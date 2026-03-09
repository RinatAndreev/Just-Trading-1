import type { Express } from "express";
import { createServer, type Server } from "node:http";

const MAJOR_ASSETS = [
  { symbol: 'SPY', name: 'S&P 500 ETF', price: 524.80, changePercent: 0.42, currency: '$', category: 'stocks' },
  { symbol: 'QQQ', name: 'NASDAQ ETF', price: 447.20, changePercent: 0.85, currency: '$', category: 'stocks' },
  { symbol: 'DIA', name: 'Dow Jones ETF', price: 393.40, changePercent: 0.21, currency: '$', category: 'stocks' },
  { symbol: 'BTC', name: 'Bitcoin', price: 95400, changePercent: 3.59, currency: '$', category: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', price: 3690, changePercent: 6.03, currency: '$', category: 'crypto' },
  { symbol: 'XAU', name: 'Gold', price: 2198, changePercent: 1.57, currency: '$', category: 'commodities' },
  { symbol: 'OIL', name: 'Crude Oil', price: 79.60, changePercent: -3.40, currency: '$', category: 'commodities' },
];

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
  app.get('/api/market/overview', (_req, res) => {
    res.json(MAJOR_ASSETS);
  });

  app.get('/api/market/quotes', (req, res) => {
    const symbolsParam = req.query.symbols as string;
    if (!symbolsParam) {
      return res.status(400).json({ error: 'symbols parameter required' });
    }
    const requested = symbolsParam.split(',').map(s => s.trim().toUpperCase());
    const quotes = MAJOR_ASSETS
      .filter(a => requested.includes(a.symbol))
      .map(a => ({
        symbol: a.symbol,
        price: a.price,
        changePercent24h: a.changePercent,
        currency: a.currency,
      }));
    res.json(quotes);
  });

  app.get('/api/market/history', (req, res) => {
    const symbol = (req.query.symbol as string)?.toUpperCase();
    const timeframe = (req.query.timeframe as string) || '1M';

    const asset = MAJOR_ASSETS.find(a => a.symbol === symbol) || {
      symbol: symbol || 'UNKNOWN',
      price: 100,
      changePercent: 0,
    };

    const history = generateHistory(
      asset.symbol,
      asset.price,
      asset.changePercent,
      timeframe
    );
    res.json(history);
  });

  app.get('/api/news', (_req, res) => {
    res.status(204).end();
  });

  const httpServer = createServer(app);
  return httpServer;
}
