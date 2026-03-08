import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sentiment } from '@/constants/types';
import { Colors } from '@/constants/colors';

interface Props {
  sentiment: Sentiment;
  size?: 'sm' | 'md';
}

export function SentimentBadge({ sentiment, size = 'sm' }: Props) {
  const config = {
    bullish: { icon: 'arrow-up' as const, label: 'Bullish', color: Colors.bullish, bg: Colors.bullishDim },
    bearish: { icon: 'arrow-down' as const, label: 'Bearish', color: Colors.bearish, bg: Colors.bearishDim },
    neutral: { icon: 'remove' as const, label: 'Neutral', color: Colors.neutral, bg: Colors.neutralDim },
  }[sentiment];

  const iconSize = size === 'sm' ? 10 : 12;
  const fontSize = size === 'sm' ? 10 : 11;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={iconSize} color={config.color} />
      <Text style={[styles.label, { color: config.color, fontSize }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
});
