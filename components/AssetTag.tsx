import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@/constants/colors';

interface Props {
  symbol: string;
  assetName?: string;
  onPress?: () => void;
  active?: boolean;
  size?: 'sm' | 'md';
}

export function AssetTag({ symbol, assetName, onPress, active = false, size = 'sm' }: Props) {
  const isSm = size === 'sm';
  const content = (
    <View style={[
      styles.tag,
      isSm ? styles.tagSm : styles.tagMd,
      active && styles.tagActive,
    ]}>
      <Text style={[styles.symbol, isSm ? styles.symbolSm : styles.symbolMd, active && styles.symbolActive]}>
        {symbol}
      </Text>
      {assetName && <Text style={styles.name} numberOfLines={1}>{assetName}</Text>}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tagSm: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  tagMd: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagActive: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accentDimBorder,
  },
  symbol: {
    fontFamily: 'Inter_700Bold',
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  symbolSm: {
    fontSize: 10,
  },
  symbolMd: {
    fontSize: 12,
  },
  symbolActive: {
    color: Colors.accent,
  },
  name: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
});
