import auth from '@react-native-firebase/auth';
import { Alert } from 'react-native';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Interfaces para datos de usuario
export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserRegistration extends UserCredentials {
  name: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// Servicio de autenticación
class AuthService {
  // Variable para almacenar la sesión del usuario
  private currentUser: FirebaseAuthTypes.User | null = null;
  
  // Observable para cambios en la autenticación
  subscribeAuthChanges(callback: (user: AuthUser | null) => void) {
    return auth().onAuthStateChanged(user => {
      this.currentUser = user;
      
      if (user) {
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        });
      } else {
        callback(null);
      }
    });
  }
  
  // Iniciar sesión con email y contraseña
  async signIn(credentials: UserCredentials): Promise<AuthUser> {
    try {
      const { email, password } = credentials;
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      };
    } catch (error: any) {
      this.handleAuthError(error, 'iniciar sesión');
      throw error;
    }
  }
  
  // Registrar nuevo usuario
  async signUp(userData: UserRegistration): Promise<AuthUser> {
    try {
      const { email, password, name } = userData;
      
      // Crear usuario en Firebase Auth
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Actualizar el nombre del usuario
      await user.updateProfile({
        displayName: name,
      });
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: name,
      };
    } catch (error: any) {
      this.handleAuthError(error, 'registrarse');
      throw error;
    }
  }
  
  // Cerrar sesión
  async signOut(): Promise<void> {
    try {
      await auth().signOut();
      this.currentUser = null;
    } catch (error: any) {
      this.handleAuthError(error, 'cerrar sesión');
      throw error;
    }
  }
  
  // Recuperar contraseña
  async resetPassword(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert(
        "Email enviado",
        "Se ha enviado un email para restablecer tu contraseña."
      );
    } catch (error: any) {
      this.handleAuthError(error, 'restablecer la contraseña');
      throw error;
    }
  }
  
  // Obtener el usuario actual
  getCurrentUser(): AuthUser | null {
    const user = this.currentUser || auth().currentUser;
    
    if (user) {
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      };
    }
    
    return null;
  }
  
  // Manejar errores de autenticación
  private handleAuthError(error: any, operation: string): void {
    let errorMessage = `Error al ${operation}: `;
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage += 'El email ya está en uso por otra cuenta.';
        break;
      case 'auth/invalid-email':
        errorMessage += 'El formato del email no es válido.';
        break;
      case 'auth/weak-password':
        errorMessage += 'La contraseña es demasiado débil.';
        break;
      case 'auth/user-not-found':
        errorMessage += 'No existe usuario con este email.';
        break;
      case 'auth/wrong-password':
        errorMessage += 'Contraseña incorrecta.';
        break;
      case 'auth/too-many-requests':
        errorMessage += 'Demasiados intentos fallidos. Inténtalo más tarde.';
        break;
      default:
        errorMessage += error.message || 'Ocurrió un error desconocido.';
    }
    
    Alert.alert('Error de autenticación', errorMessage);
  }
}

// Exportar una instancia del servicio
export const authService = new AuthService(); 