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

// Coordenadas de las esquinas (para el zoom inicial)
const corners = {
  topLeft: { latitude: 25.72481, longitude: -100.31335 },
  bottomLeft: { latitude: 25.72403, longitude: -100.31334 },
  bottomRight: { latitude: 25.72403, longitude: -100.31169 },
  topRight: { latitude: 25.72476, longitude: -100.31169 },
};

const TARGET_LOT_COUNT = 90;

// --- Definición de las líneas/rutas especificadas ---
const definedPaths: LatLng[][] = [
  // Verticales (iniciales)
  [{ latitude: 25.72411, longitude: -100.31339 }, { latitude: 25.72478, longitude: -100.31340 }],
  [{ latitude: 25.72412, longitude: -100.31328 }, { latitude: 25.72477, longitude: -100.31327 }],
  [{ latitude: 25.72409, longitude: -100.31322 }, { latitude: 25.72477, longitude: -100.31322 }],
  [{ latitude: 25.72407, longitude: -100.31311 }, { latitude: 25.72472, longitude: -100.31306 }],
  [{ latitude: 25.72403, longitude: -100.31297 }, { latitude: 25.72473, longitude: -100.31296 }],
  // Curva
  [{ latitude: 25.72478, longitude: -100.31282 }, { latitude: 25.72473, longitude: -100.31252 }, { latitude: 25.72469, longitude: -100.31278 }],
  // Horizontales (iniciales)
  [{ latitude: 25.72403, longitude: -100.31262 }, { latitude: 25.72403, longitude: -100.31197 }],
  // Nuevas líneas añadidas
  [{ latitude: 25.72411, longitude: -100.31266 }, { latitude: 25.72410, longitude: -100.31196 }], // horizontal
  [{ latitude: 25.72411, longitude: -100.31193 }, { latitude: 25.72404, longitude: -100.31194 }], // vertical
  [{ latitude: 25.72421, longitude: -100.31267 }, { latitude: 25.72423, longitude: -100.31195 }], // horizontal
  [{ latitude: 25.72417, longitude: -100.31265 }, { latitude: 25.72417, longitude: -100.31196 }], // horizontal
  [{ latitude: 25.72416, longitude: -100.31191 }, { latitude: 25.72423, longitude: -100.31191 }], // vertical
  [{ latitude: 25.72483, longitude: -100.31227 }, { latitude: 25.72484, longitude: -100.31170 }], // horizontal
  [{ latitude: 25.72478, longitude: -100.31163 }, { latitude: 25.72402, longitude: -100.31165 }], // vertical
  // Últimas líneas añadidas
  [{ latitude: 25.72441, longitude: -100.31273 }, { latitude: 25.72441, longitude: -100.31273 }], // horizontal (punto único)
  [{ latitude: 25.72441, longitude: -100.31198 }, { latitude: 25.72445, longitude: -100.31196 }, { latitude: 25.72450, longitude: -100.31200 }], // curva
  [{ latitude: 25.72450, longitude: -100.31205 }, { latitude: 25.72449, longitude: -100.31279 }], // horizontal
  [{ latitude: 25.72440, longitude: -100.31277 }, { latitude: 25.72439, longitude: -100.31206 }], // horizontal
];

// --- Funciones Auxiliares (Reutilizadas/Adaptadas) ---

function simpleDistance(p1: LatLng, p2: LatLng): number {
    const dy = p1.latitude - p2.latitude;
    const dx = (p1.longitude - p2.longitude) * Math.cos(p1.latitude * Math.PI / 180);
    return Math.sqrt(dx * dx + dy * dy);
}

function generatePointsAlongPolyline(
    polyline: LatLng[],
    numPoints: number
): LatLng[] {
    const points: LatLng[] = [];
    if (numPoints <= 0 || polyline.length < 2) return points;

    let totalDistance = 0;
    const segmentDistances: number[] = [];
    for (let i = 0; i < polyline.length - 1; i++) {
        const dist = simpleDistance(polyline[i], polyline[i + 1]);
        segmentDistances.push(dist);
        totalDistance += dist;
    }

    if (totalDistance === 0) {
        // Si la distancia es 0 (puntos coincidentes), distribuir uniformemente
        for(let i = 0; i < numPoints; i++) points.push(polyline[0]);
        return points;
    }

    let currentDist = 0;
    let segmentIndex = 0;
    // Ajuste: Distribuir puntos incluyendo inicio y fin correctamente
    const stepDistance = totalDistance / (numPoints > 1 ? numPoints - 1 : 1);

    for (let i = 0; i < numPoints; i++) {
        const targetDist = i * stepDistance;

        // Asegurarse de que el último punto sea exactamente el final
        if (i === numPoints - 1) {
             points.push(polyline[polyline.length - 1]);
             continue;
        }

        while (segmentIndex < segmentDistances.length - 1 && currentDist + segmentDistances[segmentIndex] < targetDist) {
            currentDist += segmentDistances[segmentIndex];
            segmentIndex++;
        }

        const segmentStart = polyline[segmentIndex];
        const segmentEnd = polyline[segmentIndex + 1];
        const segmentLen = segmentDistances[segmentIndex];
        const remainingDist = targetDist - currentDist;
        // Evitar división por cero si el segmento tiene longitud 0
        const t = segmentLen === 0 ? 0 : remainingDist / segmentLen;

        const lat = segmentStart.latitude + t * (segmentEnd.latitude - segmentStart.latitude);
        const lon = segmentStart.longitude + t * (segmentEnd.longitude - segmentStart.longitude);
        points.push({ latitude: lat, longitude: lon });
    }
    return points;
}

export default function ParkingMapScreen() {
  const [parkingLots, setParkingLots] = useState<Array<{ id: string; coordinate: LatLng; availability: 'free' | 'occupied' }>>([]);

  useEffect(() => {
      const allGeneratedPoints: LatLng[] = [];
      let lotIdCounter = 0;

      // Calcular longitud total de todas las rutas definidas
      let totalPathDistance = 0;
      const pathDistances = definedPaths.map(path => {
          let dist = 0;
          for (let i = 0; i < path.length - 1; i++) {
              dist += simpleDistance(path[i], path[i + 1]);
          }
          return dist;
      });
      totalPathDistance = pathDistances.reduce((sum, dist) => sum + dist, 0);

      console.log(`Distancia total de rutas definidas: ${totalPathDistance.toFixed(5)} grados`);

      // Distribuir los puntos proporcionalmente
      definedPaths.forEach((path, index) => {
          const pathRatio = totalPathDistance === 0 ? (1 / definedPaths.length) : (pathDistances[index] / totalPathDistance);
          const pointsForThisPath = Math.round(TARGET_LOT_COUNT * pathRatio);
          console.log(`  - Ruta ${index}: ${pathDistances[index].toFixed(5)} grados, asignando ${pointsForThisPath} puntos.`);

          if (pointsForThisPath > 0 && path.length >= 2) {
              // Usar generatePointsAlongPolyline para todas (funciona para líneas rectas también)
              allGeneratedPoints.push(...generatePointsAlongPolyline(path, pointsForThisPath));
          }
      });

      // Mapear a formato de lote con ID y disponibilidad
      const finalLots = allGeneratedPoints.map((coord) => ({
          id: `lot-${lotIdCounter++}`,
          coordinate: coord,
          availability: (Math.random() > 0.6 ? 'occupied' : 'free') as 'free' | 'occupied',
      }));

      console.log(`Total lotes generados en rutas definidas: ${finalLots.length}`);
      setParkingLots(finalLots);

  }, []);

  // Coordenadas iniciales del mapa
  const initialRegion: Region = {
    latitude: (corners.topLeft.latitude + corners.bottomRight.latitude) / 2,
    longitude: (corners.topLeft.longitude + corners.bottomRight.longitude) / 2,
    latitudeDelta: Math.abs(corners.topLeft.latitude - corners.bottomLeft.latitude) * 1.5,
    longitudeDelta: Math.abs(corners.topLeft.longitude - corners.topRight.longitude) * 1.5,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemedText type="title" style={styles.title}>Disponibilidad por Filas Definidas</ThemedText>
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