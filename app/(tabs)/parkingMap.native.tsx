import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform, ActivityIndicator, Text, Alert, AlertButton, Modal, TouchableOpacity, ScrollView } from 'react-native';
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

// Constantes para el horario del estacionamiento y límites de reserva
const OPENING_HOUR = 6; // 6 AM
const CLOSING_HOUR = 22; // 10 PM
const MIN_RESERVATION_MINUTES = 30;
const MAX_RESERVATION_HOURS = 8;
const MAX_RESERVATION_MINUTES = MAX_RESERVATION_HOURS * 60;
const RESERVATION_INCREMENT_MINUTES = 30;

export default function ParkingMapScreen() {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  // Estado para manejar qué marcadores necesitan tracksViewChanges temporalmente
  const [activeMarkerUpdates, setActiveMarkerUpdates] = useState<Record<string, boolean>>({});
  const [currentUserReservationId, setCurrentUserReservationId] = useState<string | null>(null);

  // Estados para el modal de selección de duración (lista)
  const [isDurationModalVisible, setIsDurationModalVisible] = useState(false);
  const [selectedLotForModal, setSelectedLotForModal] = useState<ParkingLot | null>(null);
  const [availableDurationsForModal, setAvailableDurationsForModal] = useState<{ text: string; minutes: number }[]>([]);

  // Nuevo estado para el tiempo restante de la reserva activa del usuario
  const [activeReservationTimeDisplay, setActiveReservationTimeDisplay] = useState<string>("00:00:00");

  useEffect(() => {
    setLoading(true);
    setError(null);
    const parkingLotsRef = database().ref('/parkingLots');

    const onValueChange = parkingLotsRef.on('value', snapshot => {
      console.log('Firebase data received (onValueChange):', snapshot.val()); // LOG 1
      const data = snapshot.val();
      let newLotsData: ParkingLot[] = []; // Definir fuera para acceso posterior
      let foundUserReservationId: string | null = null; // Para rastrear la reserva activa del usuario

      if (data) {
        newLotsData = Object.keys(data).map(key => ({ // Asignar a la variable externa
          id: key,
          coordinate: data[key].coordinates,
          availability: data[key].status as ParkingLot['availability'],
          reservedBy: data[key].reservedBy,
          reservationTimestamp: data[key].reservationTimestamp,
          reservationExpiryTimestamp: data[key].reservationExpiryTimestamp,
        }));
        console.log('Transformed lots for state:', newLotsData); // LOG 2

        const now = Date.now();
        const updatesToFirebase: Promise<void>[] = [];

        newLotsData.forEach(lot => {
          // 1. Lógica de Expiración Automática
          if (lot.availability === 'reserved' && lot.reservationExpiryTimestamp && lot.reservationExpiryTimestamp < now) {
            console.log(`Lot ${lot.id} reservation expired. Scheduling update to free it.`);
            const lotRef = database().ref(`/parkingLots/${lot.id}`);
            // Usamos una promesa para manejar múltiples actualizaciones si es necesario,
            // aunque la transacción es atómica por sí misma.
            updatesToFirebase.push(
              lotRef.transaction(currentLotData => {
                if (currentLotData && currentLotData.status === 'reserved' && currentLotData.reservationExpiryTimestamp && currentLotData.reservationExpiryTimestamp < now) {
                  return {
                    ...currentLotData,
                    status: 'free',
                    reservedBy: null,
                    reservationTimestamp: null,
                    reservationExpiryTimestamp: null,
                  };
                }
                return currentLotData; // No changes needed or data changed
              }).then(() => {
                console.log(`Transaction successful for expired lot ${lot.id}.`);
              }).catch(error => {
                console.error(`Transaction failed for expired lot ${lot.id}:`, error);
              })
            );
          }

          // 2. Identificar reserva activa del usuario actual (después de considerar expiraciones)
          // Esta comprobación se hará sobre los datos que *serán* después de la expiración.
          // Es importante que esta lógica considere el estado post-expiración.
          // Por ahora, la hacemos sobre newLotsData y se corregirá con la siguiente lectura de Firebase.
          // Una mejor aproximación sería actualizar newLotsData localmente si la transacción tiene éxito inmediato,
          // o simplemente depender del siguiente 'value' event.
          // Para la simplicidad del ejemplo actual, la re-evaluación en el siguiente snapshot es suficiente.
        });
        
        // Después de procesar todas las expiraciones potenciales,
        // re-evaluar newLotsData o esperar el próximo 'value' event.
        // Por ahora, para currentUserReservationId, procesamos el snapshot actual,
        // la expiración se reflejará en el siguiente snapshot que dispare onValueChange.

        newLotsData.forEach(lot => { // Iterar de nuevo sobre los datos (o snapshot) para currentUserReservationId
            if (user && lot.availability === 'reserved' && lot.reservedBy === user.uid && 
                lot.reservationExpiryTimestamp && lot.reservationExpiryTimestamp > now) {
              foundUserReservationId = lot.id;
            }
        });
        setCurrentUserReservationId(foundUserReservationId);


        // Manejo de activeMarkerUpdates (como estaba)
        setParkingLots(prevLots => {
          const markerVisualUpdates: Record<string, boolean> = {};
          // Usamos los datos que acabamos de transformar para comparar
          const currentLotsForDiff = data ? Object.keys(data).map(key => ({
                id: key,
                coordinate: data[key].coordinates,
                availability: data[key].status as ParkingLot['availability'],
                reservedBy: data[key].reservedBy,
            })) : [];


          currentLotsForDiff.forEach(newLot => {
            const oldLot = prevLots.find(l => l.id === newLot.id);
            if (oldLot && oldLot.availability !== newLot.availability) {
              markerVisualUpdates[newLot.id] = true;
            }
          });

          if (Object.keys(markerVisualUpdates).length > 0) {
            setActiveMarkerUpdates(prev => ({ ...prev, ...markerVisualUpdates }));
            Object.keys(markerVisualUpdates).forEach(lotId => {
              setTimeout(() => {
                setActiveMarkerUpdates(prevActives => {
                  const newState = { ...prevActives };
                  delete newState[lotId];
                  return newState;
                });
              }, 1000);
            });
          }
          // Finalmente, actualiza el estado de parkingLots con los datos transformados
          // newLotsData ya fue procesado para expiraciones (las transacciones se dispararon)
          // pero el estado visual se actualizará completamente en el próximo evento 'value'
          // o podemos actualizarlo aquí con el newLotsData que tenemos
          return newLotsData; 
        });

      } else {
        console.log('No data found in /parkingLots or path is empty (onValueChange).'); // LOG 3
        setParkingLots([]);
        setCurrentUserReservationId(null); // No hay datos, no hay reserva
      }
      setLoading(false);
    }, (firebaseError) => {
      console.error('Firebase read error (onValueChange):', firebaseError); // LOG 4
      setError('Error al cargar los cajones. Intenta de nuevo.');
      setLoading(false);
    });

    return () => parkingLotsRef.off('value', onValueChange);
  }, []);

  // useEffect para actualizar los tiempos restantes de las reservas del usuario
  useEffect(() => {
    if (!user || !currentUserReservationId) {
      setActiveReservationTimeDisplay("00:00:00");
      return;
    }

    const intervalId = setInterval(() => {
      const activeLot = parkingLots.find(lot => lot.id === currentUserReservationId);

      if (activeLot && activeLot.availability === 'reserved' && activeLot.reservedBy === user.uid && activeLot.reservationExpiryTimestamp) {
        const now = Date.now();
        const timeLeftMs = activeLot.reservationExpiryTimestamp - now;

        if (timeLeftMs > 0) {
          const totalSeconds = Math.floor(timeLeftMs / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          
          setActiveReservationTimeDisplay(
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          );
        } else {
          setActiveReservationTimeDisplay("00:00:00"); 
          // La lógica de expiración en el otro useEffect se encargará de liberar el lote.
        }
      } else {
        setActiveReservationTimeDisplay("00:00:00");
      }
    }, 1000); // Actualizar cada segundo

    return () => clearInterval(intervalId); // Limpiar intervalo al desmontar o cuando cambien las dependencias
  }, [user, parkingLots, currentUserReservationId]); // Ejecutar si cambia el usuario, la lista de lotes o la reserva activa

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

  // Función para formatear minutos a un string legible (ej. 1 hora, 90 minutos)
  function formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minutos`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hora${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hora${hours > 1 ? 's' : ''} y ${remainingMinutes} minutos      `;
  }

  const handleReserveLot = async (lot: ParkingLot) => {
    // >>> INICIO: Límite de una reserva por usuario
    if (currentUserReservationId && currentUserReservationId !== lot.id) {
      Alert.alert(
        'Límite de reserva alcanzado',
        `Ya tienes el cajón ${currentUserReservationId} reservado. Solo puedes tener una reserva activa a la vez.`
      );
      return;
    }
    // >>> FIN: Límite de una reserva por usuario

    if (lot.availability !== 'free') {
      Alert.alert('Cajón no disponible', 'Este cajón ya está ocupado o reservado.');
      return;
    }

    if (!user) {
      Alert.alert('Usuario no autenticado', 'Por favor, inicia sesión para reservar un cajón.');
      return;
    }

    // Lógica de horario y selección de duración
    const now = new Date();
    const currentHour = now.getHours();

    if (currentHour < OPENING_HOUR || currentHour >= CLOSING_HOUR) {
      Alert.alert('Estacionamiento Cerrado', `El estacionamiento opera de ${OPENING_HOUR}:00 AM a ${CLOSING_HOUR}:00 PM.`);
      return;
    }

    const closingTimeToday = new Date(now);
    closingTimeToday.setHours(CLOSING_HOUR, 0, 0, 0);

    const minutesUntilClose = (closingTimeToday.getTime() - now.getTime()) / (1000 * 60);

    if (minutesUntilClose < MIN_RESERVATION_MINUTES) {
      Alert.alert('Poco tiempo restante', 'No hay suficiente tiempo para una reserva mínima antes del cierre del estacionamiento.');
      return;
    }

    // Lógica para el modal de lista de duraciones (RESTAURADA)
    const maxDurationPossible = Math.min(minutesUntilClose, MAX_RESERVATION_MINUTES);
    
    const durationOptions: { text: string, onPress?: () => void, minutes: number }[] = []; // onPress es opcional aquí, se maneja en el modal
    for (let duration = MIN_RESERVATION_MINUTES; duration <= maxDurationPossible; duration += RESERVATION_INCREMENT_MINUTES) {
      durationOptions.push({
        text: formatDuration(duration),
        minutes: duration,
        // onPress se manejará en el modal al seleccionar de la lista
      });
    }

    if (durationOptions.length === 0) {
         Alert.alert('No hay opciones', 'No hay duraciones de reserva válidas en este momento.');
         return;
    }
    
    setSelectedLotForModal(lot);
    setAvailableDurationsForModal(durationOptions.map(opt => ({ text: opt.text, minutes: opt.minutes })));
    setIsDurationModalVisible(true);
  };

  const handleDurationSelectedFromModal = (durationMinutes: number) => {
    if (selectedLotForModal) {
      confirmAndReserve(selectedLotForModal, durationMinutes); // confirmAndReserve vuelve a tomar durationMinutes
    }
    setIsDurationModalVisible(false);
    setSelectedLotForModal(null);
    setAvailableDurationsForModal([]);
  };

  // confirmAndReserve vuelve a su firma original
  const confirmAndReserve = async (lot: ParkingLot, durationMinutes: number) => {
    if (!user) return;

    // >>> INICIO: Doble chequeo de límite de reserva (por si acaso el estado cambió mientras el modal estaba abierto)
    if (currentUserReservationId && currentUserReservationId !== lot.id) {
      Alert.alert(
        'Límite de reserva alcanzado',
        `Parece que ya tienes una reserva activa (${currentUserReservationId}). No puedes realizar otra.`
      );
      setIsDurationModalVisible(false); // Cerrar el modal si estaba abierto
      setSelectedLotForModal(null);
      setAvailableDurationsForModal([]);
      return;
    }
    // >>> FIN: Doble chequeo

    Alert.alert(
      'Confirmar Reserva',
      `¿Deseas reservar el cajón ${lot.id} por ${formatDuration(durationMinutes)}?`,
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
              reservationTimestamp: database.ServerValue.TIMESTAMP, // Vuelve a ser un timestamp único
              reservationExpiryTimestamp: Date.now() + durationMinutes * 60 * 1000,
            };
            console.log('Attempting to update lot:', lot.id, 'with updates:', updates); 
            try {
              await database().ref(`/parkingLots/${lot.id}`).update(updates);
              console.log('Update successful for lot:', lot.id); 
              Alert.alert('¡Reserva Exitosa!', `Has reservado el cajón ${lot.id} por ${formatDuration(durationMinutes)}.`);
              setCurrentUserReservationId(lot.id); 
              
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
        <ThemedText style={styles.loadingText}>Cargando cajones...    </ThemedText>
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
      {currentUserReservationId && (
        <ThemedText type="title" style={styles.title}>
          Tiempo restante: {activeReservationTimeDisplay}
        </ThemedText>
      )}
      {!currentUserReservationId && (
         <ThemedText type="title" style={styles.title}>
           Realiza una reserva
         </ThemedText>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isDurationModalVisible}
        onRequestClose={() => {
          setIsDurationModalVisible(false);
          setSelectedLotForModal(null);
          setAvailableDurationsForModal([]);
        }}
      >
        <View style={styles.modalCenteredView}>
          <View style={styles.modalView}>
            <ThemedText style={styles.modalTitle}> Seleccionar Duración     </ThemedText>
            <ScrollView style={styles.modalScrollView}>
              {availableDurationsForModal.map((durationOpt) => (
                <TouchableOpacity
                  key={durationOpt.minutes}
                  style={styles.modalOptionButton}
                  onPress={() => handleDurationSelectedFromModal(durationOpt.minutes)}
                >
                  <ThemedText style={styles.modalOptionText}>{durationOpt.text}      </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonClose]}
              onPress={() => {
                setIsDurationModalVisible(false);
                setSelectedLotForModal(null);
                setAvailableDurationsForModal([]);
              }}
            >
              <ThemedText style={styles.modalButtonText}> Cancelar  </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
          let descriptionText = lot.availability === 'free' ? 'Toca para reservar' : `Estado: ${lot.availability}`;

          if (isMyReservation) {
            // Si es mi reserva, el tiempo se muestra arriba.
            descriptionText = `Reservado por ti`; 
            if (lot.id === currentUserReservationId && activeReservationTimeDisplay !== "00:00:00") {
                 descriptionText = `Reservado por ti - Tiempo restante arriba`;
            } else if (lot.reservationExpiryTimestamp && lot.reservationExpiryTimestamp <= Date.now()){
                 descriptionText = 'Reservado por ti - Expirado';
            }
          } else if (lot.availability === 'reserved') {
            descriptionText = 'Reservado por otro';
          }

          return (
            <Marker
              key={`${lot.id}-${isMyReservation ? 'mine' : 'other'}-${activeMarkerUpdates[lot.id]}`}
              coordinate={lot.coordinate}
              pinColor={getPinColor(lot)}
              tracksViewChanges={activeMarkerUpdates[lot.id] || false}
              onPress={() => handleReserveLot(lot)}
              title={`Cajón ${lot.id}`}
              description={descriptionText}
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
  // Estilos para el Modal
  modalCenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Fondo semitransparente
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalScrollView: {
    width: '100%',
    marginBottom: 15,
  },
  modalOptionButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalButton: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonClose: {
    backgroundColor: '#e74c3c', // Rojo para cancelar
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 