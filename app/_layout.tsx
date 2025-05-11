import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Componente para manejar la protección de rutas
function ProtectedRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  
  useEffect(() => {
    if (loading) {
      return; // No hacer nada hasta que la carga inicial del estado de autenticación termine
    }

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!user) { // Usuario NO está autenticado
      if (!inAuthGroup) {
        // Si no está en una pantalla de auth (login/registro), redirigir a login
        router.replace('/auth/login');
      }
      // Si no está autenticado Y está en una pantalla de auth, se queda ahí (no hace nada)
    } else { // Usuario SÍ está autenticado
      if (!inTabsGroup) {
        // Si está autenticado pero NO está en la sección de pestañas, redirigir al mapa
        // Esto cubre el caso de estar en app/index.tsx o incluso en /auth/login después de que user se actualice.
        router.replace('/(tabs)/parkingMap');
      }
      // Si está autenticado Y ya está en las pestañas, se queda ahí (no hace nada)
    }
  }, [user, loading, segments]); // Quitado pathname de las dependencias por ahora
  
  // Mientras carga el estado de autenticación inicial, mostrar indicador
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }
  
  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loadedFonts] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (!loadedFonts) {
      return;
    }

    SplashScreen.hideAsync();
  }, [loadedFonts]);

  return (
    <AuthProvider>
      <ProtectedRouteGuard>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="+not-found" />
            
            {/* Rutas de autenticación */}
            <Stack.Screen 
              name="auth/login" 
              options={{ 
                headerShown: false,
                presentation: 'fullScreenModal'
              }} 
            />
            <Stack.Screen 
              name="auth/register" 
              options={{ 
                headerTitle: 'Crear cuenta',
                presentation: 'modal'
              }} 
            />
            <Stack.Screen 
              name="auth/profile" 
              options={{ 
                headerTitle: 'Mi perfil'
              }} 
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </ProtectedRouteGuard>
    </AuthProvider>
  );
}
