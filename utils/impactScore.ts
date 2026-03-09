import { NewsItem } from '@/constants/types';

const HIGH_IMPACT_KEYWORDS = [
  'fed', 'federal reserve', 'rate hike', 'rate cut', 'inflation', 'cpi', 'gdp',
  'earnings', 'revenue', 'guidance', 'beats', 'misses', 'record',
  'etf', 'approval', 'sec', 'regulation', 'ban', 'lawsuit',
  'acquisition', 'merger', 'm&a', 'buyout', 'ipo',
  'bankruptcy', 'default', 'crisis', 'crash', 'collapse',
  'all-time high', 'all-time low', 'breakout', 'surge', 'plunge',
  'war', 'sanctions', 'embargo', 'geopolitical',
];

const MEDIUM_IMPACT_KEYWORDS = [
  'upgrade', 'downgrade', 'analyst', 'target', 'price target',
  'partnership', 'contract', 'deal', 'agreement',
  'launch', 'release', 'update', 'announcement',
  'quarterly', 'annual', 'report', 'results',
  'dividend', 'split', 'buyback', 'repurchase',
  'ceo', 'executive', 'management', 'resign', 'appoint',
];

export function calculateImpactScore(item: NewsItem): number {
  const text = `${item.headline} ${item.summary}`.toLowerCase();
  let score = 3;

  for (const kw of HIGH_IMPACT_KEYWORDS) {
    if (text.includes(kw)) score += 1.5;
  }
  for (const kw of MEDIUM_IMPACT_KEYWORDS) {
    if (text.includes(kw)) score += 0.7;
  }

  if (item.isBreaking) score += 1.5;
  if (item.tags.includes('Earnings')) score += 1;
  if (item.tags.includes('Regulation')) score += 1;
  if (item.tags.includes('High Volatility')) score += 0.8;
  if (item.tags.includes('Macro Event')) score += 1.2;

  const absChange = Math.abs(item.marketReaction.change1h);
  if (absChange > 5) score += 2;
  else if (absChange > 2) score += 1;
  else if (absChange > 1) score += 0.5;

  return Math.min(10, Math.max(1, Math.round(score)));
}

export function getImpactColor(score: number): string {
  if (score >= 8) return '#FF4A5A';
  if (score >= 6) return '#FF7A1A';
  if (score >= 4) return '#FFD700';
  return '#00C878';
}

export function getImpactLabel(score: number): string {
  if (score >= 9) return 'Critical';
  if (score >= 7) return 'High';
  if (score >= 5) return 'Medium';
  if (score >= 3) return 'Low';
  return 'Minimal';
}
