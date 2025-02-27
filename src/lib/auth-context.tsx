'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { isAuthenticated, logout } from './api';

// Simple user type for our mock authentication
interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);
        
        // Check if user is authenticated
        const authenticated = isAuthenticated();
        
        if (authenticated) {
          // Get user data from localStorage
          const userData = localStorage.getItem('user_data');
          if (userData) {
            setUser(JSON.parse(userData));
          } else {
            // Create a mock user if we have a token but no user data
            const mockUser = {
              id: 'mock_user_id',
              email: 'user@example.com',
              name: 'User'
            };
            localStorage.setItem('user_data', JSON.stringify(mockUser));
            setUser(mockUser);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        setError(error instanceof Error ? error : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    }
    
    loadUserData();
    
    // Listen for storage events to update auth state
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' || e.key === 'user_data') {
        loadUserData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const signOut = async () => {
    await logout();
    localStorage.removeItem('user_data');
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}