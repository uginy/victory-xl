import React from 'react';
import { type SharedValue, useDerivedValue } from 'react-native-reanimated';
import { vec, Line as SkiaLine } from '@shopify/react-native-skia';
import type { ChartBounds } from 'victory-native';

type ActiveLineType = {
  xPosition: SharedValue<number>;
  chartBounds: ChartBounds;
  color?: string;
};

export const ActiveLine = ({
  xPosition,
  chartBounds,
  color = 'red',
}: ActiveLineType) => {
  const start = useDerivedValue(() => vec(xPosition.value, chartBounds.bottom));
  const end = useDerivedValue(() => vec(xPosition.value, chartBounds.top));
  return (
    <SkiaLine
      p1={start}
      p2={end}
      color={color}
      strokeWidth={2}
    />
  );
};
