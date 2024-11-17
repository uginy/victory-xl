import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { CartesianChart, Line as VictoryLine } from 'victory-native';
import { format, addDays } from 'date-fns';
import { useFont } from '@shopify/react-native-skia';
import inter from "../assets/inter-medium.ttf";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useChartPressState } from 'victory-native';
import { useSharedValue, useAnimatedStyle, withSpring, interpolateColor } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

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

// Function to generate sample data
const generateSampleData = (numSensors: number, pointsPerSensor: number): LogAnalog[] => {
  const data: LogAnalog[] = [];
  const startDate = new Date('2023-01-01');

  for (let sensorId = 1; sensorId <= numSensors; sensorId++) {
    for (let i = 0; i < pointsPerSensor; i++) {
      const currentDate = addDays(startDate, i);
      const baseValue = Math.random() * 50 + 20; // Random base value between 20 and 70
      data.push({
        dateTimeLocal: currentDate.toISOString(),
        entityId: sensorId.toString(),
        entityIndex: sensorId.toString(),
        entityName: `Sensor ${sensorId}`,
        projectId: 'P1',
        projectName: 'Project 1',
        serial: `S00${sensorId}`,
        unitName: 'Celsius',
        valueAvg: baseValue,
        valueCurr: baseValue + Math.random() * 2 - 1, // Current value within ±1 of average
        valueMax: baseValue + Math.random() * 2, // Max value up to 2 above average
        valueMin: baseValue - Math.random() * 2, // Min value up to 2 below average
      });
    }
  }
  return data;
};

// Generate 100 points for each of 3 sensors
const sampleData = generateSampleData(2, 10);

export default function App() {
  const font = useFont(inter, 12);
  const { width, height } = useWindowDimensions();
  const { state } = useChartPressState({ x: 0, y: { valueCurr: 0 } });

  // Shared values for range selection
  const startX = useSharedValue<number | null>(null);
  const endX = useSharedValue<number | null>(null);
  const isSelecting = useSharedValue(false);

  // Function to convert x position to date
  const getDateFromXPosition = (xPos: number): Date | null => {
    const chartWidth = width * 0.9;
    const normalizedX = Math.max(0, Math.min(xPos, chartWidth));
    const percentage = normalizedX / chartWidth;
    
    // Sort data chronologically
    const sortedDates = [...sampleData]
      .sort((a, b) => new Date(a.dateTimeLocal).getTime() - new Date(b.dateTimeLocal).getTime());
    
    const index = Math.floor(percentage * (sortedDates.length - 1));
    return index >= 0 ? new Date(sortedDates[index].dateTimeLocal) : null;
  };

  // Enhanced selection overlay style with more visible defaults
  const selectionOverlayStyle = useAnimatedStyle(() => {
    if (startX.value === null || endX.value === null) {
      return { 
        position: 'absolute',
        opacity: 0,
        width: 0,
        height: '100%',
        backgroundColor: 'transparent',
      };
    }

    const left = Math.min(startX.value, endX.value);
    const selectionWidth = Math.abs(endX.value - startX.value);
    
    return {
      position: 'absolute',
      left,
      width: selectionWidth,
      height: '100%',
      opacity: 1,
      backgroundColor: 'rgba(0, 122, 255, 0.2)',
      borderLeftWidth: 2,
      borderRightWidth: 2,
      borderColor: 'rgba(0, 122, 255, 0.8)',
      zIndex: 10,
    };
  });

  // Simplified handle styles for debugging
  const leftHandleStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: startX.value !== null ? Math.min(startX.value, endX.value ?? 0) - 6 : 0,
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
    left: endX.value !== null ? Math.max(startX.value ?? 0, endX.value) - 6 : 0,
    top: '50%',
    width: 12,
    height: 40,
    marginTop: -20,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    opacity: endX.value !== null ? 1 : 0,
    zIndex: 11,
  }));

  // Updated gesture handler with position clamping
  const panGesture = Gesture.Pan()
    .onStart((event) => {
      const chartWidth = width * 0.9;
      const xPos = Math.max(0, Math.min(event.x, chartWidth));
      isSelecting.value = true;
      startX.value = xPos;
      endX.value = xPos;
    })
    .onUpdate((event) => {
      if (isSelecting.value) {
        const chartWidth = width * 0.9;
        const xPos = Math.max(0, Math.min(event.x, chartWidth));
        endX.value = xPos;
      }
    })
    .onEnd(() => {
      if (startX.value !== null && endX.value !== null) {
        const startDate = getDateFromXPosition(startX.value);
        const endDate = getDateFromXPosition(endX.value);

        if (startDate && endDate) {
          // Ensure dates are in chronological order
          const [rangeStart, rangeEnd] = startDate > endDate 
            ? [endDate, startDate] 
            : [startDate, endDate];

          console.log('Selected Date Range:', {
            start: rangeStart.toISOString(),
            end: rangeEnd.toISOString(),
            formattedStart: format(rangeStart, 'MM/dd/yyyy'),
            formattedEnd: format(rangeEnd, 'MM/dd/yyyy')
          });
        }
      }
      
      // Reset selection
      isSelecting.value = false;
    });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.chartContainer}>
          <CartesianChart
            data={sampleData}
            domainPadding={{ top: 100, bottom: 100 }}
            xKey="dateTimeLocal"
            yKeys={["valueAvg"]}
            axisOptions={{
              font,
              formatXLabel: (value) => format(new Date(value), 'MM/dd'),
              tickCount: { x: 15, y: 5 },
            }}
            chartPressState={[state]}
          >
            {({ points }) => {
              if (!points) return null;
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
          
          {/* Move these after the CartesianChart */}
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
    position: 'relative', // Important for absolute positioning of overlays
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
    padding: 4,
    borderRadius: 4,
    top: -25,
  },
  selectionLabelText: {
    color: 'white',
    fontSize: 12,
  },
});
