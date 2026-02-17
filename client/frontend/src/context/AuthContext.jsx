import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // new: prevent UI flash

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setAuthLoading(false);
        return;
      }

      try {
        // quick protected request to validate token — backend will return 401 for invalid/expired tokens
        const res = await fetch('http://localhost:8000/api/user_bookmarks/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`,
          },
        });

        if (res.status === 401) {
          // token invalid on server — clear local cached auth
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setUser(null);
        } else {
          // token valid (or endpoint allows access) -> restore user from localStorage
          setIsAuthenticated(true);
          const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
          setUser(storedUser);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, user, setUser, logout, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
};