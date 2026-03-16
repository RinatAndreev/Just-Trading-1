import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, FlatList, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { MOCK_ASSETS, CATEGORIES } from '@/constants/mockData';
import { Asset, Category } from '@/constants/types';
import { formatPrice, formatChange } from '@/utils/formatters';

const CATEGORY_COLORS: Record<string, string> = {
  stocks: Colors.accent,
  crypto: '#64B4FF',
  commodities: '#FFD700',
  forex: '#00C878',
  macro: '#C864FF',
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (asset: Asset) => void;
  excludeSymbols?: string[];
  title?: string;
}

export function AssetPickerSheet({ visible, onClose, onSelect, excludeSymbols = [], title = 'Add Asset' }: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'category' | 'assets'>('category');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  function handleCategoryPress(catKey: Category) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(catKey);
    setStep('assets');
  }

  function handleClose() {
    setStep('category');
    setSelectedCategory(null);
    onClose();
  }

  function handleBack() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep('category');
    setSelectedCategory(null);
  }

  function handleAssetSelect(asset: Asset) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSelect(asset);
    setStep('category');
    setSelectedCategory(null);
  }

  const filteredAssets = selectedCategory
    ? MOCK_ASSETS.filter(a => a.category === selectedCategory && !excludeSymbols.includes(a.symbol))
    : [];

  const selectedCategoryInfo = CATEGORIES.find(c => c.key === selectedCategory);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 8 }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            {step === 'assets' ? (
              <Pressable onPress={handleBack} hitSlop={8} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
              </Pressable>
            ) : (
              <View style={{ width: 32 }} />
            )}
            <Text style={styles.headerTitle}>
              {step === 'category' ? title : selectedCategoryInfo?.label ?? ''}
            </Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </Pressable>
          </View>

          {step === 'category' ? (
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => {
                const count = MOCK_ASSETS.filter(a => a.category === cat.key && !excludeSymbols.includes(a.symbol)).length;
                const color = CATEGORY_COLORS[cat.key] ?? Colors.accent;
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => handleCategoryPress(cat.key as Category)}
                    style={({ pressed }) => [styles.categoryCard, { borderColor: color + '40' }, pressed && { opacity: 0.75 }]}
                  >
                    <View style={[styles.categoryIconBg, { backgroundColor: color + '20' }]}>
                      <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={22} color={color} />
                    </View>
                    <Text style={styles.categoryLabel}>{cat.label}</Text>
                    <Text style={[styles.categoryCount, { color }]}>{count} assets</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            filteredAssets.length === 0 ? (
              <View style={styles.emptyMsg}>
                <Text style={styles.emptyMsgText}>No more assets to add</Text>
              </View>
            ) : (
              <FlatList
                data={filteredAssets}
                keyExtractor={a => a.symbol}
                contentContainerStyle={styles.assetList}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.divider} />}
                renderItem={({ item }) => {
                  const color = item.changePercent24h >= 0 ? Colors.bullish : Colors.bearish;
                  return (
                    <Pressable
                      onPress={() => handleAssetSelect(item)}
                      style={({ pressed }) => [styles.assetRow, pressed && { opacity: 0.7 }]}
                      testID={`asset-pick-${item.symbol}`}
                    >
                      <View style={styles.assetLeft}>
                        <Text style={styles.assetSymbol}>{item.symbol}</Text>
                        <Text style={styles.assetName}>{item.name}</Text>
                      </View>
                      <View style={styles.assetRight}>
                        <Text style={styles.assetPrice}>{formatPrice(item.price, item.currency)}</Text>
                        <Text style={[styles.assetChange, { color }]}>
                          {formatChange(item.changePercent24h)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                }}
              />
            )
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.backgroundSecondary,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 12,
    maxHeight: '82%',
  },
  handle: {
    width: 36, height: 4, backgroundColor: Colors.cardBorder,
    borderRadius: 2, alignSelf: 'center', marginBottom: 14,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 18,
  },
  backBtn: { padding: 2 },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 12, paddingBottom: 16,
  },
  categoryCard: {
    width: '46%', flexGrow: 1,
    backgroundColor: Colors.card,
    borderRadius: 14, borderWidth: 1,
    padding: 16, gap: 8, alignItems: 'flex-start',
  },
  categoryIconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  categoryCount: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  assetList: { paddingHorizontal: 16, paddingBottom: 8 },
  divider: { height: 1, backgroundColor: Colors.separator },
  assetRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 14,
  },
  assetLeft: { gap: 2 },
  assetSymbol: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  assetName: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  assetRight: { alignItems: 'flex-end', gap: 3 },
  assetPrice: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  assetChange: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  emptyMsg: { alignItems: 'center', paddingVertical: 40 },
  emptyMsgText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
});
