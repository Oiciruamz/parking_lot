import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform, ActivityIndicator, Text, Alert } from 'react-native';
import MapView, { Marker, Region, LatLng } from 'react-native-maps';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import database from '@react-native-firebase/database';
import { useAuth } from '../auth/AuthContext';

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
  availability: 'free' | 'occupied' | 'reserved';
  reservedBy?: string; // UID del usuario que reservó
  reservationTimestamp?: number; // Timestamp de cuándo se hizo la reserva
  reservationExpiryTimestamp?: number; // Timestamp de cuándo expira
}

const RESERVATION_DURATION_HOURS = 1; // Duración fija de la reserva por ahora

export default function ParkingMapScreen() {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  // Estado para manejar qué marcadores necesitan tracksViewChanges temporalmente
  const [activeMarkerUpdates, setActiveMarkerUpdates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLoading(true);
    setError(null);
    const parkingLotsRef = database().ref('/parkingLots');

    const onValueChange = parkingLotsRef.on('value', snapshot => {
      console.log('Firebase data received (onValueChange):', snapshot.val()); // LOG 1
      const data = snapshot.val();
      if (data) {
        const newLotsData: ParkingLot[] = Object.keys(data).map(key => ({
          id: key,
          coordinate: data[key].coordinates,
          availability: data[key].status as ParkingLot['availability'],
          reservedBy: data[key].reservedBy,
          reservationTimestamp: data[key].reservationTimestamp,
          reservationExpiryTimestamp: data[key].reservationExpiryTimestamp,
        }));
        console.log('Transformed lots for state:', newLotsData); // LOG 2

        // Detectar cambios en la disponibilidad para activar tracksViewChanges
        // Esto es una simplificación; una comparación más profunda podría ser necesaria
        // si otros campos que afectan la vista del marcador cambian.
        setParkingLots(prevLots => {
          const updates: Record<string, boolean> = {};
          newLotsData.forEach(newLot => {
            const oldLot = prevLots.find(l => l.id === newLot.id);
            if (oldLot && oldLot.availability !== newLot.availability) {
              updates[newLot.id] = true;
            }
          });
          if (Object.keys(updates).length > 0) {
            setActiveMarkerUpdates(prev => ({ ...prev, ...updates }));
            // Desactivar después de un tiempo
            Object.keys(updates).forEach(lotId => {
              setTimeout(() => {
                setActiveMarkerUpdates(prev => {
                  const newState = { ...prev };
                  delete newState[lotId];
                  return newState;
                });
              }, 1000); // 1 segundo es usualmente suficiente
            });
          }
          return newLotsData;
        });
      } else {
        console.log('No data found in /parkingLots or path is empty (onValueChange).'); // LOG 3
        setParkingLots([]);
      }
      setLoading(false);
    }, (firebaseError) => {
      console.error('Firebase read error (onValueChange):', firebaseError); // LOG 4
      setError('Error al cargar los cajones. Intenta de nuevo.');
      setLoading(false);
    });

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
  const getPinColor = (lot: ParkingLot) => { 
    console.log(`getPinColor called for lot ${lot.id}: availability=${lot.availability}, reservedBy=${lot.reservedBy}, currentUserUID=${user?.uid}`); // LOG 8

    if (!user && lot.availability === 'reserved') {
        console.log(`Lot ${lot.id}: No user logged in, reserved by other. Color: yellow`); // LOG 9
        return 'yellow'; 
    }
    if (lot.availability === 'reserved') {
      const isMyReservation = lot.reservedBy === user?.uid;
      const color = isMyReservation ? 'red' : 'yellow';
      console.log(`Lot ${lot.id}: Reserved. Is mine? ${isMyReservation}. Color: ${color}`); // LOG 10
      console.log(`FINAL DECISION FOR LOT ${lot.id}: COLOR: ${color}`); // LOG 14 - NUEVO
      return color;
    }
    switch (lot.availability) {
      case 'free':
        console.log(`Lot ${lot.id}: Free. Color: green`); // LOG 11
        return 'green';
      case 'occupied':
        console.log(`Lot ${lot.id}: Occupied. Color: red`); // LOG 12
        return 'red';
      default:
        console.log(`Lot ${lot.id}: Default. Color: blue`); // LOG 13
        return 'blue';
    }
  };

  const handleReserveLot = async (lot: ParkingLot) => {
    if (lot.availability !== 'free') {
      Alert.alert('Cajón no disponible', 'Este cajón ya está ocupado o reservado.');
      return;
    }

    if (!user) {
      Alert.alert('Usuario no autenticado', 'Por favor, inicia sesión para reservar un cajón.');
      return;
    }

    Alert.alert(
      'Confirmar Reserva',
      `¿Deseas reservar el cajón ${lot.id} por ${RESERVATION_DURATION_HOURS} hora(s)?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            const updates = {
              status: 'reserved',
              reservedBy: user.uid,
              reservationTimestamp: database.ServerValue.TIMESTAMP,
              reservationExpiryTimestamp: Date.now() + RESERVATION_DURATION_HOURS * 60 * 60 * 1000,
            };
            console.log('Attempting to update lot:', lot.id, 'with updates:', updates); // LOG 5
            try {
              await database().ref(`/parkingLots/${lot.id}`).update(updates);
              console.log('Update successful for lot:', lot.id); // LOG 6
              Alert.alert('¡Reserva Exitosa!', `Has reservado el cajón ${lot.id}.`);
              
              // Activar tracksViewChanges para este marcador temporalmente
              setActiveMarkerUpdates(prev => ({ ...prev, [lot.id]: true }));
              setTimeout(() => {
                setActiveMarkerUpdates(prev => {
                  const newState = { ...prev };
                  delete newState[lot.id];
                  return newState;
                });
              }, 1000); // 1 segundo

            } catch (e: any) {
              console.error('Update failed for lot:', lot.id, 'Error:', e); // LOG 7
              Alert.alert('Error de Reserva', e.message || 'No se pudo completar la reserva.');
            }
          },
        },
      ]
    );
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
        {parkingLots.map((lot) => {
          const isMyReservation = lot.availability === 'reserved' && lot.reservedBy === user?.uid;
          return (
            <Marker
              key={`${lot.id}-${isMyReservation ? 'mine' : 'other'}-${activeMarkerUpdates[lot.id]}`}
              coordinate={lot.coordinate}
              pinColor={getPinColor(lot)}
              tracksViewChanges={activeMarkerUpdates[lot.id] || false}
              onPress={() => handleReserveLot(lot)}
              title={`Cajón ${lot.id}`}
              description={lot.availability === 'free' ? 'Toca para reservar' : isMyReservation ? 'Reservado por ti' : `Estado: ${lot.availability}`}
            />
          );
        })}
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