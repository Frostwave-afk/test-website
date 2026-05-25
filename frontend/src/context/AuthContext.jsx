import React, { createContext, useContext, useState, useCallback } from 'react';
import { Auth } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => Auth.getUser());
  const [token, setToken] = useState(() => Auth.getToken());

  const login = useCallback((tokenVal, userVal) => {
    Auth.setToken(tokenVal);
    Auth.setUser(userVal);
    setToken(tokenVal);
    setUser(userVal);
  }, []);

  const logout = useCallback(() => {
    Auth.clear();
    setToken(null);
    setUser(null);
  }, []);

  const isLoggedIn = !!token;
  const isAdmin    = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
