import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api.js';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  login: (data: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/check-auth');
        setUser(data);
      } catch (err) {
        console.error('Auth verification failed:', err);
        logout(); // Clear invalid token
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.token || '');
  };

  const logout = () => {
    setUser(null);
    localStorage.clear();
    sessionStorage.clear();
    // Redirect to home if on a protected route
    if (window.location.pathname.startsWith('/profile') || window.location.pathname.startsWith('/checkout')) {
      window.location.href = '/auth';
    } else {
      // Even if they are on home, we should ideally refresh to clear user state completely
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setUser }}>
      {!loading && children}
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
