import React from 'react';
import { View, ActivityIndicator } from 'react-native';

// Este componente no debería ser visible por mucho tiempo,
// ya que ProtectedRouteGuard en app/_layout.tsx debería redirigir rápidamente.
export default function IndexScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
} 