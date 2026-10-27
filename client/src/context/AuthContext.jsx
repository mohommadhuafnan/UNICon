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

  // Quick Switcher for testing all official SEUSL roles
  const demoLogin = async (role = 'STUDENT') => {
    const upper = role.toUpperCase();
    let email = 'kasun@seu.ac.lk'; // Default Student

    if (upper === 'SUPER_ADMIN' || upper === 'ADMIN') {
      email = 'admin@seu.ac.lk';
    } else if (upper === 'UNIVERSITY_ADMIN') {
      email = 'registrar@seu.ac.lk';
    } else if (upper === 'FACULTY_OFFICER' || upper === 'STAFF') {
      email = 'fo.tech@seu.ac.lk';
    } else if (upper === 'HOSTEL_WARDEN') {
      email = 'warden.hijra@seu.ac.lk';
    } else if (upper === 'HOSTEL_SUB_WARDEN') {
      email = 'subwarden@seu.ac.lk';
    } else if (upper === 'MAINTENANCE_OFFICER') {
      email = 'maintenance@seu.ac.lk';
    } else if (upper === 'LIBRARY_OFFICER') {
      email = 'librarian@seu.ac.lk';
    } else if (upper === 'CANTEEN_MANAGER') {
      email = 'canteen@seu.ac.lk';
    } else if (upper === 'STUDENT_WELFARE_OFFICER') {
      email = 'welfare@seu.ac.lk';
    } else if (upper === 'SECURITY_OFFICER') {
      email = 'security@seu.ac.lk';
    } else if (upper === 'HEALTH_CENTRE_OFFICER') {
      email = 'health@seu.ac.lk';
    }

    return await login(email, 'password123');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('uniconnect_user', JSON.stringify(updatedUser));
  };

  const isStaff =
    user &&
    ![
      'STUDENT',
      'student',
    ].includes(user.role);

  const isAdmin =
    user &&
    ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'admin'].includes(user.role);

  const isStudent = user && ['STUDENT', 'student'].includes(user.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isStaff,
        isAdmin,
        isStudent,
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
