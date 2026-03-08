import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Modal, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { MOCK_ASSETS } from '@/constants/mockData';
import { Asset } from '@/constants/types';
import { WatchlistItem } from '@/components/WatchlistItem';
import { AssetTag } from '@/components/AssetTag';
import { useApp } from '@/context/AppContext';

export default function WatchlistScreen() {
  const insets = useSafeAreaInsets();
  const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, canAddToWatchlist, subscription } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { upgradeToPro } = useApp();

  const watchedAssets = watchlist.map(w =>
    MOCK_ASSETS.find(a => a.symbol === w.symbol)
  ).filter(Boolean) as Asset[];

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  function handleAddPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!canAddToWatchlist && subscription === 'free') {
      setShowUpgradeModal(true);
    } else {
      setShowAddModal(true);
    }
  }

  function handleAddAsset(symbol: string) {
    if (!canAddToWatchlist) {
      setShowAddModal(false);
      setShowUpgradeModal(true);
      return;
    }
    addToWatchlist(symbol);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAddModal(false);
  }

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
        <Pressable onPress={handleAddPress} style={styles.addBtn}>
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
            <Pressable onPress={handleAddPress} style={styles.emptyAddBtn}>
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

      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Asset</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <FlatList
              data={MOCK_ASSETS.filter(a => !isInWatchlist(a.symbol))}
              keyExtractor={a => a.symbol}
              contentContainerStyle={styles.modalList}
              ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
              ListEmptyComponent={() => (
                <Text style={styles.allAddedText}>All available assets are in your watchlist</Text>
              )}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleAddAsset(item.symbol)}
                  style={({ pressed }) => [styles.assetRow, pressed && styles.assetRowPressed]}
                >
                  <AssetTag symbol={item.symbol} assetName={item.name} size="md" />
                  <View style={styles.assetPriceInfo}>
                    <Text style={styles.assetPrice}>
                      {item.currency}{item.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </Text>
                    <Text style={[
                      styles.assetChange,
                      { color: item.changePercent24h >= 0 ? Colors.bullish : Colors.bearish },
                    ]}>
                      {item.changePercent24h >= 0 ? '+' : ''}{item.changePercent24h.toFixed(2)}%
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showUpgradeModal} transparent animationType="fade" onRequestClose={() => setShowUpgradeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.upgradeSheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.upgradeIconRow}>
              <View style={styles.upgradeIconBg}>
                <Ionicons name="star" size={28} color={Colors.pro} />
              </View>
            </View>
            <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
            <Text style={styles.upgradeSubtitle}>Unlock unlimited asset tracking and more</Text>
            <View style={styles.featuresList}>
              {[
                'Unlimited tracked assets',
                'Advanced filtering',
                'Priority alerts',
                'No restrictions',
              ].map(f => (
                <View key={f} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.bullish} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
            <Pressable
              onPress={() => { upgradeToPro(); setShowUpgradeModal(false); }}
              style={styles.upgradeBtn}
            >
              <Text style={styles.upgradeBtnText}>Upgrade — $10/month</Text>
            </Pressable>
            <Pressable onPress={() => setShowUpgradeModal(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Maybe later</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  addBtn: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.accentDim, borderRadius: 10, borderWidth: 1, borderColor: Colors.accentDimBorder,
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
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
  emptyAddBtn: {
    marginTop: 8, backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10,
  },
  emptyAddBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.white },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.backgroundSecondary, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 12, maxHeight: '80%',
  },
  modalHandle: { width: 36, height: 4, backgroundColor: Colors.cardBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  modalList: { paddingHorizontal: 16 },
  modalDivider: { height: 1, backgroundColor: Colors.separator, marginVertical: 2 },
  assetRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 4,
  },
  assetRowPressed: { opacity: 0.7 },
  assetPriceInfo: { alignItems: 'flex-end', gap: 2 },
  assetPrice: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  assetChange: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  allAddedText: { textAlign: 'center', color: Colors.textMuted, fontFamily: 'Inter_400Regular', fontSize: 14, paddingVertical: 40 },
  upgradeSheet: {
    backgroundColor: Colors.backgroundSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 20, paddingHorizontal: 24, alignItems: 'center',
  },
  upgradeIconRow: { marginBottom: 16 },
  upgradeIconBg: { width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.proDim, alignItems: 'center', justifyContent: 'center' },
  upgradeTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 6 },
  upgradeSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  featuresList: { width: '100%', gap: 12, marginBottom: 28 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  upgradeBtn: {
    width: '100%', backgroundColor: Colors.pro, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 10,
  },
  upgradeBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.black },
  cancelBtn: { paddingVertical: 10 },
  cancelBtnText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
});
