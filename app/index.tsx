import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { CartesianChart, Line as VictoryLine } from 'victory-native';
import { format, addDays } from 'date-fns';
import { useFont } from '@shopify/react-native-skia';
import inter from "../assets/inter-medium.ttf";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useChartPressState } from 'victory-native';

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



  // Gesture handler for range selection
  const panGesture = Gesture.Pan()
    .onStart((e) => {

    })
    .onUpdate((event) => {

    })
    .onEnd((event) => {

    })

  // Add the chart press state hook
  const { state } = useChartPressState({ x: 0, y: { valueCurr: 0 } });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <View style={{ width: width * 0.9, height: height * 0.6 }}>

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
            {({ points, chartBounds }) => {
              if (!points) return null;
              return (
                <>
                  {sampleData.map((entity, i) => {
                    return (
                      <React.Fragment key={i}>
                        <VictoryLine
                          key={`${entity.entityId}-avg`}
                          points={points.valueAvg || []} // Ensure points are valid
                          color={'#000000'}
                          strokeWidth={2}
                        />
                      </React.Fragment>
                    );
                  })
                  }
                </>
              );
            }}
          </CartesianChart>
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
});
