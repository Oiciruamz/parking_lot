import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from './AuthContext';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const { signIn, resetPassword, loading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Por favor, completa todos los campos');
      return;
    }
    
    try {
      await signIn({ email, password });
      // La navegación se manejará automáticamente a través del AuthContext
    } catch (error) {
      // Los errores ya se manejan en authService
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      alert('Por favor, ingresa tu email');
      return;
    }
    
    try {
      await resetPassword(forgotPasswordEmail);
      setShowForgotPassword(false);
    } catch (error) {
      // Los errores ya se manejan en authService
    }
  };

  const navigateToRegister = () => {
    router.push('/auth/register');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedView style={styles.formContainer}>
          <View style={styles.logoContainer}>
            <FontAwesome name="map-marker" size={80} color="#3498db" />
          </View>
          
          <ThemedText type="title" style={styles.title}>ParkFacu</ThemedText>
          <ThemedText style={styles.subtitle}>Gestión de estacionamiento universitario</ThemedText>
          
          {!showForgotPassword ? (
            <>
              <View style={styles.inputContainer}>
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
              </View>
              
              <TouchableOpacity 
                style={styles.button} 
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.buttonText}>Iniciar Sesión</ThemedText>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setShowForgotPassword(true)}
                style={styles.forgotPasswordButton}
              >
                <ThemedText style={styles.forgotPasswordText}>
                  ¿Olvidaste tu contraseña?
                </ThemedText>
              </TouchableOpacity>
              
              <View style={styles.registerContainer}>
                <ThemedText style={styles.registerQuestionText} >¿No tienes cuenta? </ThemedText>
                <TouchableOpacity onPress={navigateToRegister}>
                  <ThemedText style={styles.registerText}>Regístrate</ThemedText>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email para recuperar contraseña"
                  value={forgotPasswordEmail}
                  onChangeText={setForgotPasswordEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <TouchableOpacity 
                style={styles.button} 
                onPress={handleForgotPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.buttonText}>Recuperar Contraseña</ThemedText>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setShowForgotPassword(false)}
                style={styles.forgotPasswordButton}
              >
                <ThemedText style={styles.forgotPasswordText}>
                  Volver al inicio de sesión
                </ThemedText>
              </TouchableOpacity>
            </>
          )}
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
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 30,
    textAlign: 'center',
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
    textAlign: 'center',
    width: '100%',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  forgotPasswordButton: {
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  forgotPasswordText: {
    color: '#3498db',
    textAlign: 'center',
    flexShrink: 1,
  },
  registerContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 10,
    marginRight: 5
  },
  registerQuestionText: {
    fontSize: 13,
    overflow: 'visible',
    width: 120,

  },
  registerText: {
    width: 75,
    textAlign: 'left',
    color: '#3498db',
    fontWeight: 'bold',

  },
}); 