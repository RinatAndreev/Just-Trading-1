import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  buyPrice: number;
  addedAt: string;
}

interface PortfolioContextValue {
  positions: PortfolioPosition[];
  addPosition: (pos: PortfolioPosition) => void;
  removePosition: (symbol: string) => void;
  updatePosition: (symbol: string, updates: Partial<PortfolioPosition>) => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);
const STORAGE_KEY = 'jt_portfolio';

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) setPositions(JSON.parse(raw));
    }).catch(() => {});
  }, []);

  function persist(updated: PortfolioPosition[]) {
    setPositions(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  }

  function addPosition(pos: PortfolioPosition) {
    const existing = positions.findIndex(p => p.symbol === pos.symbol);
    if (existing >= 0) {
      const updated = [...positions];
      const old = updated[existing];
      const totalQty = old.quantity + pos.quantity;
      const avgPrice = (old.quantity * old.buyPrice + pos.quantity * pos.buyPrice) / totalQty;
      updated[existing] = { ...old, quantity: totalQty, buyPrice: avgPrice };
      persist(updated);
    } else {
      persist([...positions, pos]);
    }
  }

  function removePosition(symbol: string) {
    persist(positions.filter(p => p.symbol !== symbol));
  }

  function updatePosition(symbol: string, updates: Partial<PortfolioPosition>) {
    persist(positions.map(p => p.symbol === symbol ? { ...p, ...updates } : p));
  }

  return (
    <PortfolioContext.Provider value={{ positions, addPosition, removePosition, updatePosition }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
}
