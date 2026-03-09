import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getImpactColor, getImpactLabel } from '@/utils/impactScore';
import { Colors } from '@/constants/colors';

interface Props {
  score: number;
  compact?: boolean;
}

export function ImpactScore({ score, compact = false }: Props) {
  const color = getImpactColor(score);
  const label = getImpactLabel(score);

  if (compact) {
    return (
      <View style={[styles.badge, { borderColor: color, backgroundColor: color + '22' }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.badgeScore, { color }]}>{score}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.labelText}>Impact</Text>
        <Text style={[styles.scoreText, { color }]}>
          {score}<Text style={styles.outOf}>/10</Text>
        </Text>
      </View>
      <View style={styles.barTrack}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.barSegment,
              { backgroundColor: i < score ? color : Colors.cardBorder },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.labelDesc, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  badgeScore: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  container: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  outOf: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
  barTrack: {
    flexDirection: 'row',
    gap: 2,
    height: 4,
  },
  barSegment: {
    flex: 1,
    borderRadius: 2,
  },
  labelDesc: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    textAlign: 'right',
  },
});
