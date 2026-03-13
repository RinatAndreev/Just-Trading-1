import { NewsItem } from '@/constants/types';
import { MOCK_NEWS } from '@/constants/mockData';
import { getApiUrl } from '@/lib/query-client';

export type NewsSource = 'live' | 'mock' | 'cache';

export interface NewsServiceResult {
  items: NewsItem[];
  source: NewsSource;
  fetchedAt: number;
}

let cachedNews: NewsItem[] | null = null;
let cacheTimestamp = 0;
let cacheSource: NewsSource = 'mock';
const CACHE_TTL = 5 * 60 * 1000;

export function clearCache(): void {
  cachedNews = null;
  cacheTimestamp = 0;
  cacheSource = 'mock';
}

export function getNewsSource(): NewsSource {
  return cacheSource;
}

export function isLiveNewsAvailable(): boolean {
  return cacheSource === 'live';
}

export async function fetchNews(): Promise<NewsServiceResult> {
  const now = Date.now();
  if (cachedNews && now - cacheTimestamp < CACHE_TTL) {
    return { items: cachedNews, source: cacheSource, fetchedAt: cacheTimestamp };
  }

  try {
    const url = new URL('/api/news', getApiUrl());
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        cachedNews = data as NewsItem[];
        cacheTimestamp = now;
        cacheSource = 'live';
        return { items: cachedNews, source: 'live', fetchedAt: now };
      }
    }
  } catch {
  }

  cacheSource = 'mock';
  return { items: MOCK_NEWS, source: 'mock', fetchedAt: now };
}

export function sortByImpact(news: NewsItem[]): NewsItem[] {
  return [...news].sort((a, b) => {
    const aImpact = Math.abs(a.marketReaction.change1h);
    const bImpact = Math.abs(b.marketReaction.change1h);
    return bImpact - aImpact;
  });
}

export function getTopMovers(news: NewsItem[], limit = 5): NewsItem[] {
  return sortByImpact(news).slice(0, limit);
}

export function filterByCategory(news: NewsItem[], category: string): NewsItem[] {
  if (!category || category === 'all') return news;
  return news.filter(item => item.category === category);
}

export function filterBySymbol(news: NewsItem[], symbol: string): NewsItem[] {
  const upper = symbol.toUpperCase();
  return news.filter(item => item.assetSymbol.toUpperCase() === upper);
}

export function searchNews(news: NewsItem[], query: string): NewsItem[] {
  if (!query.trim()) return news;
  const lower = query.toLowerCase();
  return news.filter(
    item =>
      item.headline.toLowerCase().includes(lower) ||
      item.assetSymbol.toLowerCase().includes(lower) ||
      item.assetName.toLowerCase().includes(lower) ||
      item.source.toLowerCase().includes(lower) ||
      item.tags.some(t => t.toLowerCase().includes(lower))
  );
}
