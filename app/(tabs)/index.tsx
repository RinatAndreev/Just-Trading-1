import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  RefreshControl, Platform, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { MOCK_NEWS, CATEGORIES } from '@/constants/mockData';
import { NewsItem, Category } from '@/constants/types';
import { NewsCard } from '@/components/NewsCard';
import { useApp } from '@/context/AppContext';

const ALL_KEY = 'all';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { activeCategories, watchlist } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>(ALL_KEY);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const watchlistSymbols = new Set(watchlist.map(w => w.symbol));

  const filteredNews = MOCK_NEWS.filter(item => {
    if (selectedCategory !== ALL_KEY && item.category !== selectedCategory) return false;
    if (!activeCategories.includes(item.category)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.headline.toLowerCase().includes(q) ||
        item.assetSymbol.toLowerCase().includes(q) ||
        item.assetName.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => {
    const aIsWatched = watchlistSymbols.has(a.assetSymbol);
    const bIsWatched = watchlistSymbols.has(b.assetSymbol);
    if (aIsWatched && !bIsWatched) return -1;
    if (!aIsWatched && bIsWatched) return 1;
    if (a.isBreaking && !b.isBreaking) return -1;
    if (!a.isBreaking && b.isBreaking) return 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  function selectCategory(cat: Category | 'all') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(cat);
  }

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.headerArea}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.appTitle}>Just Trading</Text>
            <Text style={styles.appSubtitle}>Financial Intelligence</Text>
          </View>
          <Pressable
            onPress={() => { setSearchActive(p => !p); setSearchQuery(''); }}
            style={styles.iconBtn}
          >
            <Ionicons name={searchActive ? 'close' : 'search'} size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {searchActive && (
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search news, symbols..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
        )}

        <FlatList
          horizontal
          data={[{ key: ALL_KEY, label: 'All' }, ...CATEGORIES.map(c => ({ key: c.key, label: c.label }))]}
          keyExtractor={item => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryBar}
          renderItem={({ item }) => {
            const isActive = selectedCategory === item.key;
            return (
              <Pressable
                onPress={() => selectCategory(item.key as Category | 'all')}
                style={[styles.catBtn, isActive && styles.catBtnActive]}
              >
                <Text style={[styles.catBtnText, isActive && styles.catBtnTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        data={filteredNews}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === 'web' ? 34 + 84 : insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filteredNews.length}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No news found</Text>
            <Text style={styles.emptyText}>Try adjusting your filters</Text>
          </View>
        )}
        renderItem={({ item }) => <NewsCard item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerArea: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  appTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
  },
  categoryBar: {
    paddingRight: 16,
    gap: 8,
  },
  catBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  catBtnActive: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accent,
  },
  catBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  catBtnTextActive: {
    color: Colors.accent,
    fontFamily: 'Inter_600SemiBold',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
});
