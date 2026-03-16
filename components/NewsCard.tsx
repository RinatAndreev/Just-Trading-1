import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Share } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NewsItem } from '@/constants/types';
import { Colors } from '@/constants/colors';
import { SentimentBadge } from './SentimentBadge';
import { AITagsList } from './AITagsList';
import { MarketReactionIndicator } from './MarketReactionIndicator';
import { AssetTag } from './AssetTag';
import { ImpactScore } from './ImpactScore';
import { calculateImpactScore } from '@/utils/impactScore';
import { timeAgo } from '@/utils/formatters';

interface Props {
  item: NewsItem;
  onPress?: (item: NewsItem) => void;
  compact?: boolean;
}

export function NewsCard({ item, onPress, compact = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const scale = useSharedValue(1);
  const router = useRouter();

  const impactScore = calculateImpactScore(item);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePress() {
    scale.value = withSpring(0.98, { damping: 20 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(prev => !prev);
    onPress?.(item);
  }

  function handleAssetPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/chart/${item.assetSymbol}`);
  }

  async function handleShare() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const change = item.marketReaction.change1h;
    const sign = change > 0 ? '+' : '';
    try {
      await Share.share({
        message: `${item.headline}\n\n${item.assetSymbol} moved ${sign}${change.toFixed(1)}% on this news.\n\nvia Just Trading`,
        title: item.headline,
      });
    } catch {}
  }

  const primaryChange = item.marketReaction.change1h;
  const changeColor = primaryChange > 0 ? Colors.bullish : primaryChange < 0 ? Colors.bearish : Colors.neutral;
  const changeSign = primaryChange > 0 ? '+' : '';

  if (compact) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.compactCard, pressed && { opacity: 0.8 }]}
      >
        {item.isBreaking && (
          <View style={styles.breakingBannerCompact}>
            <Text style={styles.breakingTextCompact}>BREAKING</Text>
          </View>
        )}
        <View style={styles.compactSymbolRow}>
          <Pressable onPress={handleAssetPress} style={styles.assetPill}>
            <Text style={styles.assetPillText}>{item.assetSymbol}</Text>
          </Pressable>
          <Text style={[styles.compactChange, { color: changeColor }]}>
            {changeSign}{primaryChange.toFixed(1)}%
          </Text>
        </View>
        <Text style={styles.compactHeadline} numberOfLines={2}>{item.headline}</Text>
        <View style={styles.compactMeta}>
          <Text style={styles.compactSource}>{item.source}</Text>
          <ImpactScore score={impactScore} compact />
        </View>
      </Pressable>
    );
  }

  return (
    <Animated.View style={animStyle}>
      <Pressable onPress={handlePress} style={styles.card}>
        {item.isBreaking && (
          <View style={styles.breakingBanner}>
            <Ionicons name="flash" size={10} color={Colors.accent} />
            <Text style={styles.breakingText}>BREAKING</Text>
          </View>
        )}

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={handleAssetPress} hitSlop={8} testID={`chart-${item.assetSymbol}`}>
              <AssetTag symbol={item.assetSymbol} size="sm" />
            </Pressable>
            <Text style={styles.source}>{item.source}</Text>
            <Text style={styles.time}>{timeAgo(item.publishedAt)}</Text>
          </View>
          <View style={styles.headerRight}>
            <SentimentBadge sentiment={item.sentiment} size="sm" />
            <Pressable onPress={handleShare} hitSlop={8} style={styles.shareBtn} testID={`share-${item.id}`}>
              <Ionicons name="share-outline" size={16} color={Colors.textMuted} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.headline} numberOfLines={expanded ? undefined : 2}>
          {item.headline}
        </Text>

        {expanded && (
          <Text style={styles.summary}>{item.summary}</Text>
        )}

        <View style={styles.reactionRow}>
          <View style={styles.reactionPrimary}>
            <Text style={[styles.reactionChange, { color: changeColor }]}>
              {changeSign}{primaryChange.toFixed(1)}%
            </Text>
            <Text style={styles.reactionLabel}>1h reaction</Text>
          </View>
          <View style={styles.reactionDetail}>
            <MarketReactionIndicator reaction={item.marketReaction} compact columns={2} />
          </View>
        </View>

        <View style={styles.footer}>
          <AITagsList tags={item.tags} />
          <ImpactScore score={impactScore} compact />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    gap: 10,
    overflow: 'hidden',
  },
  breakingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.accentDim,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
  },
  breakingText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.accent,
    letterSpacing: 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareBtn: {
    padding: 2,
  },
  source: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.textMuted,
  },
  time: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
  headline: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  summary: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  reactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reactionPrimary: {
    alignItems: 'center',
    minWidth: 60,
  },
  reactionChange: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  reactionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    marginTop: 1,
  },
  reactionDetail: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 12,
    gap: 8,
    width: 220,
    overflow: 'hidden',
  },
  breakingBannerCompact: {
    position: 'absolute',
    top: 0, right: 0,
    backgroundColor: Colors.accentDim,
    paddingHorizontal: 8, paddingVertical: 3,
    borderBottomLeftRadius: 6,
  },
  breakingTextCompact: {
    fontSize: 8, fontFamily: 'Inter_700Bold',
    color: Colors.accent, letterSpacing: 0.8,
  },
  compactSymbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assetPill: {
    backgroundColor: Colors.accentDim,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1, borderColor: Colors.accentDimBorder,
  },
  assetPillText: {
    fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.accent,
  },
  compactChange: {
    fontSize: 14, fontFamily: 'Inter_700Bold', letterSpacing: -0.3,
  },
  compactHeadline: {
    fontSize: 13, fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary, lineHeight: 18, letterSpacing: -0.1,
  },
  compactMeta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  compactSource: {
    fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textMuted,
  },
});
