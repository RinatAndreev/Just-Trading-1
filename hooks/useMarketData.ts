import { useQuery } from '@tanstack/react-query';
import { MOCK_ASSETS } from '@/constants/mockData';
import { Asset } from '@/constants/types';
import { getApiUrl } from '@/lib/query-client';

export const MARKET_OVERVIEW_SYMBOLS = ['SPY', 'QQQ', 'DIA', 'BTC', 'ETH', 'XAU', 'OIL'];

export interface MarketOverviewItem {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  currency: string;
  category: string;
}

export interface CryptoPrice {
  symbol: string;
  price: number;
  changePercent24h: number;
}

const OVERVIEW_FALLBACK: MarketOverviewItem[] = [
  { symbol: 'SPY', name: 'S&P 500', price: 524.80, changePercent: 0.42, currency: '$', category: 'stocks' },
  { symbol: 'QQQ', name: 'NASDAQ 100', price: 447.20, changePercent: 0.85, currency: '$', category: 'stocks' },
  { symbol: 'DIA', name: 'Dow Jones', price: 393.40, changePercent: 0.21, currency: '$', category: 'stocks' },
  { symbol: 'BTC', name: 'Bitcoin', price: 95400, changePercent: 3.59, currency: '$', category: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', price: 3690, changePercent: 6.03, currency: '$', category: 'crypto' },
  { symbol: 'XAU', name: 'Gold', price: 2198, changePercent: 1.57, currency: '$', category: 'commodities' },
  { symbol: 'OIL', name: 'Crude Oil', price: 79.60, changePercent: -3.40, currency: '$', category: 'commodities' },
];

export function useMarketOverview() {
  return useQuery<MarketOverviewItem[]>({
    queryKey: ['/api/market/overview'],
    queryFn: async () => {
      try {
        const url = new URL('/api/market/overview', getApiUrl());
        const res = await fetch(url.toString(), { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) return data;
        }
      } catch {}
      return OVERVIEW_FALLBACK;
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useCryptoPrices() {
  return useQuery<CryptoPrice[]>({
    queryKey: ['/api/market/crypto-prices'],
    queryFn: async () => {
      try {
        const url = new URL('/api/market/crypto-prices', getApiUrl());
        const res = await fetch(url.toString(), { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) return data;
        }
      } catch {}
      return [];
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useAssets() {
  return useQuery<Asset[]>({
    queryKey: ['/api/assets'],
    queryFn: async () => MOCK_ASSETS,
    staleTime: 60 * 1000,
  });
}

export function useAsset(symbol: string) {
  const { data = MOCK_ASSETS } = useAssets();
  return data.find(a => a.symbol === symbol?.toUpperCase()) ?? null;
}
