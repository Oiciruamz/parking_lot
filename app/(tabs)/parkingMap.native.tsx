import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker, Region, LatLng } from 'react-native-maps';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import database from '@react-native-firebase/database';

// Coordenadas de las esquinas (para el zoom inicial)
const corners = {
  topLeft: { latitude: 25.72481, longitude: -100.31335 },
  bottomLeft: { latitude: 25.72403, longitude: -100.31334 },
  bottomRight: { latitude: 25.72403, longitude: -100.31169 },
  topRight: { latitude: 25.72476, longitude: -100.31169 },
};

// Definimos el tipo para los cajones, incluyendo los posibles estados
interface ParkingLot {
  id: string;
  coordinate: LatLng;
  availability: 'free' | 'occupied' | 'reserved'; // Aseguramos que el tipo de availability sea el correcto
}

export default function ParkingMapScreen() {
  // El estado ahora puede ser ParkingLot[] o ParkingLotFirebase[] según la estructura de Firebase
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const parkingLotsRef = database().ref('/parkingLots');

    const onValueChange = parkingLotsRef.on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        // Transformar los datos de Firebase (objeto) a un array de cajones
        const loadedLots: ParkingLot[] = Object.keys(data).map(key => ({
          id: key,
          coordinate: data[key].coordinates, // Asumiendo que así guardaste las coordenadas
          availability: data[key].status as ParkingLot['availability'], // Asumiendo que así guardaste el estado
        }));
        setParkingLots(loadedLots);
        console.log('Cajones cargados desde Firebase:', loadedLots.length);
      } else {
        setParkingLots([]); // No hay datos o se borraron
        console.log('No se encontraron cajones en /parkingLots o la ruta está vacía.');
      }
      setLoading(false);
    }, (firebaseError) => {
      console.error('Error al leer datos de Firebase:', firebaseError);
      setError('Error al cargar los cajones. Intenta de nuevo.');
      setLoading(false);
    });

    // Desuscribirse al desmontar el componente
    return () => parkingLotsRef.off('value', onValueChange);
  }, []);

  // Coordenadas iniciales del mapa
  const initialRegion: Region = {
    latitude: (corners.topLeft.latitude + corners.bottomRight.latitude) / 2,
    longitude: (corners.topLeft.longitude + corners.bottomRight.longitude) / 2,
    latitudeDelta: Math.abs(corners.topLeft.latitude - corners.bottomLeft.latitude) * 1.5,
    longitudeDelta: Math.abs(corners.topLeft.longitude - corners.topRight.longitude) * 1.5,
  };

  // Lógica para determinar el color del pin
  const getPinColor = (availability: ParkingLot['availability']) => {
    switch (availability) {
      case 'free':
        return 'green';
      case 'occupied':
        return 'red';
      case 'reserved':
        return 'yellow';
      default:
        return 'blue'; // Un color por defecto si el estado es inesperado
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centeredContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#0000ff" />
        <ThemedText style={styles.loadingText}>Cargando cajones...</ThemedText>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centeredContainer} edges={['top']}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        {/* Podrías añadir un botón para reintentar aquí */}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemedText type="title" style={styles.title}>Disponibilidad desde Firebase</ThemedText>

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
            pinColor={getPinColor(lot.availability)}
            // title={`Cajón ${lot.id}`}
            // description={`Estado: ${lot.availability}`}
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
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
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