import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Asset } from '@/constants/types';
import { Colors } from '@/constants/colors';

interface Props {
  asset: Asset;
  onRemove?: () => void;
}

export function WatchlistItem({ asset, onRemove }: Props) {
  const isPositive = asset.changePercent24h >= 0;
  const changeColor = asset.changePercent24h === 0 ? Colors.neutral : isPositive ? Colors.bullish : Colors.bearish;
  const changeSign = asset.changePercent24h > 0 ? '+' : '';

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handleRemove() {
    scale.value = withSpring(0.95, { damping: 20 }, () => {
      scale.value = withSpring(1);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemove?.();
  }

  function formatPrice(price: number, currency: string) {
    if (!currency) return price.toFixed(4);
    if (price > 10000) return `${currency}${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    if (price > 100) return `${currency}${price.toFixed(2)}`;
    return `${currency}${price.toFixed(2)}`;
  }

  return (
    <Animated.View style={animStyle}>
      <View style={styles.container}>
        <View style={styles.symbolContainer}>
          <Text style={styles.symbol}>{asset.symbol}</Text>
          <Text style={styles.name} numberOfLines={1}>{asset.name}</Text>
        </View>

        <View style={styles.sparklineArea}>
          <MiniSparkline positive={isPositive} />
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
          <Pressable onPress={handleRemove} style={styles.removeBtn}>
            <Ionicons name="close" size={16} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

function MiniSparkline({ positive }: { positive: boolean }) {
  const color = positive ? Colors.bullish : Colors.bearish;
  const bars = positive
    ? [8, 12, 10, 16, 14, 18, 20]
    : [20, 16, 18, 12, 14, 10, 8];
  return (
    <View style={styles.sparkline}>
      {bars.map((h, i) => (
        <View
          key={i}
          style={{
            width: 4,
            height: h,
            backgroundColor: color,
            borderRadius: 2,
            opacity: 0.6 + (i / bars.length) * 0.4,
            alignSelf: 'flex-end',
          }}
        />
      ))}
    </View>
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
  sparkline: {
    width: 48,
    height: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
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
