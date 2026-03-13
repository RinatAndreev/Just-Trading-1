import { useQuery } from '@tanstack/react-query';
import { MOCK_NEWS } from '@/constants/mockData';
import { NewsItem, Category } from '@/constants/types';
import { getTopMovers } from '@/services/newsService';

export function useNews() {
  return useQuery<NewsItem[]>({
    queryKey: ['/api/news'],
    queryFn: async () => MOCK_NEWS,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useFilteredNews(category: Category | 'all', activeCategories: Category[], search: string) {
  const { data = MOCK_NEWS } = useNews();

  return data.filter(item => {
    if (category !== 'all' && item.category !== category) return false;
    if (!activeCategories.includes(item.category)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.headline.toLowerCase().includes(q) ||
        item.assetSymbol.toLowerCase().includes(q) ||
        item.assetName.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

export function useTopMovers(limit = 5) {
  const { data = MOCK_NEWS } = useNews();
  return getTopMovers(data, limit);
}

export function useNewsBySymbol(symbol: string) {
  const { data = MOCK_NEWS } = useNews();
  return data.filter(n => n.assetSymbol === symbol);
}
