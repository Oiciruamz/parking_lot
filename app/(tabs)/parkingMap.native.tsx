import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import MapView, { Marker, Region, LatLng } from 'react-native-maps';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- Configuración Estimación de Lotes ---
const LOT_WIDTH_METERS = 4.0; // Ancho estimado de un lote en metros (AUMENTADO MÁS)
const LOT_DEPTH_METERS = 8.0; // Profundidad estimada de un lote en metros (AUMENTADO MÁS)
const AISLE_WIDTH_METERS = 6; // Ancho estimado del pasillo (si aplica a tu cálculo)

// Aproximación: Grados por metro (varía con la latitud, esto es muy aproximado)
const METERS_TO_LAT_DEG = 1 / 111111;
const METERS_TO_LON_DEG_AT_LAT = (lat: number) => 1 / (111111 * Math.cos(lat * Math.PI / 180));

// Coordenadas de las esquinas (las que proporcionaste)
const corners = {
  topLeft: { latitude: 25.72481, longitude: -100.31335 },
  bottomLeft: { latitude: 25.72403, longitude: -100.31334 },
  bottomRight: { latitude: 25.72403, longitude: -100.31169 },
  topRight: { latitude: 25.72476, longitude: -100.31169 },
};

// --- Función para generar lotes aleatorios dentro del área ---
function generateRandomLots(
    count: number,
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number
): Array<{ id: string; coordinate: LatLng; availability: 'free' | 'occupied' }> {
    const lots = [];
    for (let i = 0; i < count; i++) {
        const randomLat = minLat + Math.random() * (maxLat - minLat);
        const randomLon = minLon + Math.random() * (maxLon - minLon);
        lots.push({
            id: `random-lot-${i}`,
            coordinate: { latitude: randomLat, longitude: randomLon },
            // Asignar disponibilidad aleatoria para ejemplo
            availability: (Math.random() > 0.6 ? 'occupied' : 'free') as 'free' | 'occupied',
        });
    }
    console.log(`Generados ${lots.length} lotes aleatorios.`);
    return lots;
}

export default function ParkingMapScreen() {
  const [parkingLots, setParkingLots] = useState<Array<{ id: string; coordinate: LatLng; availability: 'free' | 'occupied' }>>([]);
  const TARGET_LOT_COUNT = 190;

  // Generar lotes aleatorios una vez al montar el componente
  useEffect(() => {
      // Determinar los límites del rectángulo
      const minLat = Math.min(corners.topLeft.latitude, corners.bottomLeft.latitude, corners.bottomRight.latitude, corners.topRight.latitude);
      const maxLat = Math.max(corners.topLeft.latitude, corners.bottomLeft.latitude, corners.bottomRight.latitude, corners.topRight.latitude);
      const minLon = Math.min(corners.topLeft.longitude, corners.bottomLeft.longitude, corners.bottomRight.longitude, corners.topRight.longitude);
      const maxLon = Math.max(corners.topLeft.longitude, corners.bottomLeft.longitude, corners.bottomRight.longitude, corners.topRight.longitude);

      const randomLots = generateRandomLots(TARGET_LOT_COUNT, minLat, maxLat, minLon, maxLon);
      setParkingLots(randomLots);
  }, []);

  // Coordenadas iniciales del mapa (Centradas en el estacionamiento)
  const initialRegion: Region = {
    latitude: (corners.topLeft.latitude + corners.bottomRight.latitude) / 2,
    longitude: (corners.topLeft.longitude + corners.bottomRight.longitude) / 2,
    latitudeDelta: Math.abs(corners.topLeft.latitude - corners.bottomLeft.latitude) * 1.5,
    longitudeDelta: Math.abs(corners.topLeft.longitude - corners.topRight.longitude) * 1.5,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemedText type="title" style={styles.title}>Disponibilidad Estacionamiento (Aleatorio)</ThemedText>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        mapType="standard"
        showsUserLocation={true}
        showsMyLocationButton={true}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {parkingLots.map((lot) => (
          <Marker
            key={lot.id}
            coordinate={lot.coordinate}
            pinColor={lot.availability === 'free' ? 'green' : 'red'}
          />
        ))}
      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  title: {
      textAlign: 'center',
      marginVertical: Platform.OS === 'ios' ? 10 : 15,
      color: '#333',
      fontSize: 20,
      fontWeight: 'bold',
  },
  map: {
    flex: 1,
  },
}); 