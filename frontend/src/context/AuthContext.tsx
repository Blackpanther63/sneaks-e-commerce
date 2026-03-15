import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loadingAuth: boolean;
  login: (token: string, userData: UserProfile) => void;
  logout: () => void;
  updateUserProfile: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/profile');
          setUser(res.data);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          localStorage.removeItem('token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    };

    initAuth();
  }, []);

  const login = (token: string, userData: UserProfile) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    if (window.location.pathname.startsWith('/profile') || window.location.pathname.startsWith('/checkout')) {
      window.location.href = '/auth';
    } else {
      window.location.reload();
    }
  };

  const updateUserProfile = (data: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider value={{ user, loadingAuth, login, logout, updateUserProfile }}>
      {!loadingAuth && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
