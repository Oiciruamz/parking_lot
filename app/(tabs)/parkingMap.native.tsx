import React from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import MapView, { Polygon, Region } from 'react-native-maps';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';

// Coordenadas de ejemplo para las zonas (Polígonos)
// Debes reemplazarlas con las coordenadas reales de las zonas de estacionamiento del campus
const parkingZonesData = [
  {
    id: 'zone1',
    coordinates: [
      { latitude: 25.7250, longitude: -100.3120 },
      { latitude: 25.7248, longitude: -100.3125 },
      { latitude: 25.7240, longitude: -100.3123 },
      { latitude: 25.7242, longitude: -100.3118 },
    ],
    availability: 'high', // 'high', 'medium', 'low'
  },
  {
    id: 'zone2',
    coordinates: [
      { latitude: 25.7235, longitude: -100.3140 },
      { latitude: 25.7233, longitude: -100.3145 },
      { latitude: 25.7228, longitude: -100.3143 },
      { latitude: 25.7230, longitude: -100.3138 },
    ],
    availability: 'medium',
  },
    {
    id: 'zone3',
    coordinates: [
      { latitude: 25.7255, longitude: -100.3100 },
      { latitude: 25.7253, longitude: -100.3105 },
      { latitude: 25.7248, longitude: -100.3103 },
      { latitude: 25.7250, longitude: -100.3098 },
    ],
    availability: 'low',
  },
];

// Función para obtener el color basado en la disponibilidad
const getZoneColor = (availability: string) => {
  switch (availability) {
    case 'high':
      return 'rgba(0, 255, 0, 0.5)'; // Verde semitransparente
    case 'medium':
      return 'rgba(255, 255, 0, 0.5)'; // Amarillo semitransparente
    case 'low':
      return 'rgba(255, 0, 0, 0.5)'; // Rojo semitransparente
    default:
      return 'rgba(128, 128, 128, 0.5)'; // Gris por defecto
  }
};

export default function ParkingMapScreen() {
  // Coordenadas iniciales del mapa (Actualizadas)
  const initialRegion: Region = {
    latitude: 25.724528,
    longitude: -100.312694,
    latitudeDelta: 0.005, // Ajustar el zoom según sea necesario
    longitudeDelta: 0.005 * (Dimensions.get('window').width / Dimensions.get('window').height),
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemedText type="title" style={styles.title}>Mapa del Campus</ThemedText>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        mapType="hybrid"
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {parkingZonesData.map((zone) => (
          <Polygon
            key={zone.id}
            coordinates={zone.coordinates}
            fillColor={getZoneColor(zone.availability)}
            strokeColor="rgba(255,255,255,0.7)"
            strokeWidth={1.5}
          />
        ))}
      </MapView>
      <View style={styles.legendContainer}>
        <ThemedText style={styles.legendTitle}>Disponibilidad:</ThemedText>
        <View style={styles.legendItem}>
            <View style={[styles.legendColorBox, { backgroundColor: getZoneColor('high') }]} />
            <ThemedText style={styles.legendText}>Alta</ThemedText>
        </View>
         <View style={styles.legendItem}>
            <View style={[styles.legendColorBox, { backgroundColor: getZoneColor('medium') }]} />
            <ThemedText style={styles.legendText}>Media</ThemedText>
        </View>
         <View style={styles.legendItem}>
            <View style={[styles.legendColorBox, { backgroundColor: getZoneColor('low') }]} />
            <ThemedText style={styles.legendText}>Baja</ThemedText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  title: {
      textAlign: 'center',
      marginVertical: Platform.OS === 'ios' ? 10 : 15,
      color: '#fff',
      fontSize: 22,
      fontWeight: 'bold',
  },
  map: {
    flex: 1,
  },
  legendContainer: {
      padding: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      position: 'absolute',
      bottom: Platform.OS === 'ios' ? 30 : 15,
      right: 15,
      borderRadius: 8,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 3,
  },
   legendTitle: {
      fontWeight: '600',
      marginBottom: 6,
      color: '#fff',
      fontSize: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendColorBox: {
      width: 14,
      height: 14,
      marginRight: 8,
      borderRadius: 3,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  legendText: {
      color: '#eee',
      fontSize: 12,
  }
}); 