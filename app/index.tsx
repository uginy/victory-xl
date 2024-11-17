import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CartesianChart, Line as VictoryLine } from 'victory-native';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useFont } from '@shopify/react-native-skia';
import inter from "../assets/inter-medium.ttf";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useChartPressState } from 'victory-native';
import { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
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
  valueCurr: number;
  valueMax: number;
  valueMin: number;
};

// Add this type definition near the top of the file
type SelectionLabelProps = {
  date: Date | null;
  xPosition: number;
  isStart?: boolean;
};

// Function to generate sample data
const generateSampleData = (points: number): LogAnalog[] => {
  const data: LogAnalog[] = [];
  const startDate = dayjs().subtract(10, 'd').startOf('day').toDate();

  for (let i = 0; i < points; i++) {
    const currentDate = dayjs(startDate).add(i, 'd')
    const baseValue = Math.random() * 50 + 20; // Random base value between 20 and 70
    data.push({
      dateTimeLocal: currentDate.format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'),
      entityId: 'entity1',
      entityIndex: '1',
      entityName: `Sensor ${1}`,
      projectId: 'P1',
      projectName: 'Project 1',
      serial: `S00${1}`,
      unitName: 'Celsius',
      valueAvg: baseValue,
      valueCurr: baseValue + Math.random() * 2 - 1, // Current value within ±1 of average
      valueMax: baseValue + Math.random() * 2, // Max value up to 2 above average
      valueMin: baseValue - Math.random() * 2, // Min value up to 2 below average
    });
  }
  return data;
};

// Generate 100 points for each of 3 sensors
const sampleData = generateSampleData(10);

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
  const isSelecting = useSharedValue(false);

  // In the main App component, add these new pieces of state
  const startDate = useSharedValue<Date | null>(null);
  const endDate = useSharedValue<Date | null>(null);

  // Function to convert x position to date
  const getDateFromXPosition = (xPos: number): Date | null => {
    const chartWidth = widthBounds;
    const normalizedX = Math.max(0, Math.min(xPos, chartWidth));
    const percentage = normalizedX / chartWidth;

    // Sort data chronologically
    const sortedDates = [...sampleData]
      .sort((a, b) => new Date(a.dateTimeLocal).getTime() - new Date(b.dateTimeLocal).getTime());

    const index = Math.floor(percentage * (sortedDates.length - 1));
    return index >= 0 ? dayjs(sortedDates[index].dateTimeLocal).format('YYYY-MM-DD[T]HH:mm:ss') : null;
  };

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

    const left = Math.min(startX.value, endX.value) + chartBoundsRef.current.left;
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
  });

  // Simplified handle styles for debugging
  const leftHandleStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: chartBoundsRef.current.left + (startX.value !== null ? Math.min(startX.value, endX.value ?? 0) - 6 : 0),
    top: '50%',
    width: 12,
    height: 40,
    marginTop: -20,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    opacity: startX.value !== null ? 1 : 0,
    zIndex: 11,
  }));

  const rightHandleStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: chartBoundsRef.current.left + (endX.value !== null ? Math.max(startX.value ?? 0, endX.value) - 6 : 0),
    top: '50%',
    width: 12,
    height: 40,
    marginTop: -20,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    opacity: endX.value !== null ? 1 : 0,
    zIndex: 11,
  }));

  const gesture = Gesture.Pan()
    .onBegin((event) => {
      const chartWidth = widthBounds
      const xPos = - chartBoundsRef.current.left + Math.max(0, Math.min(event.x, chartWidth));
      isSelecting.value = true;
      startX.value = xPos;

      const initialDate = getDateFromXPosition(xPos);
      if (initialDate) {
        startDate.value = initialDate;
        endDate.value = initialDate;
      }
    })
    .onUpdate((event) => {
      if (isSelecting.value) {
        const chartWidth = widthBounds
        const xPos = - chartBoundsRef.current.left + Math.max(0, Math.min(event.x, chartWidth));
        endX.value = xPos;
        const newEndDate = getDateFromXPosition(xPos);
        if (newEndDate) {
          endDate.value = newEndDate;
        }
      }
    })
    .onEnd(() => {
      isSelecting.value = false;
      console.log('Selection range:', {
        start: startDate.value ? dayjs(startDate.value).format('DD-MM-YYYY HH:mm:ss') : null,
        end: endDate.value ? dayjs(endDate.value).format('DD-MM-YYYY HH:mm:ss') : null
      });

    })
    .minDistance(0); // Allow immediate selection without movement

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <View style={styles.chartContainer}>
          <CartesianChart
            data={sampleData}
            domainPadding={{ top: 100, bottom: 100 }}
            xKey="dateTimeLocal"
            yKeys={["valueAvg"]}
            axisOptions={{
              font,
              formatXLabel: (value) => dayjs(value).format('DD-MM'),
              tickCount: { x: 10, y: 5 },
            }}
            chartPressState={[state]}
          >
            {({ points, chartBounds }) => {
              if (!points) return null;
              chartBoundsRef.current = chartBounds
              return (
                <>
                  {sampleData.map((entity, i) => (
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
    height: '60%',
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
