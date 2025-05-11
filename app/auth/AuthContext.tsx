import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, AuthUser, UserCredentials, UserRegistration } from './authService';

// Interfaz del contexto de autenticación
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (credentials: UserCredentials) => Promise<void>;
  signUp: (userData: UserRegistration) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Crear el contexto
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
});

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);

// Props para el proveedor
interface AuthProviderProps {
  children: ReactNode;
}

// Componente proveedor del contexto
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Suscribirse a cambios en la autenticación
    const unsubscribe = authService.subscribeAuthChanges((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    // Limpiar suscripción al desmontar
    return () => unsubscribe();
  }, []);

  // Métodos de autenticación
  const signIn = async (credentials: UserCredentials) => {
    setLoading(true);
    try {
      const user = await authService.signIn(credentials);
      setUser(user);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData: UserRegistration) => {
    setLoading(true);
    try {
      const user = await authService.signUp(userData);
      setUser(user);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  // Valor del contexto
  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 