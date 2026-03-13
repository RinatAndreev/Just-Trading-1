type Sentiment = 'bullish' | 'bearish' | 'neutral';
type Category = 'stocks' | 'crypto' | 'commodities' | 'forex' | 'macro';
type AITag = 'Bullish' | 'Bearish' | 'High Volatility' | 'Earnings' | 'Regulation' | 'Macro Event' | 'Breakout' | 'IPO' | 'M&A';

export interface FinnhubNewsItem {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image?: string;
  datetime: number;
  category: string;
  related: string;
}

export interface NormalizedNewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  publishedAt: string;
  assetSymbol: string;
  assetName: string;
  category: Category;
  sentiment: Sentiment;
  marketReaction: {
    priceBefore: number;
    priceAfter: number;
    change5m: number;
    change30m: number;
    change1h: number;
    currency: string;
  };
  tags: AITag[];
  isBreaking: boolean;
  url?: string;
}

const KNOWN_SYMBOLS: Record<string, { name: string; category: Category }> = {
  AAPL: { name: 'Apple Inc.', category: 'stocks' },
  TSLA: { name: 'Tesla Inc.', category: 'stocks' },
  NVDA: { name: 'NVIDIA Corp.', category: 'stocks' },
  AMZN: { name: 'Amazon.com', category: 'stocks' },
  GOOGL: { name: 'Alphabet Inc.', category: 'stocks' },
  GOOG: { name: 'Alphabet Inc.', category: 'stocks' },
  MSFT: { name: 'Microsoft Corp.', category: 'stocks' },
  META: { name: 'Meta Platforms', category: 'stocks' },
  NFLX: { name: 'Netflix Inc.', category: 'stocks' },
  UBER: { name: 'Uber Technologies', category: 'stocks' },
  BABA: { name: 'Alibaba Group', category: 'stocks' },
  JPM: { name: 'JPMorgan Chase', category: 'stocks' },
  BAC: { name: 'Bank of America', category: 'stocks' },
  GS: { name: 'Goldman Sachs', category: 'stocks' },
  MS: { name: 'Morgan Stanley', category: 'stocks' },
  V: { name: 'Visa Inc.', category: 'stocks' },
  MA: { name: 'Mastercard', category: 'stocks' },
  PYPL: { name: 'PayPal', category: 'stocks' },
  COIN: { name: 'Coinbase', category: 'stocks' },
  AMD: { name: 'AMD', category: 'stocks' },
  INTC: { name: 'Intel Corp.', category: 'stocks' },
  ORCL: { name: 'Oracle Corp.', category: 'stocks' },
  CRM: { name: 'Salesforce', category: 'stocks' },
  PLTR: { name: 'Palantir', category: 'stocks' },
  BTC: { name: 'Bitcoin', category: 'crypto' },
  ETH: { name: 'Ethereum', category: 'crypto' },
  SOL: { name: 'Solana', category: 'crypto' },
  DOGE: { name: 'Dogecoin', category: 'crypto' },
  XRP: { name: 'XRP', category: 'crypto' },
  ADA: { name: 'Cardano', category: 'crypto' },
  AVAX: { name: 'Avalanche', category: 'crypto' },
  DOT: { name: 'Polkadot', category: 'crypto' },
  XAU: { name: 'Gold', category: 'commodities' },
  OIL: { name: 'Crude Oil', category: 'commodities' },
  SILVER: { name: 'Silver', category: 'commodities' },
  USD: { name: 'US Dollar', category: 'macro' },
  EUR: { name: 'Euro', category: 'forex' },
  JPY: { name: 'Japanese Yen', category: 'forex' },
  GBP: { name: 'British Pound', category: 'forex' },
  CNY: { name: 'Chinese Yuan', category: 'forex' },
  SPY: { name: 'S&P 500', category: 'stocks' },
  QQQ: { name: 'NASDAQ 100', category: 'stocks' },
};

const BULLISH_WORDS = [
  'surge', 'surges', 'surged', 'rally', 'rallies', 'rallied',
  'beat', 'beats', 'record', 'high', 'jumps', 'jumped',
  'rises', 'rose', 'soars', 'soared', 'tops', 'gains', 'gained',
  'upgrade', 'upgraded', 'boosts', 'boosted', 'growth',
  'profit', 'strong', 'bull', 'breakout', 'approval', 'approved',
];

const BEARISH_WORDS = [
  'fall', 'falls', 'fell', 'drop', 'drops', 'dropped',
  'miss', 'misses', 'missed', 'decline', 'declines', 'declined',
  'plunges', 'plunged', 'slumps', 'slumped', 'cuts', 'cut',
  'downgrade', 'downgraded', 'concern', 'concerns', 'loss', 'losses',
  'weak', 'down', 'crash', 'crashed', 'warns', 'warning', 'lawsuit',
  'recession', 'layoffs', 'bankruptcy', 'default',
];

const REF_PRICES: Record<string, number> = {
  BTC: 71000, ETH: 2100, SOL: 89, DOGE: 0.17, XRP: 0.55, ADA: 0.45, AVAX: 25, DOT: 7,
  AAPL: 220, TSLA: 240, NVDA: 875, AMZN: 195, GOOGL: 162, GOOG: 162,
  MSFT: 412, META: 560, NFLX: 620, UBER: 72, BABA: 98,
  JPM: 208, BAC: 40, GS: 530, MS: 97, V: 295, MA: 470,
  PYPL: 65, COIN: 210, AMD: 165, INTC: 25, ORCL: 155, CRM: 295, PLTR: 24,
  XAU: 3100, OIL: 80, SILVER: 31,
  USD: 104, EUR: 1.08, JPY: 149, GBP: 1.27, CNY: 7.23,
  SPY: 525, QQQ: 447,
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return Math.abs(x - Math.floor(x));
}

function detectSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  let bull = 0;
  let bear = 0;
  BULLISH_WORDS.forEach(w => { if (lower.includes(w)) bull++; });
  BEARISH_WORDS.forEach(w => { if (lower.includes(w)) bear++; });
  if (bull > bear) return 'bullish';
  if (bear > bull) return 'bearish';
  return 'neutral';
}

function extractSymbol(related: string, text: string): { symbol: string; name: string } {
  if (related) {
    const candidates = related.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    for (const sym of candidates) {
      if (KNOWN_SYMBOLS[sym]) return { symbol: sym, name: KNOWN_SYMBOLS[sym].name };
      if (sym.length >= 1 && sym.length <= 5 && /^[A-Z]+$/.test(sym)) {
        return { symbol: sym, name: sym };
      }
    }
  }

  const lower = text.toLowerCase();

  if (lower.match(/\bbitcoin\b|\bbtc\b/)) return { symbol: 'BTC', name: 'Bitcoin' };
  if (lower.match(/\bethereum\b|\beth\b/)) return { symbol: 'ETH', name: 'Ethereum' };
  if (lower.match(/\bsolana\b|\bsol\b/)) return { symbol: 'SOL', name: 'Solana' };
  if (lower.match(/\bdogecoin\b|\bdoge\b/)) return { symbol: 'DOGE', name: 'Dogecoin' };
  if (lower.match(/\bxrp\b|\bripple\b/)) return { symbol: 'XRP', name: 'XRP' };

  if (lower.match(/\bnvidia\b|\bnvda\b/)) return { symbol: 'NVDA', name: 'NVIDIA Corp.' };
  if (lower.match(/\bapple\b|\baapl\b/)) return { symbol: 'AAPL', name: 'Apple Inc.' };
  if (lower.match(/\btesla\b|\btsla\b/)) return { symbol: 'TSLA', name: 'Tesla Inc.' };
  if (lower.match(/\bamazon\b|\bamzn\b/)) return { symbol: 'AMZN', name: 'Amazon.com' };
  if (lower.match(/\bmicrosoft\b|\bmsft\b/)) return { symbol: 'MSFT', name: 'Microsoft Corp.' };
  if (lower.match(/\bmeta\b|\bfacebook\b/)) return { symbol: 'META', name: 'Meta Platforms' };
  if (lower.match(/\bgoogle\b|\balphabet\b|\bgoogl\b/)) return { symbol: 'GOOGL', name: 'Alphabet Inc.' };
  if (lower.match(/\bnetflix\b|\bnflx\b/)) return { symbol: 'NFLX', name: 'Netflix Inc.' };
  if (lower.match(/\bcoinbase\b|\bcoin\b/)) return { symbol: 'COIN', name: 'Coinbase' };
  if (lower.match(/\bpalantir\b|\bpltr\b/)) return { symbol: 'PLTR', name: 'Palantir' };

  if (lower.match(/\bjpmorgan\b|\bjpmc\b|\bjpm\b/)) return { symbol: 'JPM', name: 'JPMorgan Chase' };
  if (lower.match(/\bgoldman\b|\bgs\b/)) return { symbol: 'GS', name: 'Goldman Sachs' };

  if (lower.match(/\bgold\b|\bxau\b/)) return { symbol: 'XAU', name: 'Gold' };
  if (lower.match(/\bsilver\b/)) return { symbol: 'SILVER', name: 'Silver' };
  if (lower.match(/\boil\b|\bcrude\b|\bwti\b|\bbrent\b/)) return { symbol: 'OIL', name: 'Crude Oil' };

  if (lower.match(/\bfed\b|\bfederal reserve\b|\bfomc\b|\btreasury\b|\binflation\b|\bcpi\b|\bgdp\b/)) {
    return { symbol: 'USD', name: 'US Dollar' };
  }
  if (lower.match(/\beur\b|\beuro\b|\becb\b/)) return { symbol: 'EUR', name: 'Euro' };
  if (lower.match(/\bjpy\b|\byen\b|\bbank of japan\b/)) return { symbol: 'JPY', name: 'Japanese Yen' };

  return { symbol: 'SPY', name: 'S&P 500' };
}

function detectCategory(finnhubCategory: string, related: string, text: string, symbol: string): Category {
  if (KNOWN_SYMBOLS[symbol]) return KNOWN_SYMBOLS[symbol].category;

  if (finnhubCategory === 'crypto') return 'crypto';
  if (finnhubCategory === 'forex') return 'forex';

  const lower = text.toLowerCase();
  if (lower.match(/\b(fed|federal reserve|fomc|inflation|cpi|gdp|treasury|central bank|rate hike|rate cut)\b/)) return 'macro';
  if (lower.match(/\b(bitcoin|ethereum|crypto|blockchain|defi|nft|solana|xrp|altcoin)\b/)) return 'crypto';
  if (lower.match(/\b(gold|oil|crude|commodity|commodities|wheat|corn|silver|natural gas)\b/)) return 'commodities';
  if (lower.match(/\b(forex|currency|eur\/usd|usd\/jpy|yuan|peso|pound sterling)\b/)) return 'forex';
  return 'stocks';
}

function generateTags(text: string, sentiment: Sentiment): AITag[] {
  const lower = text.toLowerCase();
  const tags: AITag[] = [];

  if (sentiment === 'bullish') tags.push('Bullish');
  else if (sentiment === 'bearish') tags.push('Bearish');

  if (lower.match(/\b(earn|revenue|eps|q[1-4] |quarter|guidance|outlook)\b/)) tags.push('Earnings');
  if (lower.match(/\b(sec |regulat|law|ban |fine |court|lawsuit|antitrust|compliance)\b/)) tags.push('Regulation');
  if (lower.match(/\b(fed |federal reserve|rate hike|rate cut|inflation|cpi|gdp|macro|tariff)\b/)) tags.push('Macro Event');
  if (lower.match(/\b(surge|plunge|crash|volatile|wild swing|spike)\b/)) tags.push('High Volatility');
  if (lower.match(/\b(breakout|all.time high|resistance|support level)\b/)) tags.push('Breakout');
  if (lower.match(/\b(ipo |initial public offering|listing|debut)\b/)) tags.push('IPO');
  if (lower.match(/\b(acqui|merger|buyout|takeover|acquisition|m&a)\b/)) tags.push('M&A');

  return tags.slice(0, 4);
}

function generateMarketReaction(
  articleId: number,
  sentiment: Sentiment,
  symbol: string
): NormalizedNewsItem['marketReaction'] {
  const seed = Math.abs(articleId) * 137 + symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  const direction = sentiment === 'bullish' ? 1 : sentiment === 'bearish' ? -1 : (seededRandom(seed * 7) > 0.5 ? 1 : -1);
  const magnitude = 0.2 + seededRandom(seed * 3) * 4.8;

  const change1h = parseFloat((direction * magnitude).toFixed(2));
  const change30m = parseFloat((direction * magnitude * (0.5 + seededRandom(seed * 11) * 0.35)).toFixed(2));
  const change5m = parseFloat((direction * magnitude * (0.1 + seededRandom(seed * 13) * 0.25)).toFixed(2));

  const priceBefore = REF_PRICES[symbol] ?? 100;
  const priceAfter = parseFloat((priceBefore * (1 + change1h / 100)).toFixed(priceBefore < 1 ? 4 : 2));

  const isForex = ['EUR', 'JPY', 'GBP', 'CNY', 'USD', 'EURUSD', 'USDJPY'].includes(symbol);

  return { priceBefore, priceAfter, change5m, change30m, change1h, currency: isForex ? '' : '$' };
}

export function normalizeFinnhubItems(items: FinnhubNewsItem[]): NormalizedNewsItem[] {
  const now = Date.now() / 1000;
  const seen = new Set<string>();

  return items
    .filter(item => {
      if (!item.headline || item.headline.length < 10) return false;
      const key = item.headline.slice(0, 40).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(item => {
      const text = `${item.headline} ${item.summary ?? ''}`;
      const sentiment = detectSentiment(text);
      const { symbol, name } = extractSymbol(item.related ?? '', text);
      const category = detectCategory(item.category, item.related ?? '', text, symbol);
      const tags = generateTags(text, sentiment);
      const marketReaction = generateMarketReaction(item.id, sentiment, symbol);
      const isBreaking = now - item.datetime < 2 * 60 * 60;

      return {
        id: item.id.toString(),
        headline: item.headline,
        summary: item.summary?.trim() || item.headline,
        source: item.source,
        publishedAt: new Date(item.datetime * 1000).toISOString(),
        assetSymbol: symbol,
        assetName: name,
        category,
        sentiment,
        marketReaction,
        tags,
        isBreaking,
        url: item.url,
      };
    });
}
