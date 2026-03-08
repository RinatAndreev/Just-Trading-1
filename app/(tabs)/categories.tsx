import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SectionList, Pressable, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { MOCK_NEWS, CATEGORIES } from '@/constants/mockData';
import { Category } from '@/constants/types';
import { NewsCard } from '@/components/NewsCard';

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

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<Category>('stocks');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const news = MOCK_NEWS.filter(n => n.category === selectedCategory)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  function selectCat(cat: Category) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(cat);
  }

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.subtitle}>Browse by market</Text>
      </View>

      <View style={styles.categoryGrid}>
        {CATEGORIES.map(cat => {
          const color = CATEGORY_COLORS[cat.key as Category];
          const isActive = selectedCategory === cat.key;
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
              <Text style={styles.catCount}>
                {MOCK_NEWS.filter(n => n.category === cat.key).length}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionHeader}>
        <View style={[styles.sectionDot, { backgroundColor: CATEGORY_COLORS[selectedCategory] }]} />
        <Text style={styles.sectionTitle}>
          {CATEGORIES.find(c => c.key === selectedCategory)?.label} News
        </Text>
        <Text style={styles.sectionCount}>{news.length} articles</Text>
      </View>

      <SectionList
        sections={[{ data: news }]}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === 'web' ? 34 + 84 : insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No news in this category</Text>
          </View>
        )}
        renderItem={({ item }) => <NewsCard item={item} />}
        renderSectionHeader={() => null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 4,
  },
  catCard: {
    flexBasis: '18%', flexGrow: 1, alignItems: 'center', gap: 6,
    backgroundColor: Colors.card, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  catCardActive: {
    backgroundColor: Colors.backgroundSecondary,
  },
  catIconBg: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  catLabel: {
    fontSize: 10, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, textAlign: 'center',
  },
  catCount: {
    fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textMuted,
  },
  divider: { height: 1, backgroundColor: Colors.separator, marginHorizontal: 16, marginVertical: 12 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10, gap: 8,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  sectionCount: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  list: { paddingHorizontal: 16, paddingTop: 0 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
});
