import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Modal, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { Asset } from '@/constants/types';
import { WatchlistItem } from '@/components/WatchlistItem';
import { AssetPickerSheet } from '@/components/AssetPickerSheet';
import { useApp } from '@/context/AppContext';
import { MOCK_ASSETS } from '@/constants/mockData';

export default function WatchlistScreen() {
  const insets = useSafeAreaInsets();
  const { watchlist, addToWatchlist, removeFromWatchlist, canAddToWatchlist, subscription, upgradeToPro } = useApp();
  const [showPicker, setShowPicker] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const watchedAssets = watchlist.map(w =>
    MOCK_ASSETS.find(a => a.symbol === w.symbol)
  ).filter(Boolean) as Asset[];

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  function handleAddPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!canAddToWatchlist && subscription === 'free') {
      setShowUpgradeModal(true);
    } else {
      setShowPicker(true);
    }
  }

  function handleSelectAsset(asset: Asset) {
    if (!canAddToWatchlist) {
      setShowPicker(false);
      setShowUpgradeModal(true);
      return;
    }
    addToWatchlist(asset.symbol);
    setShowPicker(false);
  }

  const alreadyAdded = watchlist.map(w => w.symbol);

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Watchlist</Text>
          <Text style={styles.subtitle}>
            {subscription === 'free'
              ? `${watchlist.length}/2 assets · Free plan`
              : `${watchlist.length} assets · Pro plan`}
          </Text>
        </View>
        <Pressable onPress={handleAddPress} style={styles.addBtn} testID="watchlist-add">
          <Ionicons name="add" size={20} color={Colors.accent} />
        </Pressable>
      </View>

      {subscription === 'free' && (
        <Pressable onPress={() => setShowUpgradeModal(true)} style={styles.proBanner}>
          <Ionicons name="star" size={14} color={Colors.pro} />
          <Text style={styles.proBannerText}>Upgrade to Pro for unlimited assets</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.pro} />
        </Pressable>
      )}

      <FlatList
        data={watchedAssets}
        keyExtractor={item => item.symbol}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === 'web' ? 34 + 84 : insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="eye-outline" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
            <Text style={styles.emptyText}>Add assets to track their price and news</Text>
            <Pressable onPress={handleAddPress} style={styles.emptyAddBtn} testID="watchlist-empty-add">
              <Text style={styles.emptyAddBtnText}>Add Asset</Text>
            </Pressable>
          </View>
        )}
        renderItem={({ item }) => (
          <WatchlistItem
            asset={item}
            onRemove={() => removeFromWatchlist(item.symbol)}
          />
        )}
      />

      <AssetPickerSheet
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleSelectAsset}
        excludeSymbols={alreadyAdded}
        title="Add to Watchlist"
      />

      <Modal
        visible={showUpgradeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.upgradeSheet, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 8 }]}>
            <View style={styles.upgradeIconRow}>
              <View style={styles.upgradeIconBg}>
                <Ionicons name="star" size={28} color={Colors.pro} />
              </View>
            </View>
            <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
            <Text style={styles.upgradeSubtitle}>
              Free plan includes 2 assets. Go Pro for unlimited watchlist entries and advanced features.
            </Text>
            <View style={styles.featuresList}>
              {['Unlimited watchlist assets', 'Unlimited price alarms', 'Advanced chart timeframes', 'Priority news feed'].map(f => (
                <View key={f} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.bullish} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
            <Pressable
              onPress={() => { upgradeToPro(); setShowUpgradeModal(false); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
              style={({ pressed }) => [styles.upgradeBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
            </Pressable>
            <Pressable onPress={() => setShowUpgradeModal(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Not now</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accentDim, borderWidth: 1, borderColor: Colors.accentDimBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  proBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: Colors.proDim, borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)', paddingHorizontal: 14, paddingVertical: 10,
  },
  proBannerText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.pro },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  emptyText: {
    fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted,
    textAlign: 'center', paddingHorizontal: 40,
  },
  emptyAddBtn: {
    marginTop: 8, backgroundColor: Colors.accent,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10,
  },
  emptyAddBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.white },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  upgradeSheet: {
    backgroundColor: Colors.backgroundSecondary,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 20, paddingHorizontal: 24, alignItems: 'center',
  },
  upgradeIconRow: { marginBottom: 16 },
  upgradeIconBg: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: Colors.proDim, alignItems: 'center', justifyContent: 'center',
  },
  upgradeTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 6 },
  upgradeSubtitle: {
    fontSize: 14, fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary, textAlign: 'center', marginBottom: 24,
  },
  featuresList: { width: '100%', gap: 12, marginBottom: 28 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  upgradeBtn: {
    width: '100%', backgroundColor: Colors.pro,
    paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 10,
  },
  upgradeBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.black },
  cancelBtn: { paddingVertical: 10 },
  cancelBtnText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
});
