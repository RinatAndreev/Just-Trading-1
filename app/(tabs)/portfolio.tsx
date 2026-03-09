import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Modal, TextInput, Platform, Share, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { MOCK_ASSETS } from '@/constants/mockData';
import { Asset } from '@/constants/types';
import { MiniChart } from '@/components/MiniChart';
import { formatPrice, formatChange } from '@/utils/formatters';
import { useApp } from '@/context/AppContext';
import { usePortfolio, PortfolioPosition } from '@/context/PortfolioContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { subscription, upgradeToPro } = useApp();
  const { positions, addPosition, removePosition } = usePortfolio();

  const [showAddModal, setShowAddModal] = useState(false);
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
    setShowAddModal(false);
    setSelectedAsset(null);
    setQuantity('');
    setBuyPrice('');
  }

  function openAddModal() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAddModal(true);
  }

  const isPositivePortfolio = totalPnl >= 0;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Portfolio</Text>
          <Text style={styles.subtitle}>{enriched.length} positions</Text>
        </View>
        <Pressable onPress={openAddModal} style={styles.addBtn} testID="portfolio-add">
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
                <View style={styles.summaryMain}>
                  <Text style={styles.summaryLabel}>Total Value</Text>
                  <Text style={styles.summaryValue}>{formatPrice(totalValue)}</Text>
                  <View style={[
                    styles.summaryPill,
                    { backgroundColor: isPositivePortfolio ? Colors.bullishDim : Colors.bearishDim }
                  ]}>
                    <Ionicons
                      name={isPositivePortfolio ? 'arrow-up' : 'arrow-down'}
                      size={12}
                      color={isPositivePortfolio ? Colors.bullish : Colors.bearish}
                    />
                    <Text style={[
                      styles.summaryPillText,
                      { color: isPositivePortfolio ? Colors.bullish : Colors.bearish }
                    ]}>
                      {isPositivePortfolio ? '+' : ''}{formatPrice(totalPnl)} ({formatChange(totalPnlPct)})
                    </Text>
                  </View>
                </View>
                {(topPerformer || worstPerformer) && (
                  <View style={styles.performerRow}>
                    {topPerformer && (
                      <View style={styles.performerCard}>
                        <Text style={styles.performerLabel}>Top Gainer</Text>
                        <Text style={styles.performerSymbol}>{topPerformer.symbol}</Text>
                        <Text style={[styles.performerChange, { color: Colors.bullish }]}>
                          {formatChange(topPerformer.pnlPct)}
                        </Text>
                      </View>
                    )}
                    {worstPerformer && worstPerformer.symbol !== topPerformer?.symbol && (
                      <View style={styles.performerCard}>
                        <Text style={styles.performerLabel}>Worst Loss</Text>
                        <Text style={styles.performerSymbol}>{worstPerformer.symbol}</Text>
                        <Text style={[styles.performerChange, { color: Colors.bearish }]}>
                          {formatChange(worstPerformer.pnlPct)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {enriched.length > 0 && (
              <Text style={styles.sectionTitle}>Positions</Text>
            )}
          </>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="pie-chart-outline" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No positions yet</Text>
            <Text style={styles.emptyText}>Track your investments and monitor P/L</Text>
            <Pressable onPress={openAddModal} style={styles.emptyAddBtn}>
              <Text style={styles.emptyAddBtnText}>Add Position</Text>
            </Pressable>
          </View>
        )}
        renderItem={({ item }) => {
          const isPos = item.pnl >= 0;
          const pnlColor = isPos ? Colors.bullish : Colors.bearish;
          return (
            <Pressable
              onPress={() => router.push(`/chart/${item.symbol}`)}
              style={({ pressed }) => [styles.posCard, pressed && styles.posCardPressed]}
            >
              <View style={styles.posLeft}>
                <View style={styles.posSymbolRow}>
                  <View style={styles.symbolBadge}>
                    <Text style={styles.symbolText}>{item.symbol}</Text>
                  </View>
                  <View>
                    <Text style={styles.posName}>{item.asset.name}</Text>
                    <Text style={styles.posQty}>
                      {item.quantity} {item.asset.category === 'crypto' ? 'units' : 'shares'} · avg {formatPrice(item.buyPrice, item.asset.currency)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.posRight}>
                <MiniChart
                  symbol={item.symbol}
                  currentPrice={item.asset.price}
                  changePercent={item.asset.changePercent24h}
                  width={64}
                  height={28}
                />
                <Text style={styles.posValue}>{formatPrice(item.currentValue)}</Text>
                <Text style={[styles.posChange, { color: pnlColor }]}>
                  {isPos ? '+' : ''}{formatPrice(item.pnl)} ({formatChange(item.pnlPct)})
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  removePosition(item.symbol);
                }}
                style={styles.removeBtn}
                testID={`remove-${item.symbol}`}
              >
                <Ionicons name="trash-outline" size={14} color={Colors.textMuted} />
              </Pressable>
            </Pressable>
          );
        }}
      />

      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedAsset ? `Add ${selectedAsset.symbol}` : 'Select Asset'}
              </Text>
              <Pressable onPress={() => { setShowAddModal(false); setSelectedAsset(null); setQuantity(''); setBuyPrice(''); }}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {!selectedAsset ? (
              <FlatList
                data={MOCK_ASSETS}
                keyExtractor={a => a.symbol}
                contentContainerStyle={styles.modalList}
                ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => { setSelectedAsset(item); setBuyPrice(item.price.toString()); }}
                    style={({ pressed }) => [styles.assetRow, pressed && { opacity: 0.7 }]}
                  >
                    <View>
                      <Text style={styles.assetSymbol}>{item.symbol}</Text>
                      <Text style={styles.assetNameSmall}>{item.name}</Text>
                    </View>
                    <Text style={styles.assetPrice}>{formatPrice(item.price, item.currency)}</Text>
                  </Pressable>
                )}
              />
            ) : (
              <View style={styles.addForm}>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Quantity</Text>
                  <TextInput
                    style={styles.formInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="e.g. 10"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                    autoFocus
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Buy Price ({selectedAsset.currency || '$'})</Text>
                  <TextInput
                    style={styles.formInput}
                    value={buyPrice}
                    onChangeText={setBuyPrice}
                    placeholder={`e.g. ${selectedAsset.price}`}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
                {quantity && buyPrice && (
                  <View style={styles.calcPreview}>
                    <Text style={styles.calcLabel}>Total position value:</Text>
                    <Text style={styles.calcValue}>
                      {formatPrice(parseFloat(quantity || '0') * parseFloat(buyPrice || '0'))}
                    </Text>
                  </View>
                )}
                <View style={styles.formBtns}>
                  <Pressable onPress={() => setSelectedAsset(null)} style={styles.backFormBtn}>
                    <Text style={styles.backFormBtnText}>Back</Text>
                  </Pressable>
                  <Pressable onPress={handleAdd} style={styles.confirmBtn} testID="portfolio-confirm-add">
                    <Text style={styles.confirmBtnText}>Add Position</Text>
                  </Pressable>
                </View>
              </View>
            )}
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
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  addBtn: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.accentDim, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.accentDimBorder,
  },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  summaryCard: {
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
    padding: 18, marginBottom: 20, gap: 16,
  },
  summaryMain: { gap: 6 },
  summaryLabel: {
    fontSize: 11, fontFamily: 'Inter_400Regular',
    color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  summaryValue: {
    fontSize: 34, fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary, letterSpacing: -1,
  },
  summaryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 20,
  },
  summaryPillText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  performerRow: { flexDirection: 'row', gap: 10 },
  performerCard: {
    flex: 1, backgroundColor: Colors.backgroundSecondary,
    borderRadius: 10, padding: 12,
  },
  performerLabel: {
    fontSize: 10, fontFamily: 'Inter_400Regular',
    color: Colors.textMuted, marginBottom: 4,
  },
  performerSymbol: {
    fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary,
  },
  performerChange: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  sectionTitle: {
    fontSize: 13, fontFamily: 'Inter_600SemiBold',
    color: Colors.textMuted, marginBottom: 10,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  posCard: {
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.cardBorder,
    padding: 14, flexDirection: 'row',
    alignItems: 'center', gap: 12,
  },
  posCardPressed: { opacity: 0.8 },
  posLeft: { flex: 1 },
  posSymbolRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  symbolBadge: {
    backgroundColor: Colors.accentDim, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.accentDimBorder,
  },
  symbolText: {
    fontSize: 12, fontFamily: 'Inter_700Bold', color: Colors.accent,
  },
  posName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  posQty: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  posRight: { alignItems: 'flex-end', gap: 2 },
  posValue: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  posChange: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  removeBtn: { padding: 6 },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  emptyText: {
    fontSize: 13, fontFamily: 'Inter_400Regular',
    color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 40,
  },
  emptyAddBtn: {
    marginTop: 8, backgroundColor: Colors.accent,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10,
  },
  emptyAddBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.white },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.backgroundSecondary, borderTopLeftRadius: 20,
    borderTopRightRadius: 20, paddingTop: 12, maxHeight: '75%',
  },
  modalHandle: {
    width: 36, height: 4, backgroundColor: Colors.cardBorder,
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  modalList: { paddingHorizontal: 16, paddingBottom: 16 },
  modalDivider: { height: 1, backgroundColor: Colors.separator, marginVertical: 2 },
  assetRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 4,
  },
  assetSymbol: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  assetNameSmall: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 1 },
  assetPrice: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  addForm: { paddingHorizontal: 20, paddingTop: 8, gap: 16 },
  formField: { gap: 6 },
  formLabel: {
    fontSize: 12, fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  formInput: {
    backgroundColor: Colors.backgroundTertiary, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.cardBorder,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary,
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
    flex: 1, paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', backgroundColor: Colors.backgroundTertiary,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  backFormBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  confirmBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', backgroundColor: Colors.accent,
  },
  confirmBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.white },
});
