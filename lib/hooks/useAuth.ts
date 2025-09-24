import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  role: string;
  email?: string;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Get token from localStorage
  const getToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ems_token');
    }
    return null;
  }, []);

  // Get user from localStorage
  const getUser = useCallback(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('ems_user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch (e) {
          console.error('Error parsing user data:', e);
          return null;
        }
      }
    }
    return null;
  }, []);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    const currentToken = getToken();
    const currentUser = getUser();
    return !!(currentToken && currentUser);
  }, [getToken, getUser]);

  // Login function
  const login = useCallback((authToken: string, userData: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ems_token', authToken);
      localStorage.setItem('ems_user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ems_token');
      localStorage.removeItem('ems_user');
      setToken(null);
      setUser(null);
    }
  }, []);

  // Refresh token and user data
  const refresh = useCallback(() => {
    const currentToken = getToken();
    const currentUser = getUser();
    setToken(currentToken);
    setUser(currentUser);
    setLoading(false);
  }, [getToken, getUser]);

  // Initialize auth state
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Listen for storage changes (when user logs in/out in another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ems_token' || e.key === 'ems_user') {
        refresh();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [refresh]);

  return {
    token,
    user,
    loading,
    isAuthenticated: isAuthenticated(),
    login,
    logout,
    refresh
  };
}
