import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('uniconnect_token'));
  const [loading, setLoading] = useState(true);

  // Check current session on mount
  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('uniconnect_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          logout();
        }
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('uniconnect_token', res.data.token);
      localStorage.setItem('uniconnect_user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.success) {
      localStorage.setItem('uniconnect_token', res.data.token);
      localStorage.setItem('uniconnect_user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
  };

  const logout = () => {
    localStorage.removeItem('uniconnect_token');
    localStorage.removeItem('uniconnect_user');
    setToken(null);
    setUser(null);
  };

  const demoLogin = async (role = 'student') => {
    let email = 'kasun@uniconnect.edu';
    if (role === 'staff') email = 'dr.jayawardena@uniconnect.edu';
    else if (role === 'organizer') email = 'malith@uniconnect.edu';
    else if (role === 'admin') email = 'admin@uniconnect.edu';

    return await login(email, 'password123');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('uniconnect_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        demoLogin,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
