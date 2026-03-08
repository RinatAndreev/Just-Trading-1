import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { NewsItem } from '@/constants/types';
import { Colors } from '@/constants/colors';
import { SentimentBadge } from './SentimentBadge';
import { AITagsList } from './AITagsList';
import { MarketReactionIndicator } from './MarketReactionIndicator';
import { AssetTag } from './AssetTag';

interface Props {
  item: NewsItem;
  onPress?: (item: NewsItem) => void;
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NewsCard({ item, onPress }: Props) {
  const [expanded, setExpanded] = useState(false);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePress() {
    scale.value = withSpring(0.98, { damping: 20 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(prev => !prev);
    onPress?.(item);
  }

  const primaryChange = item.marketReaction.change30m;
  const changeColor = primaryChange > 0 ? Colors.bullish : primaryChange < 0 ? Colors.bearish : Colors.neutral;
  const changeSign = primaryChange > 0 ? '+' : '';

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
            <AssetTag symbol={item.assetSymbol} size="sm" />
            <Text style={styles.source}>{item.source}</Text>
            <Text style={styles.time}>{timeAgo(item.publishedAt)}</Text>
          </View>
          <View style={styles.headerRight}>
            <SentimentBadge sentiment={item.sentiment} size="sm" />
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
            <Text style={styles.reactionLabel}>30m reaction</Text>
          </View>
          <View style={styles.reactionDetail}>
            <MarketReactionIndicator reaction={item.marketReaction} compact />
          </View>
        </View>

        <View style={styles.footer}>
          <AITagsList tags={item.tags} />
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
    alignItems: 'flex-end',
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
  },
});
