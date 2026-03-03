import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthContext] mount effect running');
    (async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      console.log('[AuthContext] token from storage:', token);

      if (!token) {
        console.log('[AuthContext] no token found, user is unauthenticated');
        setIsAuthenticated(false);
        setUser(null);
        setRole(null);
        setAuthLoading(false);
        return;
      }

      try {
        const res = await fetch('http://localhost:8000/auth/user/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`,
          },
        });

        console.log('[AuthContext] /auth/user/ status:', res.status);

        if (res.status === 200) {
          const u = await res.json();
          console.log('[AuthContext] /auth/user/ payload:', u);
          setIsAuthenticated(true);
          setUser(u);
          localStorage.setItem('user', JSON.stringify(u));

          // Fetch role from dedicated profile endpoint to avoid serializer issues
          try {
            const roleRes = await fetch('http://localhost:8000/api/my_profile/', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Token ${token}`,
              },
            });
            console.log('[AuthContext] /api/my_profile/ status:', roleRes.status);
            if (roleRes.ok) {
              const profileJson = await roleRes.json();
              console.log('[AuthContext] /api/my_profile/ payload:', profileJson);
              const resolvedRole = profileJson?.role || null;
              console.log('[AuthContext] resolvedRole from my_profile:', resolvedRole);
              if (resolvedRole) {
                setRole(resolvedRole);
                localStorage.setItem('role', resolvedRole);
              } else {
                setRole(null);
                localStorage.removeItem('role');
              }
            }
          } catch (e) {
            console.error('[AuthContext] failed to fetch my_profile:', e);
          }
        } else {
          console.warn('[AuthContext] /auth/user/ not 200, clearing auth');
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('role');
          setIsAuthenticated(false);
          setUser(null);
          setRole(null);
        }
      } catch (err) {
        console.error('[AuthContext] Auth check failed:', err);
        setIsAuthenticated(false);
        setUser(null);
        setRole(null);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  // Keep role in sync whenever user changes (e.g., after login/signup)
  useEffect(() => {
    console.log('[AuthContext] user changed:', user);
    if (!user) {
      console.log('[AuthContext] user is null, clearing role');
      setRole(null);
      return;
    }
    const resolvedRole =
      user?.role ||
      user?.profile?.role ||
      localStorage.getItem('role') ||
      null;
    console.log('[AuthContext] resolvedRole from user change:', resolvedRole);
    if (resolvedRole) {
      setRole(resolvedRole);
      localStorage.setItem('role', resolvedRole);
    } else {
      setRole(null);
      localStorage.removeItem('role');
    }
  }, [user]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated, setIsAuthenticated,
      user, setUser,
      role, setRole,
      logout, authLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};