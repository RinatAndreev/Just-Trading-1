import { usePortfolio, PortfolioPosition } from '@/context/PortfolioContext';
import { useAssets } from './useMarketData';

export interface EnrichedPosition extends PortfolioPosition {
  name: string;
  currentPrice: number;
  changePercent24h: number;
  currency: string;
  currentValue: number;
  costBasis: number;
  pnl: number;
  pnlPct: number;
  category: string;
}

export function useEnrichedPortfolio() {
  const { positions, addPosition, removePosition, updatePosition } = usePortfolio();
  const { data: assets = [] } = useAssets();

  const enriched: EnrichedPosition[] = positions.map(pos => {
    const asset = assets.find(a => a.symbol === pos.symbol);
    const currentPrice = asset?.price ?? pos.buyPrice;
    const currentValue = currentPrice * pos.quantity;
    const costBasis = pos.buyPrice * pos.quantity;
    const pnl = currentValue - costBasis;
    const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    return {
      ...pos,
      name: asset?.name ?? pos.symbol,
      currentPrice,
      changePercent24h: asset?.changePercent24h ?? 0,
      currency: asset?.currency ?? '$',
      currentValue,
      costBasis,
      pnl,
      pnlPct,
      category: asset?.category ?? 'stocks',
    };
  });

  const totalValue = enriched.reduce((s, p) => s + p.currentValue, 0);
  const totalCost = enriched.reduce((s, p) => s + p.costBasis, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  const topPerformer = enriched.length > 0
    ? [...enriched].sort((a, b) => b.pnlPct - a.pnlPct)[0]
    : null;

  const worstPerformer = enriched.length > 0
    ? [...enriched].sort((a, b) => a.pnlPct - b.pnlPct)[0]
    : null;

  return {
    positions,
    enriched,
    totalValue,
    totalCost,
    totalPnl,
    totalPnlPct,
    topPerformer,
    worstPerformer,
    addPosition,
    removePosition,
    updatePosition,
  };
}
