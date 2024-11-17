// ActiveRect.tsx
import React, {useRef} from 'react';
import {type SharedValue, useDerivedValue, useSharedValue} from 'react-native-reanimated';
import {Rect as SkiaRect} from '@shopify/react-native-skia';
import type {ChartBounds} from 'victory-native';

type ActiveRectType = {
    currentX: SharedValue<number>;
    widthX: SharedValue<number>;
    chartBounds: ChartBounds;
    color?: string;
};

export const ActiveRect = ({
                               currentX,
                               widthX,
                               chartBounds,
                               color = 'rgba(0, 120, 255, 0.2)'
                           }: ActiveRectType) => {

    return widthX?.value ? (
        <SkiaRect
            x={currentX}
            y={chartBounds.top}
            width={widthX}
            height={chartBounds.bottom - chartBounds.top}
            color={color}
        />) : null
};
