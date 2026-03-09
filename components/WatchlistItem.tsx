import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Asset } from '@/constants/types';
import { Colors } from '@/constants/colors';
import { MiniChart } from './MiniChart';
import { formatPrice } from '@/utils/formatters';

interface Props {
  asset: Asset;
  onRemove?: () => void;
}

export function WatchlistItem({ asset, onRemove }: Props) {
  const isPositive = asset.changePercent24h >= 0;
  const changeColor = asset.changePercent24h === 0 ? Colors.neutral : isPositive ? Colors.bullish : Colors.bearish;
  const changeSign = asset.changePercent24h > 0 ? '+' : '';
  const router = useRouter();

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handleRemove() {
    scale.value = withSpring(0.95, { damping: 20 }, () => {
      scale.value = withSpring(1);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemove?.();
  }

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/chart/${asset.symbol}`);
  }

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.container, pressed && { opacity: 0.85 }]}
        testID={`watchlist-${asset.symbol}`}
      >
        <View style={styles.symbolContainer}>
          <Text style={styles.symbol}>{asset.symbol}</Text>
          <Text style={styles.name} numberOfLines={1}>{asset.name}</Text>
        </View>

        <View style={styles.sparklineArea}>
          <MiniChart
            symbol={asset.symbol}
            currentPrice={asset.price}
            changePercent={asset.changePercent24h}
            width={72}
            height={28}
          />
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(asset.price, asset.currency)}</Text>
          <View style={[styles.changeBadge, { backgroundColor: isPositive ? Colors.bullishDim : Colors.bearishDim }]}>
            <Ionicons
              name={isPositive ? 'caret-up' : 'caret-down'}
              size={10}
              color={changeColor}
            />
            <Text style={[styles.changeText, { color: changeColor }]}>
              {changeSign}{Math.abs(asset.changePercent24h).toFixed(2)}%
            </Text>
          </View>
        </View>

        {onRemove && (
          <Pressable onPress={handleRemove} style={styles.removeBtn} hitSlop={8}>
            <Ionicons name="close" size={16} color={Colors.textMuted} />
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    gap: 12,
  },
  symbolContainer: {
    width: 80,
    gap: 3,
  },
  symbol: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  name: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
  sparklineArea: {
    flex: 1,
    alignItems: 'center',
  },
  priceContainer: {
    alignItems: 'flex-end',
    gap: 5,
    minWidth: 90,
  },
  price: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  changeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.1,
  },
  removeBtn: {
    padding: 4,
  },
});
