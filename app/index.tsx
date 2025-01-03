import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TextInput, Text, Platform } from 'react-native';
import { CartesianChart, Line as VictoryLine } from 'victory-native';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useFont } from '@shopify/react-native-skia';
import inter from "../assets/inter-medium.ttf";
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useChartPressState } from 'victory-native';
import { useSharedValue, useAnimatedStyle, SharedValue, useAnimatedProps } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

dayjs.extend(utc);

const FORMAT_DATE = 'DD.MM.YYYY';
const FORMAT_DATETIME = 'DD.MM.YYYY HH:mm:ss';

type LogAnalog = {
  dateTimeLocal: string;
  entityId: string;
  entityIndex: string;
  entityName: string;
  projectId: string;
  projectName: string;
  serial: string;
  unitName: string;
  valueAvg: number;
  max?: number;
};

const generateSampleData = (points: number): LogAnalog[] => {
  const data: LogAnalog[] = [];
  const startDate = dayjs().subtract(10, 'd').startOf('day').toDate();
  let max = 0;
  for (let i = 0; i < points; i++) {
    const currentDate = dayjs(startDate).add(i, 'd')
    const baseValue = Math.random() * 50 + 20;
    if (max < baseValue) {
      max = baseValue;
    }
    data.push({
      dateTimeLocal: currentDate.format('YYYY-MM-DD HH:mm:ss'),
      entityId: 'entity1',
      entityIndex: '1',
      entityName: `Sensor ${1}`,
      projectId: 'P1',
      projectName: 'Project 1',
      serial: `S00${1}`,
      unitName: 'Celsius',
      valueAvg: baseValue
    });
  }
  data[0].max = max;
  return data;
};

const sampleData = generateSampleData(30) as LogAnalog[];
console.log();

function getDateFromXPosition (
  xPos: number,
  chartWidth: number,
  data: LogAnalog[],
  format = FORMAT_DATETIME
): string | null  {

  const normalizedX = Math.max(0, Math.min(xPos, chartWidth));
  const percentage = normalizedX / chartWidth;

  // Sort data chronologically
  const sortedDates = [...data]
    .sort((a, b) => new Date(a.dateTimeLocal).getTime() - new Date(b.dateTimeLocal).getTime());

  const index = Math.floor(percentage * (sortedDates.length - 1));
  return index >= 0 ? dayjs(sortedDates[index].dateTimeLocal).format(format) : null;
};

function SelectionLabels({
  startX,
  defaultStartDate,
  defaultEndDate,
  endX,
  chartBounds,
  data
}: {
  startX: SharedValue<number | null>,
  endX: SharedValue<number | null>,
  chartBounds: { left: number; right: number; top: number; bottom: number; },
  data: LogAnalog[],
  defaultStartDate: string,
  defaultEndDate: string
}) {
  const ReanimatedText = Animated.createAnimatedComponent(TextInput);

  const startAnimatedProps = useAnimatedProps(() => ({
    value: getDateFromXPosition(startX?.value ?? 0, chartBounds.right - chartBounds.left, data) ?? ''
  }));

  const endAnimatedProps = useAnimatedProps(() => ({
    value: getDateFromXPosition(endX?.value ?? 0, chartBounds.right - chartBounds.left, data) ?? ''
  }));

  const startLabelStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: startX.value ?? 0,
    transform: [{ translateX: -40 }],
    top: -30,
    padding: 4,
    zIndex: 1000,
    borderRadius: 4,
    height: 20,
    opacity: startX.value !== null ? 1 : 0
  }));

  const endLabelStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: endX.value ?? 0,
    transform: [{ translateX: -40 }],
    top: -30,
    padding: 4,
    zIndex: 1000,
    borderRadius: 4,
    height: 20,
    opacity: endX.value !== null ? 1 : 0
  }));

  return (
    <>
      <Animated.View style={startLabelStyle}>
        <ReanimatedText
          animatedProps={startAnimatedProps}
          style={{ fontSize: 18, fontWeight: '600', color: '#000', height: 20, minWidth: 80, borderWidth: 0 }}
          editable={false}
        />
      </Animated.View>
      <Animated.View style={endLabelStyle}>
        <ReanimatedText
          animatedProps={endAnimatedProps}
          style={{ fontSize: 18, fontWeight: '600', color: '#000', height: 20, minWidth: 80, borderWidth: 0 }}
          editable={false}
        />
      </Animated.View>
    </>
  );
}

function SelectedRange({
  startX,
  endX,
  chartBounds,
  data
}: {
  startX: SharedValue<number | null>,
  endX: SharedValue<number | null>,
  chartBounds: { left: number; right: number; top: number; bottom: number; },
  data: LogAnalog[]
}) {
  const ReanimatedText = Animated.createAnimatedComponent(TextInput);

  const startAnimatedProps = useAnimatedProps(() => ({
    value: getDateFromXPosition(startX?.value ?? 0, chartBounds.right - chartBounds.left, data) ?? ''
  }));

  const endAnimatedProps = useAnimatedProps(() => ({
    // value: getDateFromXPosition(endX?.value ?? 0, chartBounds.right - chartBounds.left, data) ?? ''
    value: getDateFromXPosition(endX?.value ?? 0, chartBounds.right - chartBounds.left, data) ?? ''
  }));

  const startLabelStyle = useAnimatedStyle(() => ({
    padding: 4,
    zIndex: 1000,
    height: 20,
    opacity: startX.value !== null ? 1 : 0
  }));

  const endLabelStyle = useAnimatedStyle(() => ({
    padding: 4,
    zIndex: 1000,
    height: 20,
    opacity: endX.value !== null ? 1 : 0
  }));

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Animated.View style={startLabelStyle}>
        <ReanimatedText
          animatedProps={startAnimatedProps}
          style={{ fontSize: 18, fontWeight: '600', color: '#000', height: 20, minWidth: 80, borderWidth: 0 }}
          editable={false}
        />
      </Animated.View>
      <Animated.View style={endLabelStyle}>
        <ReanimatedText
          animatedProps={endAnimatedProps}
          style={{ fontSize: 18, fontWeight: '600', color: '#000', height: 20, minWidth: 80, borderWidth: 0 }}
          editable={false}
        />
      </Animated.View>
    </View>
  );
}

type DragMode = 'none' | 'left' | 'right' | 'new' | 'move';


function getHandlePositions(
  startX: SharedValue<number | null>,
  endX: SharedValue<number | null>
) {
  if (startX.value === null || endX.value === null) {
    return { left: 0, right: 0, isStartLeft: true };
  }
  const isStartLeft = startX.value <= endX.value;
  return {
    left: isStartLeft ? startX.value : endX.value,
    right: isStartLeft ? endX.value : startX.value,
    isStartLeft
  };
}

const SelectedDateLabels = ({ start, end }: { start: Date; end: Date }) => (
  <View style={styles.dateLabelsContainer}>
    <Text style={styles.dateLabel}>Start: {dayjs(start).format(FORMAT_DATE)}</Text>
    <Text style={styles.dateLabel}>End: {dayjs(end).format(FORMAT_DATE)}</Text>
  </View>
);

export default function App() {
  const selected = {
    start: dayjs(sampleData[sampleData.length - 1].dateTimeLocal).subtract(7, 'd').startOf('day').toDate(),
    end: dayjs(sampleData[sampleData.length - 1].dateTimeLocal).toDate(),
  }
  const font = useFont(inter, 12);
  const { state } = useChartPressState<{ x: string; y: Record<"valueAvg", number> }>({
    x: '',
    y: { valueAvg: 0 }
  });
  const chartBoundsRef = useRef({ left: 0, right: 0, top: 0, bottom: 0 });

  const [zoomLevel, setZoomLevel] = useState(1);

  const getXPositionFromDate = (date: Date) => {
    if (!date) return null;

    // Sort data chronologically
    const sortedDates = [...sampleData]
      .sort((a, b) => new Date(a.dateTimeLocal).getTime() - new Date(b.dateTimeLocal).getTime());

    // Get the date range of the data
    const firstDate = dayjs(sortedDates[0].dateTimeLocal);
    const lastDate = dayjs(sortedDates[sortedDates.length - 1].dateTimeLocal);
    const totalDuration = lastDate.diff(firstDate);

    // Calculate where the input date falls within the range
    const dateDiff = dayjs(date).diff(firstDate);
    const percentage = dateDiff / totalDuration;

    // Convert percentage to x position within chart bounds
    return chartBoundsRef.current.left + (widthBounds * percentage);
  }

  const widthBounds = Math.abs(chartBoundsRef.current.right - chartBoundsRef.current.left);
  const heightBounds = Math.abs(chartBoundsRef.current.bottom - chartBoundsRef.current.top);
  const startX = useSharedValue<number | null>(null);
  const endX = useSharedValue<number | null>(null);
  const isSelecting = useSharedValue<DragMode>('none');

  const startDate = useSharedValue<Date | string | null>(null);
  const endDate = useSharedValue<Date | string | null>(null);

  const [chartLeft, setChartLeft] = useState(0);

  const selectionOverlayStyle = useAnimatedStyle(() => {
    if (startX.value === null || endX.value === null) {
      return {
        position: 'absolute',
        opacity: 0,
        width: widthBounds,
        height: heightBounds,
        backgroundColor: 'transparent',
        ...(Platform.OS === 'web' ? { cursor: 'default' } : {}),
      };
    }

    const left = Math.min(startX.value, endX.value) + chartLeft;
    const selectionWidth = Math.abs(endX.value - startX.value);

    return {
      position: 'absolute',
      left,
      top: 0,
      width: selectionWidth,
      height: heightBounds,
      opacity: 1,
      backgroundColor: 'rgba(0, 122, 255, 0.2)',
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: 'rgba(0, 122, 255, 0.8)',
      zIndex: 10,
      ...(Platform.OS === 'web' ? { cursor: isSelecting.value === 'move' ? 'move' : 'default' } : {}),
    };
  }, [chartLeft]);

  const leftHandleStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: chartBoundsRef.current.left + (startX.value !== null ? Math.min(startX.value, endX.value ?? 0) - 6 : 0),
    top: '50%',
    width: 12,
    height: 40,
    marginTop: -20,
    backgroundColor: isSelecting.value === 'left' ? '#0056b3' : '#007AFF',
    borderRadius: 6,
    opacity: startX.value !== null ? 1 : 0,
    zIndex: 11,
    transform: [
      { scale: isSelecting.value === 'left' ? 1.1 : 1 }
    ],
    ...(Platform.OS === 'web' ? { cursor: 'ew-resize' } : {}),
  }));

  const rightHandleStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: chartBoundsRef.current.left + (endX.value !== null ? Math.max(startX.value ?? 0, endX.value) - 6 : 0),
    top: '50%',
    width: 12,
    height: 40,
    marginTop: -20,
    backgroundColor: isSelecting.value === 'right' ? '#0056b3' : '#007AFF',
    borderRadius: 6,
    opacity: endX.value !== null ? 1 : 0,
    zIndex: 11,
    // cursor: 'ew-resize',
    transform: [
      { scale: isSelecting.value === 'right' ? 1.1 : 1 }
    ],
    ...(Platform.OS === 'web' ? { cursor: 'ew-resize' } : {}),
  }));

  const initialTouchX = useSharedValue(0);
  const initialSelectionOffset = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onBegin((event) => {
      const xPos = Math.max(
        0,
        Math.min(
          event.x - chartBoundsRef.current.left,
          chartBoundsRef.current.right - chartBoundsRef.current.left
        )
      );

      const handleWidth = 20;
      const { left, right } = getHandlePositions(startX, endX);

      const isNearLeftHandle = Math.abs(xPos - left) < handleWidth;
      const isNearRightHandle = Math.abs(xPos - right) < handleWidth;
      const isInSelection = xPos > left + handleWidth && xPos < right - handleWidth;

      initialTouchX.value = xPos;
      initialSelectionOffset.value = xPos - left;

      const currentDate = getDateFromXPosition(xPos, chartBoundsRef.current.right - chartBoundsRef.current.left, sampleData);

      if (isNearLeftHandle) {
        isSelecting.value = 'left';
      } else if (isNearRightHandle) {
        isSelecting.value = 'right';
      } else if (isInSelection && startX.value !== null && endX.value !== null) {
        isSelecting.value = 'move';
      } else if (startX.value === null || endX.value === null) {
        isSelecting.value = 'new';
        startX.value = xPos;
        endX.value = xPos;
        if (currentDate) {
          startDate.value = currentDate;
          endDate.value = currentDate;
        }
      } else {
        isSelecting.value = 'new';
        startX.value = xPos;
        endX.value = xPos;
        if (currentDate) {
          startDate.value = currentDate;
          endDate.value = currentDate;
        }
      }
    })
    .onUpdate((event) => {
      if (isSelecting.value === 'none') return;

      const xPos = Math.max(
        0,
        Math.min(
          event.x - chartBoundsRef.current.left,
          chartBoundsRef.current.right - chartBoundsRef.current.left
        )
      );

      const { left, right, isStartLeft } = getHandlePositions(startX, endX);
      const currentDate = getDateFromXPosition(xPos, chartBoundsRef.current.right - chartBoundsRef.current.left, sampleData);

      switch (isSelecting.value) {
        case 'move':
          if (startX.value === null || endX.value === null) return;

          const selectionWidth = Math.abs(endX.value - startX.value);

          let newLeft = xPos - initialSelectionOffset.value;
          let newRight = newLeft + selectionWidth;

          if (newRight > chartBoundsRef.current.right - chartBoundsRef.current.left) {
            newRight = chartBoundsRef.current.right - chartBoundsRef.current.left;
            newLeft = newRight - selectionWidth;
          }

          if (newLeft < 0) {
            newLeft = 0;
            newRight = selectionWidth;
          }


          if (newRight <= chartBoundsRef.current.right - chartBoundsRef.current.left && newLeft >= 0) {
            if (isStartLeft) {
              startX.value = newLeft;
              endX.value = newRight;
            } else {
              endX.value = newLeft;
              startX.value = newRight;
            }

            const newStartDate = getDateFromXPosition(
              newLeft,
              chartBoundsRef.current.right - chartBoundsRef.current.left,
              sampleData
            );
            const newEndDate = getDateFromXPosition(
              newRight,
              chartBoundsRef.current.right - chartBoundsRef.current.left,
              sampleData
            );

            if (newStartDate && newEndDate) {
              if (isStartLeft) {
                startDate.value = newStartDate;
                endDate.value = newEndDate;
              } else {
                endDate.value = newStartDate;
                startDate.value = newEndDate;
              }
            }
          }
          break;
        case 'left':
          if (currentDate) {
            if (isStartLeft) {
              if (xPos < right) {
                startX.value = xPos;
                startDate.value = currentDate
              }
            } else {
              if (xPos < right) {
                endX.value = xPos;
                endDate.value = currentDate
              }
            }
          }
          break;
        case 'right':
          if (currentDate) {
            if (isStartLeft) {
              if (xPos > left) {
                endX.value = xPos;
                endDate.value = currentDate
              }
            } else {
              if (xPos > left) {
                startX.value = xPos;
                startDate.value = currentDate
              }
            }
          }
          break;
        case 'new':
          if (currentDate) {
            endX.value = xPos;
            endDate.value = currentDate
          }
          break;
      }
    })
    .onEnd(() => {
      isSelecting.value = 'none';
      console.log('Selection range:', {
        start: startDate.value ? startDate.value : null,
        end: endDate.value ? endDate.value : null
      });
    })
    .minDistance(0);

  const xTicks = () => {
    const ticks = 10;
    const step = Math.ceil(sampleData.length / ticks)
    return Array.from({ length: ticks }, (_, i) => {
      if (i * step >= sampleData.length) return sampleData.length - 1;
      return i * step
    });
  }

  useEffect(() => {
    if (!selected || !sampleData?.length) return;
    startX.value = getXPositionFromDate(selected.start);
    endX.value = getXPositionFromDate(selected.end) - chartBoundsRef.current.left;

    startDate.value = dayjs(selected.start).format(FORMAT_DATE);
    endDate.value = dayjs(selected.end).format(FORMAT_DATE);


  }, [selected, sampleData]);

  useEffect(() => {
    setChartLeft(chartBoundsRef.current.left);
  }, [chartBoundsRef.current.left]);

  const chartContainerStyle = StyleSheet.create({
    container: {
      width: '90%',
      position: 'relative',
      marginBottom: 50,
      ...(Platform.OS === 'web' ? { cursor: 'default' } : {}),
    },
  });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      if (event.scale) {
        setZoomLevel((prevZoom) => Math.max(0.1, prevZoom * event.scale));
      }
    })
    .onEnd(() => {
      setZoomLevel((prevZoom) => Math.max(0.1, prevZoom));
    });

  const combinedGesture = Gesture.Simultaneous(pinchGesture, gesture);

  useEffect(() => {
    // Update the chart's domain based on the zoom level
    // You can adjust the logic here to fit your charting library's requirements
  }, [zoomLevel]);

  return (
    <GestureHandlerRootView style={{ flex: 1, height: '100%' }}>
      <View style={styles.container}>
        <SelectedDateLabels start={selected.start} end={selected.end} />
        <GestureDetector gesture={combinedGesture}>
          <View style={[styles.chartContainer, chartContainerStyle.container]}>
            <CartesianChart
              data={sampleData}
              domainPadding={{ top: 0, bottom: 0, left: 0, right: 0 }}
              xKey="dateTimeLocal"
              yKeys={["valueAvg"]}
              axisOptions={{
                font,
                formatXLabel: (value) => {
                  return dayjs(value).format('DD.MM')
                },
                tickCount: {
                  x: 10,
                  y: 6
                },
                tickValues: {
                  y: Array.from({ length: 6 }, (_, i) => {
                    const maxValue = sampleData[0]?.max ?? 0;
                    const step = Math.ceil(maxValue / 25) * 5;
                    return i * step;
                  }),
                  x: xTicks()
                },
              }}
              padding={{ top: 0, bottom: 0, left: 0, right: 0 }}
              chartPressState={[state]}
            >
              {({ points, chartBounds }) => {
                chartBoundsRef.current = chartBounds;
                return (
                  <>
                    {sampleData.map((_, i) => (
                      <React.Fragment key={i}>
                        <VictoryLine
                          points={points.valueAvg || []}
                          color={'#000000'}
                          strokeWidth={2}
                        />
                      </React.Fragment>
                    ))}
                  </>
                );
              }}
            </CartesianChart>

            <Animated.View style={selectionOverlayStyle} />
            <Animated.View style={leftHandleStyle} />
            <Animated.View style={rightHandleStyle} />
            {/* <SelectionLabels
            startX={startX}
            endX={endX}
            chartBounds={chartBoundsRef.current}
            data={sampleData}
          /> */}
          </View>
        </GestureDetector>
        <SelectedRange
          startX={startX}
          endX={endX}
          chartBounds={chartBoundsRef.current}
          data={sampleData}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  chartContainer: {
    width: '90%',
    position: 'relative',
    marginBottom: 50, // Increase margin to accommodate labels
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    padding: 10,
  },
  picker: {
    width: 150,
    marginBottom: 10,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  timeRangeButton: {
    padding: 5,
    margin: 2,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  selectedTimeRange: {
    backgroundColor: '#007AFF',
  },
  timeRangeText: {
    fontSize: 12,
  },

  sensorValuesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  sensorValueItem: {
    marginHorizontal: 10,
    marginVertical: 5,
  },
  sensorValueText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateRangeInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  selectionLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    padding: 8,
    borderRadius: 6,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectionLabelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  dateLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '90%',
    marginBottom: 40,
    marginTop: 20,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginHorizontal: 10,
  },
});
