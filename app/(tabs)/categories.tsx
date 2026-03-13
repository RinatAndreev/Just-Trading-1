import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { MOCK_NEWS, CATEGORIES } from '@/constants/mockData';
import { Category } from '@/constants/types';
import { NewsCard } from '@/components/NewsCard';
import { MiniChart } from '@/components/MiniChart';
import { useMarketOverview, MarketOverviewItem } from '@/hooks/useMarketData';
import { formatPrice, formatChange } from '@/utils/formatters';

const CATEGORY_ICONS: Record<Category, keyof typeof Ionicons.glyphMap> = {
  stocks: 'trending-up',
  crypto: 'logo-bitcoin',
  commodities: 'cube-outline',
  forex: 'swap-horizontal',
  macro: 'globe-outline',
};

const CATEGORY_COLORS: Record<Category, string> = {
  stocks: '#4F9FFF',
  crypto: '#F7931A',
  commodities: '#FFD700',
  forex: '#A855F7',
  macro: '#22D3EE',
};

function MarketIndexCard({ item }: { item: MarketOverviewItem }) {
  const router = useRouter();
  const isPositive = item.changePercent >= 0;
  const changeColor = isPositive ? Colors.bullish : Colors.bearish;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/chart/${item.symbol}`);
      }}
      style={({ pressed }) => [styles.indexCard, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.indexCardTop}>
        <Text style={styles.indexSymbol}>{item.symbol}</Text>
        <View style={[
          styles.indexChangePill,
          { backgroundColor: isPositive ? Colors.bullishDim : Colors.bearishDim }
        ]}>
          <Ionicons
            name={isPositive ? 'caret-up' : 'caret-down'}
            size={9}
            color={changeColor}
          />
          <Text style={[styles.indexChangeText, { color: changeColor }]}>
            {Math.abs(item.changePercent).toFixed(2)}%
          </Text>
        </View>
      </View>
      <MiniChart
        symbol={item.symbol}
        currentPrice={item.price}
        changePercent={item.changePercent}
        width={120}
        height={40}
        showFill
      />
      <View style={styles.indexCardBottom}>
        <Text style={styles.indexName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.indexPrice}>{formatPrice(item.price, item.currency)}</Text>
      </View>
    </Pressable>
  );
}

export default function MarketsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<Category>('stocks');
  const { data: marketOverview = [], isLoading: overviewLoading } = useMarketOverview();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const categoryNews = MOCK_NEWS.filter(n => n.category === selectedCategory)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  function selectCat(cat: Category) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(cat);
  }

  const ListHeader = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Markets</Text>
        <Text style={styles.subtitle}>Overview & news by sector</Text>
      </View>

      <View style={styles.overviewSection}>
        <View style={styles.overviewHeaderRow}>
          <View style={styles.overviewTitleRow}>
            <View style={styles.overviewDot} />
            <Text style={styles.overviewTitle}>Market Overview</Text>
          </View>
          <Text style={styles.overviewLive}>LIVE</Text>
        </View>

        <FlatList
          horizontal
          data={marketOverview}
          keyExtractor={item => item.symbol}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.overviewList}
          ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
          renderItem={({ item }) => <MarketIndexCard item={item} />}
          ListEmptyComponent={() => overviewLoading ? (
            <View style={styles.overviewLoadingRow}>
              {[1, 2, 3].map(i => (
                <View key={i} style={styles.overviewSkeleton} />
              ))}
            </View>
          ) : null}
        />
      </View>

      <View style={styles.sectionDivider} />

      <View style={styles.categorySection}>
        <Text style={styles.categorySectionLabel}>Browse by Sector</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(cat => {
            const color = CATEGORY_COLORS[cat.key as Category];
            const isActive = selectedCategory === cat.key;
            const count = MOCK_NEWS.filter(n => n.category === cat.key).length;
            return (
              <Pressable
                key={cat.key}
                onPress={() => selectCat(cat.key as Category)}
                style={({ pressed }) => [
                  styles.catCard,
                  isActive && [styles.catCardActive, { borderColor: color }],
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={[styles.catIconBg, { backgroundColor: isActive ? color + '25' : Colors.backgroundTertiary }]}>
                  <Ionicons name={CATEGORY_ICONS[cat.key as Category]} size={18} color={isActive ? color : Colors.textMuted} />
                </View>
                <Text style={[styles.catLabel, isActive && { color }]}>{cat.label}</Text>
                <Text style={styles.catCount}>{count}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.newsSectionHeader}>
        <View style={[styles.newsIndicatorDot, { backgroundColor: CATEGORY_COLORS[selectedCategory] }]} />
        <Text style={styles.newsSectionTitle}>
          {CATEGORIES.find(c => c.key === selectedCategory)?.label} News
        </Text>
        <Text style={styles.newsSectionCount}>{categoryNews.length} articles</Text>
      </View>
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <FlatList
        data={categoryNews}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === 'web' ? 34 + 84 : insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<ListHeader />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No news in this category</Text>
          </View>
        )}
        renderItem={({ item }) => <NewsCard item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  title: {
    fontSize: 22, fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary, letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12, fontFamily: 'Inter_400Regular',
    color: Colors.textMuted, marginTop: 2,
  },
  overviewSection: {
    marginBottom: 4,
    gap: 12,
  },
  overviewHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20,
  },
  overviewTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  overviewDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.bullish,
  },
  overviewTitle: {
    fontSize: 15, fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary, letterSpacing: -0.2,
  },
  overviewLive: {
    fontSize: 9, fontFamily: 'Inter_700Bold',
    color: Colors.bullish, letterSpacing: 1.2,
    borderWidth: 1, borderColor: Colors.bullish,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  overviewList: {
    paddingHorizontal: 20, paddingBottom: 4,
  },
  overviewLoadingRow: {
    flexDirection: 'row', gap: 10,
  },
  overviewSkeleton: {
    width: 140, height: 120, borderRadius: 12,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  indexCard: {
    width: 140,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 12,
    gap: 8,
    overflow: 'hidden',
  },
  indexCardTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  indexSymbol: {
    fontSize: 14, fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary, letterSpacing: -0.3,
  },
  indexChangePill: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5,
  },
  indexChangeText: {
    fontSize: 10, fontFamily: 'Inter_600SemiBold',
  },
  indexCardBottom: { gap: 2 },
  indexName: {
    fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textMuted,
  },
  indexPrice: {
    fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary,
  },
  sectionDivider: {
    height: 1, backgroundColor: Colors.separator,
    marginHorizontal: 20, marginVertical: 18,
  },
  categorySection: { gap: 12, paddingHorizontal: 16, marginBottom: 4 },
  categorySectionLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold',
    color: Colors.textMuted, letterSpacing: 0.8,
  },
  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  catCard: {
    flexBasis: '18%', flexGrow: 1, alignItems: 'center', gap: 6,
    backgroundColor: Colors.card, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 8,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  catCardActive: { backgroundColor: Colors.backgroundSecondary },
  catIconBg: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  catLabel: {
    fontSize: 10, fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary, textAlign: 'center',
  },
  catCount: {
    fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textMuted,
  },
  newsSectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 10, gap: 8, marginTop: 12,
  },
  newsIndicatorDot: { width: 8, height: 8, borderRadius: 4 },
  newsSectionTitle: {
    flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary,
  },
  newsSectionCount: {
    fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted,
  },
  list: { paddingHorizontal: 16 },
  emptyState: {
    alignItems: 'center', paddingVertical: 60, gap: 10,
  },
  emptyTitle: {
    fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textSecondary,
  },
});
