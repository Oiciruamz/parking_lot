import React, { useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import MapView, { Polygon, Region } from 'react-native-maps';
import { ThemedText } from '@/components/ThemedText'; // Asumiendo que tienes este componente

// Coordenadas de ejemplo para las zonas (Polígonos)
// Debes reemplazarlas con las coordenadas reales de las zonas de estacionamiento del campus
const parkingZonesData = [
  {
    id: 'zone1',
    coordinates: [
      { latitude: 37.78925, longitude: -122.43129 },
      { latitude: 37.78825, longitude: -122.43229 },
      { latitude: 37.78725, longitude: -122.43129 },
      { latitude: 37.78825, longitude: -122.43029 },
    ],
    availability: 'high', // 'high', 'medium', 'low'
  },
  {
    id: 'zone2',
    coordinates: [
      { latitude: 37.78625, longitude: -122.43429 },
      { latitude: 37.78525, longitude: -122.43529 },
      { latitude: 37.78425, longitude: -122.43429 },
      { latitude: 37.78525, longitude: -122.43329 },
    ],
    availability: 'medium',
  },
    {
    id: 'zone3',
    coordinates: [
      { latitude: 37.78325, longitude: -122.43029 },
      { latitude: 37.78225, longitude: -122.43129 },
      { latitude: 37.78125, longitude: -122.43029 },
      { latitude: 37.78225, longitude: -122.42929 },
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
  // Coordenadas iniciales del mapa (Centradas en la zona de ejemplo)
  // Debes reemplazarlas por las coordenadas del centro de tu campus
  const initialRegion: Region = {
    latitude: 37.78525,
    longitude: -122.4324,
    latitudeDelta: 0.02, // Zoom inicial
    longitudeDelta: 0.02 * (Dimensions.get('window').width / Dimensions.get('window').height),
  };

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.title}>Mapa de Estacionamiento</ThemedText>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true} // Opcional: muestra la ubicación del usuario
        showsMyLocationButton={true} // Opcional: botón para centrar en el usuario
      >
        {parkingZonesData.map((zone) => (
          <Polygon
            key={zone.id}
            coordinates={zone.coordinates}
            fillColor={getZoneColor(zone.availability)}
            strokeColor="rgba(0,0,0,0.5)" // Color del borde del polígono
            strokeWidth={1}
          />
        ))}
      </MapView>
      <View style={styles.legendContainer}>
        <ThemedText style={styles.legendTitle}>Disponibilidad:</ThemedText>
        <View style={styles.legendItem}>
            <View style={[styles.legendColorBox, { backgroundColor: getZoneColor('high') }]} />
            <ThemedText>Alta</ThemedText>
        </View>
         <View style={styles.legendItem}>
            <View style={[styles.legendColorBox, { backgroundColor: getZoneColor('medium') }]} />
            <ThemedText>Media</ThemedText>
        </View>
         <View style={styles.legendItem}>
            <View style={[styles.legendColorBox, { backgroundColor: getZoneColor('low') }]} />
            <ThemedText>Baja</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // O ajusta según tu tema
  },
  title: {
      textAlign: 'center',
      marginVertical: 10,
      paddingTop: 40, // Ajusta según sea necesario para evitar la barra de estado/notch
  },
  map: {
    flex: 1, // El mapa ocupa el espacio restante
  },
  legendContainer: {
      padding: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.9)', // Fondo semitransparente para la leyenda
      position: 'absolute',
      bottom: 10,
      left: 10,
      borderRadius: 5,
      elevation: 3, // Sombra en Android
      shadowColor: '#000', // Sombra en iOS
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
  },
   legendTitle: {
      fontWeight: 'bold',
      marginBottom: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  legendColorBox: {
      width: 15,
      height: 15,
      marginRight: 5,
      borderWidth: 1,
      borderColor: '#555',
  }
}); 