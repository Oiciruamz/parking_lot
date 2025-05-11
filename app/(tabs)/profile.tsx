import React, { useEffect } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { router } from 'expo-router';
import { useAuth } from '@/app/auth/AuthContext';

export default function ProfileTabScreen() {
  const { user } = useAuth();
  
  useEffect(() => {
    // Redirigir a la pantalla de perfil
    router.replace('/auth/profile');
  }, []);

  // Este componente no debería ser visible, pero por si acaso mostramos algo
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText>Redirigiendo al perfil...</ThemedText>
    </View>
  );
} 