import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AITag } from '@/constants/types';
import { Colors } from '@/constants/colors';

interface Props {
  tags: AITag[];
  scrollable?: boolean;
}

const TAG_STYLES: Record<AITag, { bg: string; text: string; border: string }> = {
  'Bullish': Colors.tagBullish,
  'Bearish': Colors.tagBearish,
  'High Volatility': Colors.tagVolatile,
  'Earnings': Colors.tagEarnings,
  'Regulation': Colors.tagRegulation,
  'Macro Event': Colors.tagMacro,
  'Breakout': Colors.tagBullish,
  'IPO': Colors.tagEarnings,
  'M&A': Colors.tagRegulation,
};

function TagChip({ tag }: { tag: AITag }) {
  const style = TAG_STYLES[tag] ?? Colors.tagMacro;
  return (
    <View style={[styles.tag, { backgroundColor: style.bg, borderColor: style.border }]}>
      <Text style={[styles.tagText, { color: style.text }]}>{tag}</Text>
    </View>
  );
}

export function AITagsList({ tags, scrollable = false }: Props) {
  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {tags.map(tag => <TagChip key={tag} tag={tag} />)}
      </ScrollView>
    );
  }
  return (
    <View style={styles.row}>
      {tags.map(tag => <TagChip key={tag} tag={tag} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
});
