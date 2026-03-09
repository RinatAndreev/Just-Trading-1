import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Polyline, Defs, LinearGradient, Stop, Polygon, Line, Text as SvgText } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { MOCK_ASSETS } from '@/constants/mockData';
import { MOCK_NEWS } from '@/constants/mockData';
import { generateChartData, Timeframe } from '@/services/marketService';
import { formatPrice, formatChange } from '@/utils/formatters';
import { useApp } from '@/context/AppContext';

const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '3M', '1Y'];
const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 32;
const CHART_HEIGHT = 220;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 8;

export default function ChartScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, canAddToWatchlist } = useApp();

  const [timeframe, setTimeframe] = useState<Timeframe>('1M');

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

  const firstX = (PAD_LEFT).toFixed(1);
  const lastX = (PAD_LEFT + plotW).toFixed(1);
  const bottomY = (PAD_TOP + plotH).toFixed(1);
  const fillPoints = `${firstX},${bottomY} ${linePoints} ${lastX},${bottomY}`;

  const isPositive = asset.changePercent24h >= 0;
  const chartColor = isPositive ? Colors.bullish : Colors.bearish;

  const relatedNews = MOCK_NEWS.filter(n => n.assetSymbol === asset.symbol).slice(0, 3);
  const inWatchlist = isInWatchlist(asset.symbol);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(frac => {
    const price = minPrice + frac * priceRange;
    const y = PAD_TOP + plotH - frac * plotH;
    return { label: formatPrice(price, asset.currency), y };
  });

  function toggleWatchlist() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (inWatchlist) {
      removeFromWatchlist(asset.symbol);
    } else if (canAddToWatchlist) {
      addToWatchlist(asset.symbol);
    }
  }

  const firstPrice = chartData[0]?.price ?? asset.price;
  const tfChange = ((asset.price - firstPrice) / firstPrice) * 100;
  const tfChangeSign = tfChange >= 0 ? '+' : '';

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} testID="chart-back">
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.symbol}>{asset.symbol}</Text>
          <Text style={styles.assetName}>{asset.name}</Text>
        </View>
        <Pressable
          onPress={toggleWatchlist}
          style={[styles.watchBtn, inWatchlist && styles.watchBtnActive]}
        >
          <Ionicons
            name={inWatchlist ? 'eye' : 'eye-outline'}
            size={18}
            color={inWatchlist ? Colors.accent : Colors.textSecondary}
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Platform.OS === 'web' ? 34 + 84 : insets.bottom + 24 },
        ]}
      >
        <View style={styles.priceSection}>
          <Text style={styles.currentPrice}>
            {formatPrice(asset.price, asset.currency)}
          </Text>
          <View style={styles.changePills}>
            <View style={[styles.changePill, { backgroundColor: isPositive ? Colors.bullishDim : Colors.bearishDim }]}>
              <Ionicons
                name={isPositive ? 'arrow-up' : 'arrow-down'}
                size={12}
                color={isPositive ? Colors.bullish : Colors.bearish}
              />
              <Text style={[styles.changePillText, { color: isPositive ? Colors.bullish : Colors.bearish }]}>
                {formatChange(asset.changePercent24h)} (24h)
              </Text>
            </View>
            <View style={[styles.changePill, { backgroundColor: tfChange >= 0 ? Colors.bullishDim : Colors.bearishDim }]}>
              <Text style={[styles.changePillText, { color: tfChange >= 0 ? Colors.bullish : Colors.bearish }]}>
                {tfChangeSign}{tfChange.toFixed(2)}% ({timeframe})
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={chartColor} stopOpacity="0.25" />
                <Stop offset="1" stopColor={chartColor} stopOpacity="0" />
              </LinearGradient>
            </Defs>

            {yLabels.map(({ label, y }) => (
              <Line
                key={label}
                x1={PAD_LEFT}
                y1={y}
                x2={PAD_LEFT + plotW}
                y2={y}
                stroke={Colors.separator}
                strokeWidth="0.5"
                strokeDasharray="4,4"
              />
            ))}

            <Polygon points={fillPoints} fill="url(#chartFill)" />
            <Polyline
              points={linePoints}
              fill="none"
              stroke={chartColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>

          <View style={styles.yAxisLabels}>
            {yLabels.reverse().map(({ label, y }) => (
              <View
                key={label}
                style={[styles.yLabel, { top: y - 6 }]}
              >
                <Text style={styles.yLabelText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.timeframeRow}>
          {TIMEFRAMES.map(tf => (
            <Pressable
              key={tf}
              onPress={() => {
                setTimeframe(tf);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[styles.tfBtn, timeframe === tf && styles.tfBtnActive]}
            >
              <Text style={[styles.tfBtnText, timeframe === tf && styles.tfBtnTextActive]}>
                {tf}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>24h Change</Text>
            <Text style={[styles.statValue, { color: isPositive ? Colors.bullish : Colors.bearish }]}>
              {formatChange(asset.changePercent24h)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Period High</Text>
            <Text style={styles.statValue}>{formatPrice(maxPrice, asset.currency)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Period Low</Text>
            <Text style={styles.statValue}>{formatPrice(minPrice, asset.currency)}</Text>
          </View>
        </View>

        {relatedNews.length > 0 && (
          <View style={styles.newsSection}>
            <Text style={styles.newsSectionTitle}>Related News</Text>
            {relatedNews.map(news => {
              const nc = news.marketReaction.change30m;
              const nColor = nc > 0 ? Colors.bullish : nc < 0 ? Colors.bearish : Colors.neutral;
              return (
                <View key={news.id} style={styles.newsRow}>
                  <View style={styles.newsContent}>
                    <Text style={styles.newsHeadline} numberOfLines={2}>
                      {news.headline}
                    </Text>
                    <View style={styles.newsMeta}>
                      <Text style={styles.newsSource}>{news.source}</Text>
                      <View style={[styles.newsChange, { backgroundColor: nc > 0 ? Colors.bullishDim : Colors.bearishDim }]}>
                        <Text style={[styles.newsChangeText, { color: nColor }]}>
                          {nc > 0 ? '+' : ''}{nc.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  headerCenter: { flex: 1 },
  symbol: {
    fontSize: 20, fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary, letterSpacing: -0.5,
  },
  assetName: {
    fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted,
  },
  watchBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  watchBtnActive: {
    backgroundColor: Colors.accentDim, borderColor: Colors.accentDimBorder,
  },
  scroll: { paddingHorizontal: 16 },
  priceSection: { marginBottom: 20, gap: 8 },
  currentPrice: {
    fontSize: 40, fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary, letterSpacing: -1,
  },
  changePills: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  changePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  changePillText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  chartContainer: { position: 'relative', marginBottom: 4 },
  yAxisLabels: { position: 'absolute', right: 0, top: 0, bottom: 0 },
  yLabel: { position: 'absolute', right: 0 },
  yLabelText: {
    fontSize: 9, fontFamily: 'Inter_400Regular',
    color: Colors.textMuted, textAlign: 'right',
  },
  timeframeRow: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12, padding: 4,
    marginBottom: 20,
    gap: 2,
  },
  tfBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: 9,
  },
  tfBtnActive: { backgroundColor: Colors.backgroundTertiary },
  tfBtnText: {
    fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textMuted,
  },
  tfBtnTextActive: { color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  statsRow: {
    flexDirection: 'row', gap: 10, marginBottom: 24,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.card,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder,
    padding: 12, gap: 4,
  },
  statLabel: {
    fontSize: 10, fontFamily: 'Inter_400Regular',
    color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary,
  },
  newsSection: { gap: 12 },
  newsSectionTitle: {
    fontSize: 14, fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary, marginBottom: 4,
  },
  newsRow: {
    backgroundColor: Colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: 12,
  },
  newsContent: { gap: 8 },
  newsHeadline: {
    fontSize: 13, fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary, lineHeight: 18,
  },
  newsMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  newsSource: {
    fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted,
  },
  newsChange: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  newsChangeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});
