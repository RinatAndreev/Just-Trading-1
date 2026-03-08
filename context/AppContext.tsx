import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WatchlistEntry, SubscriptionTier, NotificationSettings, Category } from '@/constants/types';

const STORAGE_KEYS = {
  WATCHLIST: 'jt_watchlist',
  SUBSCRIPTION: 'jt_subscription',
  NOTIFICATIONS: 'jt_notifications',
  ACTIVE_CATEGORIES: 'jt_categories',
  USER: 'jt_user',
  REGISTERED_USERS: 'jt_registered_users',
};

export interface UserAccount {
  name: string;
  email: string;
}

interface AppContextValue {
  watchlist: WatchlistEntry[];
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  isInWatchlist: (symbol: string) => boolean;
  canAddToWatchlist: boolean;
  subscription: SubscriptionTier;
  upgradeToPro: () => void;
  downgradeToFree: () => void;
  notifications: NotificationSettings;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  activeCategories: Category[];
  toggleCategory: (category: Category) => void;
  isLoaded: boolean;
  user: UserAccount | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  breakingNews: true,
  watchlistAlerts: true,
  marketOpen: false,
  dailyDigest: false,
};

const ALL_CATEGORIES: Category[] = ['stocks', 'crypto', 'commodities', 'forex', 'macro'];
const FREE_WATCHLIST_LIMIT = 2;

export function AppProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionTier>('free');
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [activeCategories, setActiveCategories] = useState<Category[]>(ALL_CATEGORIES);
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<UserAccount | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [wl, sub, notifs, cats, usr] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.WATCHLIST),
          AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION),
          AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
          AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_CATEGORIES),
          AsyncStorage.getItem(STORAGE_KEYS.USER),
        ]);
        if (wl) setWatchlist(JSON.parse(wl));
        if (sub) setSubscription(JSON.parse(sub));
        if (notifs) setNotifications(JSON.parse(notifs));
        if (cats) setActiveCategories(JSON.parse(cats));
        if (usr) setUser(JSON.parse(usr));
      } catch {}
      setIsLoaded(true);
    }
    load();
  }, []);

  const canAddToWatchlist = subscription === 'pro' || watchlist.length < FREE_WATCHLIST_LIMIT;

  function addToWatchlist(symbol: string) {
    if (!canAddToWatchlist) return;
    const entry: WatchlistEntry = { symbol, addedAt: new Date().toISOString() };
    const updated = [...watchlist, entry];
    setWatchlist(updated);
    AsyncStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(updated));
  }

  function removeFromWatchlist(symbol: string) {
    const updated = watchlist.filter(w => w.symbol !== symbol);
    setWatchlist(updated);
    AsyncStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(updated));
  }

  function isInWatchlist(symbol: string) {
    return watchlist.some(w => w.symbol === symbol);
  }

  function upgradeToPro() {
    setSubscription('pro');
    AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify('pro'));
  }

  function downgradeToFree() {
    const trimmed = watchlist.slice(0, FREE_WATCHLIST_LIMIT);
    setWatchlist(trimmed);
    setSubscription('free');
    AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify('free'));
    AsyncStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(trimmed));
  }

  function updateNotifications(settings: Partial<NotificationSettings>) {
    const updated = { ...notifications, ...settings };
    setNotifications(updated);
    AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  }

  function toggleCategory(category: Category) {
    let updated: Category[];
    if (activeCategories.includes(category)) {
      if (activeCategories.length === 1) return;
      updated = activeCategories.filter(c => c !== category);
    } else {
      updated = [...activeCategories, category];
    }
    setActiveCategories(updated);
    AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_CATEGORIES, JSON.stringify(updated));
  }

  async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
      const users: Array<{ name: string; email: string; password: string }> = raw ? JSON.parse(raw) : [];
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!found) return { success: false, error: 'No account found with this email.' };
      if (found.password !== password) return { success: false, error: 'Incorrect password.' };
      const account: UserAccount = { name: found.name, email: found.email };
      setUser(account);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(account));
      return { success: true };
    } catch {
      return { success: false, error: 'Something went wrong. Please try again.' };
    }
  }

  async function register(name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
      const users: Array<{ name: string; email: string; password: string }> = raw ? JSON.parse(raw) : [];
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, error: 'An account with this email already exists.' };
      }
      users.push({ name, email, password });
      await AsyncStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
      const account: UserAccount = { name, email };
      setUser(account);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(account));
      return { success: true };
    } catch {
      return { success: false, error: 'Something went wrong. Please try again.' };
    }
  }

  function logout() {
    setUser(null);
    AsyncStorage.removeItem(STORAGE_KEYS.USER);
  }

  const value = useMemo(() => ({
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    canAddToWatchlist,
    subscription,
    upgradeToPro,
    downgradeToFree,
    notifications,
    updateNotifications,
    activeCategories,
    toggleCategory,
    isLoaded,
    user,
    login,
    register,
    logout,
  }), [watchlist, subscription, notifications, activeCategories, isLoaded, canAddToWatchlist, user]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
