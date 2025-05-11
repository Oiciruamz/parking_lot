import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from './AuthContext';
import { FontAwesome } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  
  const handleSignOut = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              // El error ya se maneja en authService
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedView style={styles.header}>
          <View style={styles.avatarContainer}>
            <FontAwesome name="user-circle" size={100} color="#3498db" />
          </View>
          <ThemedText type="title" style={styles.name}>
            {user?.displayName || 'Usuario ParkFacu'}
          </ThemedText>
          <ThemedText style={styles.email}>{user?.email}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Información de cuenta
          </ThemedText>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>ID de usuario:        </ThemedText>
            <ThemedText style={styles.infoValue}>{user?.uid}</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Email:</ThemedText>
            <ThemedText style={styles.infoValue}>{user?.email}</ThemedText>
          </View>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Acciones
          </ThemedText>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
            <FontAwesome name="sign-out" size={20} color="#e74c3c" />
            <ThemedText style={[styles.actionText, { color: '#e74c3c' }]}>
              Cerrar sesión
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    borderRadius: 10,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    opacity: 0.7,
  },
  section: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  infoLabel: {
    fontWeight: 'bold',
    flex: 1,
  },
  infoValue: {
    flex: 2,
    textAlign: 'right',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  actionText: {
    marginLeft: 15,
    fontSize: 16,
    fontWeight: '500',
  },
}); 