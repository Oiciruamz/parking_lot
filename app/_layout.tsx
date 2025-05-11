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
  const pathname = usePathname();
  
  useEffect(() => {
    const inAuthGroup = segments[0] === 'auth';
    
    // Verificar si el usuario está autenticado
    if (!loading) {
      // Si el usuario no está autenticado y no está en el grupo de autenticación,
      // redirigir a la pantalla de login
      if (!user && !inAuthGroup) {
        router.replace('/auth/login');
      }
      
      // Si el usuario está autenticado y está en el grupo de autenticación
      // (excepto en la ruta de perfil), redirigir a la pantalla principal
      if (user && inAuthGroup && !pathname.includes('/auth/profile')) {
        router.replace('/');
      }
    }
  }, [user, loading, segments, pathname]);
  
  // Mientras carga, mostrar indicador
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
