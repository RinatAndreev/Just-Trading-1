import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MarketReaction } from '@/constants/types';
import { Colors } from '@/constants/colors';

interface Props {
  reaction: MarketReaction;
  compact?: boolean;
}

function ReactionCell({ label, value, currency }: { label: string; value: number; currency: string }) {
  const isPositive = value >= 0;
  const color = value === 0 ? Colors.neutral : isPositive ? Colors.bullish : Colors.bearish;
  const sign = value > 0 ? '+' : '';
  return (
    <View style={styles.cell}>
      <Text style={[styles.value, { color }]}>{sign}{value.toFixed(1)}%</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function MarketReactionIndicator({ reaction, compact = false }: Props) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <ReactionCell label="5m" value={reaction.change5m} currency={reaction.currency} />
      <View style={styles.divider} />
      <ReactionCell label="30m" value={reaction.change30m} currency={reaction.currency} />
      <View style={styles.divider} />
      <ReactionCell label="1h" value={reaction.change1h} currency={reaction.currency} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 0,
  },
  compact: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.separator,
    marginHorizontal: 4,
  },
});
