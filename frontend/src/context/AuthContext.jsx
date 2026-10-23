import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token') || null;
    } catch {
      return null;
    }
  });

  const [role, setRole] = useState(() => {
    try {
      return localStorage.getItem('role') || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((newToken, newRole, newUser = null) => {
    try {
      localStorage.setItem('token', newToken);
      localStorage.setItem('role', newRole);
      if (newUser) {
        localStorage.setItem('user', JSON.stringify(newUser));
      } else {
        localStorage.setItem('user', JSON.stringify({ role: newRole }));
      }
    } catch {
      // storage unavailable
    }
    setToken(newToken);
    setRole(newRole);
    setUser(newUser || { role: newRole });
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
    } catch {
      // storage unavailable
    }
    setToken(null);
    setRole(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'role' || e.key === 'user') {
        const storedToken = localStorage.getItem('token');
        const storedRole = localStorage.getItem('role');
        const storedUser = localStorage.getItem('user');
        setToken(storedToken);
        setRole(storedRole);
        try {
          setUser(storedUser ? JSON.parse(storedUser) : null);
        } catch {
          setUser(null);
        }
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [logout]);

  const value = {
    token,
    role,
    user,
    isAuthenticated: Boolean(token),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
