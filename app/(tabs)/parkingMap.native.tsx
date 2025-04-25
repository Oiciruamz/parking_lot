import React from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import MapView, { Polygon, Region } from 'react-native-maps';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';

// Coordenadas reales de la zona de estacionamiento principal
const parkingZonesData = [
  {
    id: 'mainParking', // ID descriptivo
    coordinates: [
      { latitude: 25.72481, longitude: -100.31335 }, // Superior izquierda
      { latitude: 25.72403, longitude: -100.31334 }, // Inferior izquierda
      { latitude: 25.72403, longitude: -100.31169 }, // Inferior derecha
      { latitude: 25.72476, longitude: -100.31169 }, // Superior derecha
    ],
    availability: 'high', // Puedes cambiar esto dinámicamente después
  },
  // Se eliminaron las otras zonas de ejemplo
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