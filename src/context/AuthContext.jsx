import { createContext, useContext, useState, useCallback } from 'react';
import { saveAuth, clearAuth, getToken, getUser, generateToken, ROLE_HOME } from '../utils/auth';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser);
  const [token, setToken] = useState(getToken);

  const login = useCallback(async (email, password) => {
    const res = await api.get('/users', { params: { email } });
    const found = res.data.find((u) => u.email === email && u.password === password);
    if (!found) throw new Error('Invalid email or password');
    const { password: _pw, ...safeUser } = found;
    const jwt = generateToken(safeUser);
    saveAuth(jwt, safeUser);
    setToken(jwt);
    setUser(safeUser);
    return safeUser;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    const updated = { ...getUser(), ...updates };
    localStorage.setItem('emp_mgmt_user', JSON.stringify(updated));
    setUser(updated);
  }, []);

  const homeRoute = user ? (ROLE_HOME[user.role] || '/dashboard') : '/login';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, homeRoute, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
