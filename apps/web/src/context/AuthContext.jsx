import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../config/api.js';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('duo_user') || 'null');
  } catch (_error) {
    return null;
  }
};

const storeUser = (user) => {
  if (user) {
    localStorage.setItem('duo_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('duo_user');
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));

  const setSession = useCallback((newToken, newUser) => {
    localStorage.setItem('token', newToken);
    storeUser(newUser);
    setToken(newToken);
    setUser(newUser);
    setLoading(false);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    storeUser(null);
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const fetchProfile = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setUser(null);
      setLoading(false);
      return null;
    }

    const isSameToken = () => localStorage.getItem('token') === storedToken;

    try {
      const res = await api.get('/v1/auth/profile');

      if (!isSameToken()) return null;

      storeUser(res.data.user);
      setUser(res.data.user);
      return res.data.user;
    } catch (_error) {
      if (!isSameToken()) {
        if (!localStorage.getItem('token')) clearSession();
        return null;
      }

      clearSession();
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = useCallback(
    async (identifier, password) => {
      const res = await api.post('/v1/auth/login', { identifier, password });
      setSession(res.data.token, res.data.user);
      return res.data;
    },
    [setSession]
  );

  const register = useCallback(
    async (data) => {
      const res = await api.post('/v1/auth/register', data);
      setSession(res.data.token, res.data.user);
      return res.data.user;
    },
    [setSession]
  );

  const updateUser = useCallback((newUser) => {
    storeUser(newUser);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token),
      login,
      register,
      refreshUser: fetchProfile,
      updateUser,
      logout,
    }),
    [token, user, loading, login, register, fetchProfile, updateUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
