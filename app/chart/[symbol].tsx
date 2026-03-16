import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
  Dimensions, PanResponder, Modal, TextInput, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, {
  Polyline, Defs, LinearGradient, Stop, Polygon,
  Line, Text as SvgText, Circle, Rect,
} from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { MOCK_ASSETS, MOCK_NEWS } from '@/constants/mockData';
import { generateChartData, Timeframe } from '@/services/marketService';
import { formatPrice, formatChange } from '@/utils/formatters';
import { useApp } from '@/context/AppContext';
import { useAlarms } from '@/context/AlarmsContext';

const ALL_TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '30m', '1H', '4H', '12H', '1D', '1W', '1M', '3M', '1Y'];
const DEFAULT_FAVORITES: Timeframe[] = ['1H', '1D', '1W', '1M', '1Y'];
const MAX_FAVORITES = 5;
const TF_STORAGE_KEY = 'jt_fav_timeframes';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 32;
const CHART_HEIGHT = 220;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 20;
const PAD_BOTTOM = 8;

export default function ChartScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, canAddToWatchlist, subscription } = useApp();
  const { alarms, addAlarm, removeAlarm, toggleAlarm, canAddAlarm } = useAlarms();

  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [favoriteTimeframes, setFavoriteTimeframes] = useState<Timeframe[]>(DEFAULT_FAVORITES);
  const [crosshairX, setCrosshairX] = useState<number | null>(null);
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [showTFModal, setShowTFModal] = useState(false);
  const [alarmPrice, setAlarmPrice] = useState('');
  const [alarmCondition, setAlarmCondition] = useState<'above' | 'below'>('above');
  const [tfPendingFavorites, setTfPendingFavorites] = useState<Timeframe[]>(DEFAULT_FAVORITES);

  useEffect(() => {
    AsyncStorage.getItem(TF_STORAGE_KEY).then(raw => {
      if (raw) {
        const parsed: Timeframe[] = JSON.parse(raw);
        setFavoriteTimeframes(parsed);
        if (!parsed.includes(timeframe)) setTimeframe(parsed[0]);
      }
    }).catch(() => {});
  }, []);

  const asset = MOCK_ASSETS.find(a => a.symbol === symbol?.toUpperCase()) ?? {
    symbol: symbol?.toUpperCase() ?? '?',
    name: symbol?.toUpperCase() ?? 'Unknown',
    price: 100,
    changePercent24h: 0,
    change24h: 0,
    currency: '$',
    category: 'stocks' as const,
  };

  const chartData = useMemo(() =>
    generateChartData(asset.symbol, asset.price, asset.changePercent24h, timeframe),
    [asset.symbol, asset.price, asset.changePercent24h, timeframe]
  );

  const prices = chartData.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const plotW = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const linePoints = chartData.map((d, i) => {
    const x = PAD_LEFT + (i / (chartData.length - 1)) * plotW;
    const y = PAD_TOP + plotH - ((d.price - minPrice) / priceRange) * plotH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const firstX = PAD_LEFT.toFixed(1);
  const lastX = (PAD_LEFT + plotW).toFixed(1);
  const bottomY = (PAD_TOP + plotH).toFixed(1);
  const fillPoints = `${firstX},${bottomY} ${linePoints} ${lastX},${bottomY}`;

  const isPositive = asset.changePercent24h >= 0;
  const chartColor = isPositive ? Colors.bullish : Colors.bearish;

  const firstPrice = chartData[0]?.price ?? asset.price;
  const tfChange = ((asset.price - firstPrice) / firstPrice) * 100;
  const tfChangeSign = tfChange >= 0 ? '+' : '';

  const inWatchlist = isInWatchlist(asset.symbol);
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(frac => {
    const price = minPrice + frac * priceRange;
    const y = PAD_TOP + plotH - frac * plotH;
    return { label: formatPrice(price, asset.currency), y };
  });

  const crosshairIndex = crosshairX !== null
    ? Math.max(0, Math.min(chartData.length - 1, Math.round(((crosshairX - PAD_LEFT) / plotW) * (chartData.length - 1))))
    : null;
  const crosshairPoint = crosshairIndex !== null ? chartData[crosshairIndex] : null;
  const crosshairSvgX = crosshairIndex !== null
    ? PAD_LEFT + (crosshairIndex / (chartData.length - 1)) * plotW
    : null;
  const crosshairSvgY = crosshairPoint
    ? PAD_TOP + plotH - ((crosshairPoint.price - minPrice) / priceRange) * plotH
    : null;

  const TOOLTIP_W = 88;
  const tooltipX = crosshairSvgX !== null
    ? Math.max(PAD_LEFT, Math.min(crosshairSvgX - TOOLTIP_W / 2, PAD_LEFT + plotW - TOOLTIP_W))
    : 0;

  const panRef = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setCrosshairX(evt.nativeEvent.locationX);
        Haptics.selectionAsync();
      },
      onPanResponderMove: (evt) => {
        setCrosshairX(evt.nativeEvent.locationX);
      },
      onPanResponderRelease: () => {},
      onPanResponderTerminate: () => {},
    })
  );

  function toggleWatchlist() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (inWatchlist) {
      removeFromWatchlist(asset.symbol);
    } else if (canAddToWatchlist) {
      addToWatchlist(asset.symbol);
    }
  }

  function openAlarmModal() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAlarmPrice(asset.price.toFixed(asset.price < 1 ? 4 : 2));
    setAlarmCondition('above');
    setShowAlarmModal(true);
  }

  function handleAddAlarm() {
    const price = parseFloat(alarmPrice);
    if (isNaN(price) || price <= 0) return;
    if (!canAddAlarm(subscription)) {
      Alert.alert('Free Plan Limit', 'You can set up to 3 price alarms on the free plan. Upgrade to Pro for unlimited alarms.');
      return;
    }
    addAlarm({
      symbol: asset.symbol,
      assetName: asset.name,
      targetPrice: price,
      condition: alarmCondition,
      isActive: true,
      currency: asset.currency,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAlarmModal(false);
  }

  const symbolAlarms = alarms.filter(a => a.symbol === asset.symbol);
  const activeAlarmCount = symbolAlarms.filter(a => a.isActive && !a.triggeredAt).length;

  function openTFModal() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTfPendingFavorites([...favoriteTimeframes]);
    setShowTFModal(true);
  }

  function toggleTFPending(tf: Timeframe) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (tfPendingFavorites.includes(tf)) {
      if (tfPendingFavorites.length <= 1) return;
      setTfPendingFavorites(prev => prev.filter(t => t !== tf));
    } else {
      if (tfPendingFavorites.length >= MAX_FAVORITES) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      setTfPendingFavorites(prev => [...prev, tf]);
    }
  }

  function saveTFPending() {
    const sorted = ALL_TIMEFRAMES.filter(t => tfPendingFavorites.includes(t));
    setFavoriteTimeframes(sorted);
    AsyncStorage.setItem(TF_STORAGE_KEY, JSON.stringify(sorted)).catch(() => {});
    if (!sorted.includes(timeframe)) setTimeframe(sorted[0]);
    setShowTFModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  const relatedNews = MOCK_NEWS.filter(n => n.assetSymbol === asset.symbol).slice(0, 3);

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} testID="chart-back">
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.symbolText}>{asset.symbol}</Text>
          <Text style={styles.assetNameText}>{asset.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={openAlarmModal} style={styles.actionBtn} testID="chart-alarm">
            <Ionicons
              name="notifications-outline"
              size={19}
              color={activeAlarmCount > 0 ? Colors.accent : Colors.textSecondary}
            />
            {activeAlarmCount > 0 && (
              <View style={styles.alarmBadge}>
                <Text style={styles.alarmBadgeText}>{activeAlarmCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={openTFModal} style={styles.actionBtn} testID="chart-tf">
            <Ionicons name="options-outline" size={19} color={Colors.textSecondary} />
          </Pressable>
          <Pressable onPress={toggleWatchlist} style={styles.actionBtn} testID="chart-watchlist">
            <Ionicons
              name={inWatchlist ? 'bookmark' : 'bookmark-outline'}
              size={19}
              color={inWatchlist ? Colors.accent : Colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'web' ? 34 + 84 : insets.bottom + 20 },
        ]}
      >
        <View style={styles.priceSection}>
          <Text style={styles.currentPrice}>
            {crosshairPoint
              ? formatPrice(crosshairPoint.price, asset.currency)
              : formatPrice(asset.price, asset.currency)}
          </Text>
          <View style={styles.changeRow}>
            <Text style={[styles.changePct, { color: isPositive ? Colors.bullish : Colors.bearish }]}>
              {crosshairPoint
                ? (() => {
                    const chg = ((crosshairPoint.price - firstPrice) / firstPrice) * 100;
                    return `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%`;
                  })()
                : `${tfChangeSign}${tfChange.toFixed(2)}%`}
            </Text>
            <Text style={styles.changeLabel}>{crosshairPoint ? 'crosshair' : timeframe}</Text>
          </View>
        </View>

        <View style={styles.chartContainer} {...panRef.current.panHandlers} testID="chart-area">
          <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={chartColor} stopOpacity="0.18" />
                <Stop offset="1" stopColor={chartColor} stopOpacity="0" />
              </LinearGradient>
            </Defs>

            {yLabels.map(({ y }, idx) => (
              <Line key={`grid-${idx}`} x1={PAD_LEFT} y1={y} x2={PAD_LEFT + plotW} y2={y}
                stroke={Colors.separator} strokeWidth={0.5} />
            ))}

            <Polygon points={fillPoints} fill="url(#chartFill)" />
            <Polyline
              points={linePoints} fill="none"
              stroke={chartColor} strokeWidth={2}
              strokeLinejoin="round" strokeLinecap="round"
            />

            {yLabels.map(({ label, y }, idx) => (
              <SvgText
                key={`ylbl-${idx}`}
                x={PAD_LEFT + plotW + 4} y={y + 4}
                fontSize={9} fontFamily="Inter_400Regular"
                fill={Colors.textMuted} textAnchor="start"
              >
                {label}
              </SvgText>
            ))}

            {crosshairSvgX !== null && crosshairSvgY !== null && crosshairPoint && (
              <>
                <Line
                  x1={crosshairSvgX} y1={PAD_TOP}
                  x2={crosshairSvgX} y2={PAD_TOP + plotH}
                  stroke={Colors.textMuted} strokeWidth={1}
                  strokeDasharray="4 3"
                />
                <Circle
                  cx={crosshairSvgX} cy={crosshairSvgY}
                  r={5} fill={chartColor}
                  stroke={Colors.background} strokeWidth={2}
                />
                <Rect
                  x={tooltipX} y={PAD_TOP - 2}
                  width={TOOLTIP_W} height={20}
                  rx={5} fill={chartColor}
                />
                <SvgText
                  x={tooltipX + TOOLTIP_W / 2} y={PAD_TOP + 13}
                  textAnchor="middle"
                  fontSize={11} fontFamily="Inter_600SemiBold"
                  fill={Colors.background}
                >
                  {formatPrice(crosshairPoint.price, asset.currency)}
                </SvgText>
              </>
            )}
          </Svg>
        </View>

        {crosshairX !== null && (
          <Pressable
            onPress={() => { setCrosshairX(null); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={styles.crosshairDismiss}
            testID="crosshair-dismiss"
          >
            <Ionicons name="close-circle" size={14} color={Colors.textMuted} />
            <Text style={styles.crosshairDismissText}>Clear crosshair</Text>
          </Pressable>
        )}

        <View style={styles.tfRow}>
          {favoriteTimeframes.map(tf => (
            <Pressable
              key={tf}
              onPress={() => { setTimeframe(tf); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={[styles.tfBtn, timeframe === tf && styles.tfBtnActive]}
            >
              <Text style={[styles.tfBtnText, timeframe === tf && styles.tfBtnTextActive]}>{tf}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.statsRow}>
          {[
            { label: 'Open', value: formatPrice(firstPrice, asset.currency) },
            { label: 'Current', value: formatPrice(asset.price, asset.currency) },
            { label: '24h Chg', value: `${asset.changePercent24h >= 0 ? '+' : ''}${asset.changePercent24h.toFixed(2)}%` },
            { label: `${timeframe} Chg`, value: `${tfChangeSign}${tfChange.toFixed(2)}%` },
          ].map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>

        {symbolAlarms.length > 0 && (
          <View style={styles.alarmSection}>
            <Text style={styles.sectionTitle}>Price Alarms</Text>
            {symbolAlarms.map(alarm => {
              const color = alarm.triggeredAt ? Colors.neutral : alarm.isActive ? Colors.accent : Colors.textMuted;
              return (
                <View key={alarm.id} style={styles.alarmRow}>
                  <View style={styles.alarmLeft}>
                    <Ionicons
                      name={alarm.condition === 'above' ? 'arrow-up-circle' : 'arrow-down-circle'}
                      size={18} color={color}
                    />
                    <View>
                      <Text style={[styles.alarmTarget, { color }]}>
                        {alarm.condition === 'above' ? 'Above' : 'Below'} {formatPrice(alarm.targetPrice, alarm.currency)}
                      </Text>
                      {alarm.triggeredAt && <Text style={styles.alarmTriggeredText}>Triggered</Text>}
                    </View>
                  </View>
                  <View style={styles.alarmRight}>
                    {!alarm.triggeredAt && (
                      <Pressable onPress={() => toggleAlarm(alarm.id)} hitSlop={8}>
                        <View style={[styles.alarmDot, { backgroundColor: alarm.isActive ? Colors.bullish : Colors.textMuted }]} />
                      </Pressable>
                    )}
                    <Pressable onPress={() => removeAlarm(alarm.id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={16} color={Colors.bearish} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {relatedNews.length > 0 && (
          <View style={styles.newsSection}>
            <Text style={styles.sectionTitle}>Related News</Text>
            {relatedNews.map(n => {
              const chg = n.marketReaction.change1h;
              const chgColor = chg > 0 ? Colors.bullish : chg < 0 ? Colors.bearish : Colors.neutral;
              return (
                <View key={n.id} style={styles.newsRow}>
                  <Text style={styles.newsHeadline} numberOfLines={2}>{n.headline}</Text>
                  <View style={styles.newsMeta}>
                    <Text style={styles.newsSource}>{n.source}</Text>
                    <View style={[styles.newsChange, { backgroundColor: chg > 0 ? Colors.bullishDim : Colors.bearishDim }]}>
                      <Text style={[styles.newsChangeText, { color: chgColor }]}>
                        {chg >= 0 ? '+' : ''}{chg.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={showAlarmModal} transparent animationType="slide" onRequestClose={() => setShowAlarmModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 12 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Set Price Alarm</Text>
              <Pressable onPress={() => setShowAlarmModal(false)} hitSlop={8}>
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>{asset.symbol} · Current {formatPrice(asset.price, asset.currency)}</Text>
              {subscription === 'free' && (
                <View style={styles.alarmLimitBadge}>
                  <Ionicons name="information-circle-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.alarmLimitText}>
                    {alarms.filter(a => a.isActive && !a.triggeredAt).length}/3 alarms used · Free plan
                  </Text>
                </View>
              )}
              <View style={styles.conditionRow}>
                {(['above', 'below'] as const).map(cond => (
                  <Pressable
                    key={cond}
                    onPress={() => { setAlarmCondition(cond); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[styles.condBtn, alarmCondition === cond && styles.condBtnActive]}
                  >
                    <Ionicons
                      name={cond === 'above' ? 'arrow-up' : 'arrow-down'}
                      size={14}
                      color={alarmCondition === cond ? Colors.accent : Colors.textMuted}
                    />
                    <Text style={[styles.condBtnText, alarmCondition === cond && styles.condBtnTextActive]}>
                      {cond === 'above' ? 'Goes above' : 'Goes below'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.alarmPriceRow}>
                <Text style={styles.alarmCurrency}>{asset.currency}</Text>
                <TextInput
                  style={styles.alarmInput}
                  value={alarmPrice}
                  onChangeText={setAlarmPrice}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={Colors.textMuted}
                  selectTextOnFocus
                />
              </View>
              <Pressable
                onPress={handleAddAlarm}
                style={({ pressed }) => [styles.confirmAlarmBtn, pressed && { opacity: 0.8 }]}
                testID="alarm-confirm"
              >
                <Ionicons name="notifications" size={16} color={Colors.white} />
                <Text style={styles.confirmAlarmText}>Set Alarm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showTFModal} transparent animationType="slide" onRequestClose={() => setShowTFModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 12 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Timeframes</Text>
              <Pressable onPress={() => setShowTFModal(false)} hitSlop={8}>
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.tfModalSubtitle}>Choose up to {MAX_FAVORITES} timeframes for the chart.</Text>
              <View style={styles.tfGrid}>
                {ALL_TIMEFRAMES.map(tf => {
                  const selected = tfPendingFavorites.includes(tf);
                  return (
                    <Pressable
                      key={tf}
                      onPress={() => toggleTFPending(tf)}
                      style={[styles.tfChip, selected && styles.tfChipActive]}
                    >
                      <Text style={[styles.tfChipText, selected && styles.tfChipTextActive]}>{tf}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.tfSelCount}>{tfPendingFavorites.length}/{MAX_FAVORITES} selected</Text>
              <View style={styles.tfModalBtns}>
                <Pressable
                  onPress={() => setShowTFModal(false)}
                  style={({ pressed }) => [styles.tfCancelBtn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.tfCancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={saveTFPending}
                  style={({ pressed }) => [styles.tfSaveBtn, pressed && { opacity: 0.8 }]}
                  testID="tf-save"
                >
                  <Text style={styles.tfSaveBtnText}>Apply</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.separator,
  },
  backBtn: { padding: 4, marginRight: 6 },
  headerCenter: { flex: 1 },
  symbolText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  assetNameText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionBtn: { padding: 8, position: 'relative' },
  alarmBadge: {
    position: 'absolute', top: 4, right: 4,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  alarmBadgeText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: Colors.white },
  scrollContent: { paddingTop: 16 },
  priceSection: { paddingHorizontal: 16, marginBottom: 12 },
  currentPrice: { fontSize: 34, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: -1 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  changePct: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  changeLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  chartContainer: { marginHorizontal: 16, marginBottom: 6 },
  crosshairDismiss: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 16, paddingBottom: 6,
  },
  crosshairDismissText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  tfRow: {
    flexDirection: 'row', marginHorizontal: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12, padding: 4, marginBottom: 20, gap: 2,
  },
  tfBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 9 },
  tfBtnActive: { backgroundColor: Colors.backgroundTertiary },
  tfBtnText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  tfBtnTextActive: { color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  statsRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: Colors.card,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder,
    padding: 10, gap: 4,
  },
  statLabel: { fontSize: 9, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 12, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  alarmSection: { marginHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginBottom: 10 },
  alarmRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.cardBorder,
    padding: 12, marginBottom: 8,
  },
  alarmLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  alarmTarget: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  alarmTriggeredText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  alarmRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  alarmDot: { width: 10, height: 10, borderRadius: 5 },
  newsSection: { marginHorizontal: 16, gap: 8, marginBottom: 8 },
  newsRow: {
    backgroundColor: Colors.card, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: 12, gap: 6,
  },
  newsHeadline: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, lineHeight: 18 },
  newsMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  newsSource: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  newsChange: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  newsChangeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.backgroundSecondary,
    borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 12,
  },
  modalHandle: {
    width: 36, height: 4, backgroundColor: Colors.cardBorder,
    borderRadius: 2, alignSelf: 'center', marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 4,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  modalBody: { paddingHorizontal: 20, paddingTop: 8, gap: 14, paddingBottom: 4 },
  modalSubtitle: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  alarmLimitBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.backgroundTertiary, borderRadius: 8, padding: 10,
  },
  alarmLimitText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  conditionRow: { flexDirection: 'row', gap: 10 },
  condBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 10,
    backgroundColor: Colors.backgroundTertiary,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  condBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  condBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  condBtnTextActive: { color: Colors.accent },
  alarmPriceRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
  },
  alarmCurrency: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textMuted, marginRight: 6 },
  alarmInput: {
    flex: 1, paddingVertical: 14,
    fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary,
  },
  confirmAlarmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 15,
  },
  confirmAlarmText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.white },
  tfModalSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  tfGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tfChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    backgroundColor: Colors.backgroundTertiary,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  tfChipActive: { backgroundColor: Colors.accentDim, borderColor: Colors.accentDimBorder },
  tfChipText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  tfChipTextActive: { color: Colors.accent, fontFamily: 'Inter_600SemiBold' },
  tfSelCount: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textAlign: 'center' },
  tfModalBtns: { flexDirection: 'row', gap: 12, paddingBottom: 4 },
  tfCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  tfCancelBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  tfSaveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: Colors.accent,
  },
  tfSaveBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.white },
});
