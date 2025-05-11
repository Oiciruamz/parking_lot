import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from './AuthContext';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { red } from 'react-native-reanimated/lib/typescript/Colors';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { signUp, loading } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      alert('Por favor, completa todos los campos');
      return;
    }
    
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      await signUp({ name, email, password });
      // La navegación se manejará automáticamente a través del AuthContext
    } catch (error) {
      // Los errores ya se manejan en authService
    }
  };

  const navigateToLogin = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'android' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedView style={styles.formContainer}>
          <View style={styles.logoContainer}>
            <FontAwesome name="user-plus" size={60} color="#3498db" />
          </View>
          
          <ThemedText type="title" style={styles.title}>Crear Cuenta</ThemedText>
          <ThemedText style={styles.subtitle}>Únete a ParkFacu</ThemedText>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <TextInput
              style={styles.input}
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Registrarse</ThemedText>
            )}
          </TouchableOpacity>
          
            <View style={styles.loginContainer}>
              <ThemedText textBreakStrategy="simple" >¿Ya tienes cuenta?  </ThemedText>
              <TouchableOpacity onPress={navigateToLogin}>
                <ThemedText textBreakStrategy="simple" style={styles.loginText}>  Inicia sesión </ThemedText>
              </TouchableOpacity>
            </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    padding: 20,
    borderRadius: 10,
    margin: 20,
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    display: 'flex',
    textAlign: 'center',
    width: '100%',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    display: 'flex',
    textAlign: 'center',
    width: '100%',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    display: 'flex',
    textAlign: 'center',
    width: '100%',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  loginContainer: {
      flexDirection: 'row',      // ponlos en la misma línea
      flexWrap:     'wrap',      // deja que hagan salto si falta espacio
      marginTop: 10,
    },
    loginText: {
      // width: 50,              ⬅️  ¡fuera!
      color: '#3498db',
      marginRight: 4,            // un pequeño espacio entre textos
    },
}); 