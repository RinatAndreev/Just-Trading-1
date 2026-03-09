import { NewsItem } from '@/constants/types';
import { MOCK_NEWS } from '@/constants/mockData';
import { getApiUrl } from '@/lib/query-client';

export interface NewsServiceResult {
  items: NewsItem[];
  source: 'live' | 'cache';
}

let cachedNews: NewsItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function fetchNews(): Promise<NewsServiceResult> {
  const now = Date.now();
  if (cachedNews && now - cacheTimestamp < CACHE_TTL) {
    return { items: cachedNews, source: 'cache' };
  }

  try {
    const url = new URL('/api/news', getApiUrl());
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        cachedNews = data;
        cacheTimestamp = now;
        return { items: data, source: 'live' };
      }
    }
  } catch {}

  return { items: MOCK_NEWS, source: 'cache' };
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
