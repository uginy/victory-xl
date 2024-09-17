import React, { useState, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, useWindowDimensions } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { Picker } from '@react-native-picker/picker';
import { format, addDays } from 'date-fns';
import { useFont } from '@shopify/react-native-skia';
import inter from "../assets/inter-medium.ttf";

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
const sampleData = generateSampleData(2, 100);

const timeRanges = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL', 'CUSTOM'];

// Update the sensorColorMap to use entityId as the key
const sensorColorMap: { [key: string]: string } = {
  '1': '#FF6B6B',  // Coral Red
  '2': '#4ECDC4',  // Caribbean Green
  '3': '#45B7D1',  // Blue Grotto
};

export default function App() {
  const font = useFont(inter, 12);
  const { width, height } = useWindowDimensions();
  const [selectedSensor, setSelectedSensor] = useState('All');
  const [selectedTimeRange, setSelectedTimeRange] = useState('1M');

  const sensors = useMemo(() => {
    const uniqueSensors = Array.from(new Set(sampleData.map(d => d.entityId)));
    return ['All', ...uniqueSensors];
  }, []);

  // Group data by entityId
  const groupedData = useMemo(() => {
    return sampleData.reduce((acc, item) => {
      if (!acc[item.entityId]) {
        acc[item.entityId] = [];
      }
      acc[item.entityId].push(item);
      return acc;
    }, {} as { [key: string]: LogAnalog[] });
  }, [sampleData]);

  // Add this new useMemo hook to get the latest values for each sensor
  const latestSensorValues = useMemo(() => {
    return Object.entries(groupedData).reduce((acc, [entityId, data]) => {
      const latestData = data[data.length - 1];
      acc[entityId] = latestData.valueCurr;
      return acc;
    }, {} as { [key: string]: number });
  }, [groupedData]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Picker
          selectedValue={selectedSensor}
          onValueChange={(itemValue: string) => setSelectedSensor(itemValue)}
          style={styles.picker}
        >
          {sensors.map(sensor => (
            <Picker.Item key={sensor} label={sensor === 'All' ? 'All' : `Sensor ${sensor}`} value={sensor} />
          ))}
        </Picker>
        <View style={styles.timeRangeContainer}>
          {timeRanges.map((range) => (
            <TouchableOpacity
              key={range}
              style={[styles.timeRangeButton, selectedTimeRange === range && styles.selectedTimeRange]}
              onPress={() => setSelectedTimeRange(range)}
            >
              <Text style={styles.timeRangeText}>{range}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* New block to display current sensor values */}
      <View style={styles.sensorValuesContainer}>
        {Object.entries(latestSensorValues).map(([entityId, value]) => (
          <View key={entityId} style={styles.sensorValueItem}>
            <Text style={[styles.sensorValueText, { color: sensorColorMap[entityId] || '#000000' }]}>
              Sensor {entityId}: {value.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ width: width * 0.9, height: height * 0.6 }}>
        <CartesianChart
          data={sampleData}
          domainPadding={{ top: 100, bottom: 100 }}
          xKey="dateTimeLocal"
          yKeys={["valueAvg", "valueCurr", "valueMax", "valueMin"]}
          axisOptions={{
            font,
            formatXLabel: (value) => format(new Date(value), 'MM/dd'),
            tickCount: { x: 5, y: 5 },
          }}
        >
          {({ points }) => (
            <>
              {Object.entries(groupedData).map(([entityId, data]) => {
                // Only render the line if it's the selected sensor or if "All" is selected
                if (selectedSensor === 'All' || selectedSensor === entityId) {
                  return (
                    <>
                      <Line
                        key={`${entityId}-avg`}
                        points={points.valueAvg}
                        color={sensorColorMap[entityId] || '#000000'}
                        strokeWidth={2}
                      />
                      <Line
                        key={`${entityId}-curr`}
                        points={points.valueCurr}
                        color={sensorColorMap[entityId] || '#000000'}
                        strokeWidth={2}
                      />
                      <Line
                        key={`${entityId}-max`}
                        points={points.valueMax}
                        color={sensorColorMap[entityId] || '#000000'}
                        strokeWidth={2}
                      />
                      <Line
                        key={`${entityId}-min`}
                        points={points.valueMin}
                        color={sensorColorMap[entityId] || '#000000'}
                        strokeWidth={2}
                      />
                    </>
                  );
                }
                return null;
              })}
            </>
          )}
        </CartesianChart>
      </View>
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
});
