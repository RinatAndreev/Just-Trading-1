import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { generateChartData } from '@/services/marketService';

interface Props {
  symbol: string;
  currentPrice: number;
  changePercent: number;
  width?: number;
  height?: number;
  positiveColor?: string;
  negativeColor?: string;
  showFill?: boolean;
}

export function MiniChart({
  symbol,
  currentPrice,
  changePercent,
  width = 80,
  height = 32,
  positiveColor = '#00C878',
  negativeColor = '#FF4A5A',
  showFill = true,
}: Props) {
  const isPositive = changePercent >= 0;
  const color = isPositive ? positiveColor : negativeColor;

  const points = useMemo(() => {
    const data = generateChartData(symbol, currentPrice, changePercent, '1W');
    if (data.length < 2) return '';

    const prices = data.map(d => d.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;
    const pad = 2;
    const w = width - pad * 2;
    const h = height - pad * 2;

    return data
      .map((d, i) => {
        const x = pad + (i / (data.length - 1)) * w;
        const y = pad + h - ((d.price - minP) / range) * h;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [symbol, currentPrice, changePercent, width, height]);

  const fillPoints = useMemo(() => {
    if (!points) return '';
    const firstX = points.split(' ')[0].split(',')[0];
    const lastX = points.split(' ').pop()?.split(',')[0] ?? firstX;
    const bottom = height;
    return `${firstX},${bottom} ${points} ${lastX},${bottom}`;
  }, [points, height]);

  if (!points) return <View style={{ width, height }} />;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={`fill-${symbol}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.3" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {showFill && (
        <Polygon
          points={fillPoints}
          fill={`url(#fill-${symbol})`}
        />
      )}
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({});
