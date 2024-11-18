import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TextInput } from 'react-native';
import { CartesianChart, Line as VictoryLine } from 'victory-native';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useFont } from '@shopify/react-native-skia';
import inter from "../assets/inter-medium.ttf";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useChartPressState } from 'victory-native';
import { useSharedValue, useAnimatedStyle, SharedValue, useAnimatedProps } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

dayjs.extend(utc);

// Define the LogAnalog type
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

// Function to generate sample data
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

// Generate 100 points for each of 3 sensors
const sampleData = generateSampleData(20) as LogAnalog[];

// Function to convert x position to date
const getDateFromXPosition = (
  xPos: number,
  chartWidth: number,
  data: LogAnalog[],
  format: string = 'DD.MM.YYYY HH:mm'
): string | null => {

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
    opacity: startX.value !== null ? 1 : 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
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
    opacity: endX.value !== null ? 1 : 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  }));

  return (
    <>
      <Animated.View style={startLabelStyle}>
        <ReanimatedText
          animatedProps={startAnimatedProps}
          style={{ fontSize: 12, color: '#000', height: 20, minWidth: 80 }}
          editable={false}
        />
      </Animated.View>
      <Animated.View style={endLabelStyle}>
        <ReanimatedText
          animatedProps={endAnimatedProps}
          style={{ fontSize: 12, color: '#000', height: 20, minWidth: 80 }}
          editable={false}
        />
      </Animated.View>
    </>
  );
}

// Add this type definition near the top of the file
type DragMode = 'none' | 'left' | 'right' | 'new';

export default function App() {
  const selected = {
    start: dayjs().subtract(8, 'd').startOf('day').toDate(),
    end: dayjs().subtract(5, 'd').startOf('day').toDate(),
  }
  const font = useFont(inter, 12);
  const { state } = useChartPressState<{ x: string; y: Record<"valueAvg", number> }>({
    x: '',
    y: { valueAvg: 0 }
  });
  const chartBoundsRef = useRef({ left: 0, right: 0, top: 0, bottom: 0 });
  // get position from selected date
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
  // Shared values for range selection

  const startX = useSharedValue<number | null>(null);
  const endX = useSharedValue<number | null>(null);
  const isSelecting = useSharedValue<DragMode>('none');

  // In the main App component, add these new pieces of state
  const startDate = useSharedValue<Date | null>(null);
  const endDate = useSharedValue<Date | null>(null);


  // Add a state to track chartBounds changes
  const [chartLeft, setChartLeft] = useState(0);

  useEffect(() => {
    startX.value = getXPositionFromDate(selected.start);
    endX.value = getXPositionFromDate(selected.end);
  }, [selected]);

  // Enhanced selection overlay style with more visible defaults
  const selectionOverlayStyle = useAnimatedStyle(() => {
    if (startX.value === null || endX.value === null) {
      return {
        position: 'absolute',
        opacity: 0,
        width: widthBounds,
        height: heightBounds,
        backgroundColor: 'transparent',
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
    };
  }, [chartLeft]);

  // Simplified handle styles for debugging
  const leftHandleStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: chartBoundsRef.current.left + (startX.value !== null ? Math.min(startX.value, endX.value ?? 0) - 6 : 0),
    top: '50%',
    width: 12,
    height: 40,
    marginTop: -20,
    backgroundColor: isSelecting.value === 'left' ? '#0056b3' : '#007AFF', // Darker when dragging
    borderRadius: 6,
    opacity: startX.value !== null ? 1 : 0,
    zIndex: 11,
    transform: [
      { scale: isSelecting.value === 'left' ? 1.1 : 1 } // Slightly larger when dragging
    ]
  }));

  const rightHandleStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: chartBoundsRef.current.left + (endX.value !== null ? Math.max(startX.value ?? 0, endX.value) - 6 : 0),
    top: '50%',
    width: 12,
    height: 40,
    marginTop: -20,
    backgroundColor: isSelecting.value === 'right' ? '#0056b3' : '#007AFF', // Darker when dragging
    borderRadius: 6,
    opacity: endX.value !== null ? 1 : 0,
    zIndex: 11,
    transform: [
      { scale: isSelecting.value === 'right' ? 1.1 : 1 } // Slightly larger when dragging
    ]
  }));

  const gesture = Gesture.Pan()
    .onBegin((event) => {
      const xPos = Math.max(
        0,
        Math.min(
          event.x - chartBoundsRef.current.left,
          chartBoundsRef.current.right - chartBoundsRef.current.left
        )
      );

      // Check if we're near either handle
      const handleWidth = 20; // Increased touch area for handles
      const isNearLeftHandle = startX.value !== null && 
        Math.abs(xPos - startX.value) < handleWidth;
      const isNearRightHandle = endX.value !== null && 
        Math.abs(xPos - endX.value) < handleWidth;

      if (isNearLeftHandle) {
        isSelecting.value = 'left';
      } else if (isNearRightHandle) {
        isSelecting.value = 'right';
      } else if (startX.value === null || endX.value === null) {
        // Start new selection if there isn't one
        isSelecting.value = 'new';
        startX.value = xPos;
        endX.value = xPos;
      } else {
        // Start new selection if clicking outside current selection
        isSelecting.value = 'new';
        startX.value = xPos;
        endX.value = xPos;
      }

      const initialDate = getDateFromXPosition(xPos, chartBoundsRef.current.right - chartBoundsRef.current.left, sampleData);
      if (initialDate) {
        if (isSelecting.value === 'new') {
          startDate.value = initialDate;
          endDate.value = initialDate;
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

      switch (isSelecting.value) {
        case 'left':
          // Don't allow left handle to go beyond right handle
          if (endX.value !== null && xPos < endX.value) {
            startX.value = xPos;
          }
          break;
        case 'right':
          // Don't allow right handle to go before left handle
          if (startX.value !== null && xPos > startX.value) {
            endX.value = xPos;
          }
          break;
        case 'new':
          endX.value = xPos;
          break;
      }
    })
    .onEnd(() => {
      isSelecting.value = 'none';
      console.log('Selection range:', {
        start: startDate.value ? getDateFromXPosition(startX.value ?? 0, chartBoundsRef.current.right - chartBoundsRef.current.left, sampleData) : null,
        end: endDate.value ? getDateFromXPosition(endX.value ?? 0, chartBoundsRef.current.right - chartBoundsRef.current.left, sampleData) : null
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
    setChartLeft(chartBoundsRef.current.left);
  }, [chartBoundsRef.current.left]);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <View style={styles.chartContainer}>
          <CartesianChart
            data={sampleData}
            domainPadding={{ top: 0, bottom: 0, left: 0, right:0 }}
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
                y:
                  Array.from({ length: 6 }, (_, i) => {
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
          <SelectionLabels
            startX={startX}
            endX={endX}
            chartBounds={chartBoundsRef.current}
            data={sampleData}
          />
        </View>
      </GestureDetector>
    </View>
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
});
