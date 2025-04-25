import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

export default function ParkingMapWebScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Mapa de Estacionamiento</ThemedText>
      <ThemedText style={styles.message}>
        La vista de mapa no está disponible en la versión web por el momento.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 15,
    textAlign: 'center',
  },
}); 