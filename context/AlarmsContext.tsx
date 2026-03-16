import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface PriceAlarm {
  id: string;
  symbol: string;
  assetName: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
  currency: string;
}

interface AlarmsContextValue {
  alarms: PriceAlarm[];
  addAlarm: (alarm: Omit<PriceAlarm, 'id' | 'createdAt'>) => void;
  removeAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  checkAndTriggerAlarms: (prices: Record<string, number>) => void;
  activeAlarmCount: number;
  canAddAlarm: (subscription: string) => boolean;
}

const AlarmsContext = createContext<AlarmsContextValue | null>(null);
const STORAGE_KEY = 'jt_alarms';
const FREE_ALARM_LIMIT = 3;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function sendLocalNotification(alarm: PriceAlarm, currentPrice: number) {
  const granted = await requestNotificationPermission();
  if (!granted) return;
  const dir = alarm.condition === 'above' ? 'above' : 'below';
  const sign = alarm.currency === '$' ? '$' : '';
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Price Alert: ${alarm.symbol}`,
      body: `${alarm.symbol} is now ${sign}${currentPrice.toFixed(alarm.targetPrice < 1 ? 4 : 2)} — ${dir} your target of ${sign}${alarm.targetPrice}`,
      data: { symbol: alarm.symbol },
    },
    trigger: null,
  });
}

export function AlarmsProvider({ children }: { children: ReactNode }) {
  const [alarms, setAlarms] = useState<PriceAlarm[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => { if (raw) setAlarms(JSON.parse(raw)); })
      .catch(() => {});
  }, []);

  function persist(updated: PriceAlarm[]) {
    setAlarms(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  }

  function addAlarm(alarm: Omit<PriceAlarm, 'id' | 'createdAt'>) {
    const newAlarm: PriceAlarm = {
      ...alarm,
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      createdAt: new Date().toISOString(),
    };
    persist([...alarms, newAlarm]);
  }

  function removeAlarm(id: string) {
    persist(alarms.filter(a => a.id !== id));
  }

  function toggleAlarm(id: string) {
    persist(alarms.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  }

  function checkAndTriggerAlarms(prices: Record<string, number>) {
    let changed = false;
    const updated = alarms.map(alarm => {
      if (!alarm.isActive || alarm.triggeredAt) return alarm;
      const price = prices[alarm.symbol];
      if (price === undefined) return alarm;
      const triggered =
        (alarm.condition === 'above' && price >= alarm.targetPrice) ||
        (alarm.condition === 'below' && price <= alarm.targetPrice);
      if (triggered) {
        changed = true;
        sendLocalNotification(alarm, price);
        return { ...alarm, triggeredAt: new Date().toISOString(), isActive: false };
      }
      return alarm;
    });
    if (changed) persist(updated);
  }

  const activeAlarmCount = alarms.filter(a => a.isActive && !a.triggeredAt).length;

  function canAddAlarm(subscription: string): boolean {
    if (subscription === 'pro') return true;
    return activeAlarmCount < FREE_ALARM_LIMIT;
  }

  return (
    <AlarmsContext.Provider value={{ alarms, addAlarm, removeAlarm, toggleAlarm, checkAndTriggerAlarms, activeAlarmCount, canAddAlarm }}>
      {children}
    </AlarmsContext.Provider>
  );
}

export function useAlarms() {
  const ctx = useContext(AlarmsContext);
  if (!ctx) throw new Error('useAlarms must be used within AlarmsProvider');
  return ctx;
}
