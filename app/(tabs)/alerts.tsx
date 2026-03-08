import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Switch, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { MOCK_NEWS } from '@/constants/mockData';

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const { notifications, updateNotifications, watchlist, subscription } = useApp();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const recentAlerts = MOCK_NEWS.filter(n => n.isBreaking || n.sentiment === 'bullish')
    .slice(0, 5);

  function toggle(key: keyof typeof notifications) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateNotifications({ [key]: !notifications[key] });
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topInset }]}
      contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'web' ? 34 + 84 : insets.bottom + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.subtitle}>Notification preferences</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NOTIFICATION SETTINGS</Text>
        <View style={styles.card}>
          {([
            { key: 'breakingNews', label: 'Breaking News', subtitle: 'Instant alerts for major events', icon: 'flash' },
            { key: 'watchlistAlerts', label: 'Watchlist Alerts', subtitle: 'News for your tracked assets', icon: 'eye' },
            { key: 'marketOpen', label: 'Market Open', subtitle: 'Daily market open summary', icon: 'time' },
            { key: 'dailyDigest', label: 'Daily Digest', subtitle: 'End of day summary', icon: 'mail' },
          ] as const).map((item, index, arr) => (
            <View key={item.key}>
              <View style={styles.settingRow}>
                <View style={[styles.settingIconBg]}>
                  <Ionicons name={item.icon} size={16} color={Colors.accent} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                </View>
                <Switch
                  value={notifications[item.key]}
                  onValueChange={() => toggle(item.key)}
                  trackColor={{ false: Colors.backgroundTertiary, true: Colors.accentDim }}
                  thumbColor={notifications[item.key] ? Colors.accent : Colors.textMuted}
                  ios_backgroundColor={Colors.backgroundTertiary}
                />
              </View>
              {index < arr.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>
      </View>

      {watchlist.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TRACKED ASSETS</Text>
          <View style={styles.card}>
            {watchlist.map((w, index) => (
              <View key={w.symbol}>
                <View style={styles.assetRow}>
                  <View style={styles.assetIconBg}>
                    <Text style={styles.assetSymbolText}>{w.symbol.charAt(0)}</Text>
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>{w.symbol}</Text>
                    <Text style={styles.settingSubtitle}>Alerts enabled</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.bullish} />
                </View>
                {index < watchlist.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>RECENT ALERTS</Text>
        <View style={styles.card}>
          {recentAlerts.length === 0 ? (
            <View style={styles.emptyAlerts}>
              <Ionicons name="notifications-off-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No recent alerts</Text>
            </View>
          ) : (
            recentAlerts.map((item, index) => (
              <View key={item.id}>
                <View style={styles.alertRow}>
                  <View style={[
                    styles.alertDot,
                    { backgroundColor: item.isBreaking ? Colors.accent : Colors.bullish },
                  ]} />
                  <View style={styles.alertContent}>
                    <View style={styles.alertMeta}>
                      <Text style={styles.alertSource}>{item.assetSymbol}</Text>
                      <Text style={styles.alertTime}>{timeAgo(item.publishedAt)}</Text>
                    </View>
                    <Text style={styles.alertHeadline} numberOfLines={2}>{item.headline}</Text>
                  </View>
                </View>
                {index < recentAlerts.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))
          )}
        </View>
      </View>

      {subscription === 'free' && (
        <View style={styles.proBanner}>
          <Ionicons name="star" size={18} color={Colors.pro} />
          <View style={styles.proBannerText}>
            <Text style={styles.proBannerTitle}>Pro Priority Alerts</Text>
            <Text style={styles.proBannerSubtitle}>Get notified faster with Pro plan</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.pro} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { gap: 0 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted,
    letterSpacing: 0.8, marginBottom: 8, paddingHorizontal: 4,
  },
  card: {
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  settingIconBg: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.accentDim,
    alignItems: 'center', justifyContent: 'center',
  },
  settingInfo: { flex: 1, gap: 2 },
  settingLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  settingSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  rowDivider: { height: 1, backgroundColor: Colors.separator, marginLeft: 60 },
  assetRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  assetIconBg: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.backgroundTertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  assetSymbolText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.accent },
  alertRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  alertDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  alertContent: { flex: 1, gap: 4 },
  alertMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertSource: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.accent },
  alertTime: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  alertHeadline: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 18 },
  emptyAlerts: { alignItems: 'center', padding: 24, gap: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  proBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: Colors.proDim, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  proBannerText: { flex: 1 },
  proBannerTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.pro },
  proBannerSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
});
