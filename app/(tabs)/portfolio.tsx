import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Modal, TextInput, Platform, Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { MOCK_ASSETS } from '@/constants/mockData';
import { Asset } from '@/constants/types';
import { MiniChart } from '@/components/MiniChart';
import { AssetPickerSheet } from '@/components/AssetPickerSheet';
import { formatPrice, formatChange } from '@/utils/formatters';
import { useApp } from '@/context/AppContext';
import { usePortfolio, PortfolioPosition } from '@/context/PortfolioContext';

export default function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { subscription, upgradeToPro } = useApp();
  const { positions, addPosition, removePosition } = usePortfolio();

  const [showPicker, setShowPicker] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const enriched = positions.map(pos => {
    const asset = MOCK_ASSETS.find(a => a.symbol === pos.symbol);
    if (!asset) return null;
    const currentValue = asset.price * pos.quantity;
    const costBasis = pos.buyPrice * pos.quantity;
    const pnl = currentValue - costBasis;
    const pnlPct = ((currentValue - costBasis) / costBasis) * 100;
    return { ...pos, asset, currentValue, costBasis, pnl, pnlPct };
  }).filter(Boolean) as Array<PortfolioPosition & {
    asset: Asset;
    currentValue: number;
    costBasis: number;
    pnl: number;
    pnlPct: number;
  }>;

  const totalValue = enriched.reduce((s, p) => s + p.currentValue, 0);
  const totalCost = enriched.reduce((s, p) => s + p.costBasis, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  const sorted = [...enriched].sort((a, b) => b.currentValue - a.currentValue);
  const topPerformer = [...enriched].sort((a, b) => b.pnlPct - a.pnlPct)[0];
  const worstPerformer = [...enriched].sort((a, b) => a.pnlPct - b.pnlPct)[0];

  function handleAssetSelected(asset: Asset) {
    setSelectedAsset(asset);
    setBuyPrice(asset.price.toFixed(asset.price < 1 ? 4 : 2));
    setQuantity('');
    setShowPicker(false);
    setTimeout(() => setShowFormModal(true), 300);
  }

  function handleAdd() {
    if (!selectedAsset || !quantity || !buyPrice) return;
    const qty = parseFloat(quantity);
    const bp = parseFloat(buyPrice);
    if (isNaN(qty) || isNaN(bp) || qty <= 0 || bp <= 0) return;

    addPosition({
      symbol: selectedAsset.symbol,
      quantity: qty,
      buyPrice: bp,
      addedAt: new Date().toISOString(),
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowFormModal(false);
    setSelectedAsset(null);
    setQuantity('');
    setBuyPrice('');
  }

  function openAdd() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPicker(true);
  }

  const isPositivePortfolio = totalPnl >= 0;
  const pnlColor = isPositivePortfolio ? Colors.bullish : Colors.bearish;
  const qty = parseFloat(quantity);
  const bp = parseFloat(buyPrice);
  const previewValue = !isNaN(qty) && !isNaN(bp) ? qty * bp : null;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Portfolio</Text>
          <Text style={styles.subtitle}>{enriched.length} positions</Text>
        </View>
        <Pressable onPress={openAdd} style={styles.addBtn} testID="portfolio-add">
          <Ionicons name="add" size={20} color={Colors.accent} />
        </Pressable>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={item => item.symbol}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === 'web' ? 34 + 84 : insets.bottom + 20 },
        ]}
        ListHeaderComponent={() => (
          <>
            {enriched.length > 0 && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryTop}>
                  <View>
                    <Text style={styles.summaryLabel}>Total Value</Text>
                    <Text style={styles.summaryValue}>${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                  </View>
                  <View style={[styles.summaryPnlBadge, { backgroundColor: isPositivePortfolio ? Colors.bullishDim : Colors.bearishDim }]}>
                    <Ionicons
                      name={isPositivePortfolio ? 'trending-up' : 'trending-down'}
                      size={14} color={pnlColor}
                    />
                    <Text style={[styles.summaryPnlText, { color: pnlColor }]}>
                      {isPositivePortfolio ? '+' : ''}{totalPnl >= 0 ? '' : ''}{Math.abs(totalPnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}  {isPositivePortfolio ? '+' : ''}{totalPnlPct.toFixed(2)}%
                    </Text>
                  </View>
                </View>
                {(topPerformer || worstPerformer) && (
                  <View style={styles.performerRow}>
                    {topPerformer && (
                      <View style={styles.performerItem}>
                        <Text style={styles.performerLabel}>Best</Text>
                        <Text style={[styles.performerSymbol, { color: Colors.bullish }]}>
                          {topPerformer.asset.symbol} +{topPerformer.pnlPct.toFixed(1)}%
                        </Text>
                      </View>
                    )}
                    {worstPerformer && worstPerformer.symbol !== topPerformer?.symbol && (
                      <View style={[styles.performerItem, { alignItems: 'flex-end' }]}>
                        <Text style={styles.performerLabel}>Worst</Text>
                        <Text style={[styles.performerSymbol, { color: Colors.bearish }]}>
                          {worstPerformer.asset.symbol} {worstPerformer.pnlPct.toFixed(1)}%
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No positions yet</Text>
            <Text style={styles.emptyText}>Add your first position to start tracking your portfolio</Text>
            <Pressable onPress={openAdd} style={styles.emptyBtn} testID="portfolio-empty-add">
              <Text style={styles.emptyBtnText}>Add Position</Text>
            </Pressable>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const pnlC = item.pnl >= 0 ? Colors.bullish : Colors.bearish;
          return (
            <Pressable
              onPress={() => router.push(`/chart/${item.symbol}`)}
              style={({ pressed }) => [styles.positionCard, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.positionTop}>
                <View style={styles.positionLeft}>
                  <Text style={styles.posSymbol}>{item.symbol}</Text>
                  <Text style={styles.posName}>{item.asset.name}</Text>
                </View>
                <MiniChart symbol={item.symbol} positive={item.pnl >= 0} />
              </View>
              <View style={styles.positionStats}>
                <View style={styles.posStat}>
                  <Text style={styles.posStatLabel}>Qty</Text>
                  <Text style={styles.posStatValue}>{item.quantity}</Text>
                </View>
                <View style={styles.posStat}>
                  <Text style={styles.posStatLabel}>Avg</Text>
                  <Text style={styles.posStatValue}>{formatPrice(item.buyPrice, item.asset.currency)}</Text>
                </View>
                <View style={styles.posStat}>
                  <Text style={styles.posStatLabel}>Current</Text>
                  <Text style={styles.posStatValue}>{formatPrice(item.asset.price, item.asset.currency)}</Text>
                </View>
                <View style={styles.posStat}>
                  <Text style={styles.posStatLabel}>P&L</Text>
                  <Text style={[styles.posStatValue, { color: pnlC }]}>
                    {item.pnl >= 0 ? '+' : ''}{item.pnlPct.toFixed(2)}%
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={(e) => { e.stopPropagation(); removePosition(item.symbol); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={styles.removeBtn} hitSlop={8}
              >
                <Ionicons name="trash-outline" size={15} color={Colors.textMuted} />
              </Pressable>
            </Pressable>
          );
        }}
      />

      <AssetPickerSheet
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleAssetSelected}
        title="Add Position"
      />

      <Modal
        visible={showFormModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFormModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.formSheet, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 8 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <View style={styles.formAssetInfo}>
                <Text style={styles.formAssetSymbol}>{selectedAsset?.symbol}</Text>
                <Text style={styles.formAssetName}>{selectedAsset?.name}</Text>
              </View>
              <Pressable onPress={() => setShowFormModal(false)} hitSlop={8}>
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </Pressable>
            </View>

            <KeyboardAwareScrollView
              keyboardShouldPersistTaps="handled"
              bottomOffset={24}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formScrollContent}
            >
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Quantity</Text>
                <TextInput
                  style={styles.formInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  returnKeyType="next"
                  testID="portfolio-qty"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Buy Price ({selectedAsset?.currency})</Text>
                <TextInput
                  style={styles.formInput}
                  value={buyPrice}
                  onChangeText={setBuyPrice}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={Colors.textMuted}
                  returnKeyType="done"
                  onSubmitEditing={handleAdd}
                  testID="portfolio-price"
                />
              </View>

              {previewValue !== null && (
                <View style={styles.calcPreview}>
                  <Text style={styles.calcLabel}>Position Value</Text>
                  <Text style={styles.calcValue}>
                    {selectedAsset?.currency}{previewValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              )}

              <View style={styles.formBtns}>
                <Pressable
                  onPress={() => setShowFormModal(false)}
                  style={({ pressed }) => [styles.backFormBtn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.backFormBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleAdd}
                  style={({ pressed }) => [
                    styles.confirmBtn,
                    (!quantity || !buyPrice) && styles.confirmBtnDisabled,
                    pressed && { opacity: 0.8 },
                  ]}
                  testID="portfolio-confirm"
                >
                  <Text style={styles.confirmBtnText}>Add Position</Text>
                </Pressable>
              </View>
            </KeyboardAwareScrollView>
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
  list: { paddingHorizontal: 16, paddingTop: 4 },
  summaryCard: {
    backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: 16, marginBottom: 16, gap: 12,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  summaryValue: { fontSize: 26, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: -0.5, marginTop: 2 },
  summaryPnlBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  summaryPnlText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  performerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  performerItem: { gap: 2 },
  performerLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  performerSymbol: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  emptyText: {
    fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted,
    textAlign: 'center', paddingHorizontal: 40,
  },
  emptyBtn: {
    marginTop: 8, backgroundColor: Colors.accent,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10,
  },
  emptyBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.white },
  positionCard: {
    backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: 14,
  },
  positionTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 12,
  },
  positionLeft: { gap: 2 },
  posSymbol: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  posName: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  positionStats: { flexDirection: 'row', justifyContent: 'space-between' },
  posStat: { alignItems: 'center', gap: 3 },
  posStatLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
  posStatValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  removeBtn: { position: 'absolute', top: 12, right: 12 },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  formSheet: {
    backgroundColor: Colors.backgroundSecondary,
    borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 12,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 36, height: 4, backgroundColor: Colors.cardBorder,
    borderRadius: 2, alignSelf: 'center', marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 4,
  },
  formAssetInfo: { gap: 1 },
  formAssetSymbol: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  formAssetName: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  formScrollContent: { paddingHorizontal: 20, paddingTop: 12, gap: 16, paddingBottom: 8 },
  formField: { gap: 6 },
  formLabel: {
    fontSize: 12, fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  formInput: {
    backgroundColor: Colors.backgroundTertiary, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.cardBorder,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary,
  },
  calcPreview: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.backgroundTertiary, borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  calcLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  calcValue: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.accent },
  formBtns: { flexDirection: 'row', gap: 10, paddingBottom: 8 },
  backFormBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  backFormBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  confirmBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: Colors.accent,
  },
  confirmBtnDisabled: { backgroundColor: Colors.backgroundTertiary },
  confirmBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.white },
});
