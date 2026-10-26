import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('leafdesk_token') || null);
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState([]);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            const socket = getSocket();
            socket.emit('join:user', res.user.email);
          }
        } catch (err) {
          localStorage.removeItem('leafdesk_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }

    loadUser();
  }, [token]);

  useEffect(() => {
    api.getDemoUsers()
      .then((res) => {
        if (res.success) setDemoUsers(res.users);
      })
      .catch(() => {});
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success && res.token) {
      localStorage.setItem('leafdesk_token', res.token);
      setToken(res.token);
      setUser(res.user);
      const socket = getSocket();
      socket.emit('join:user', res.user.email);
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('leafdesk_token');
    setToken(null);
    setUser(null);
  };

  const quickSwitch = async (email, role = 'author') => {
    const password = role === 'admin' ? 'admin123' : 'author123';
    return await login(email, password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        demoUsers,
        login,
        logout,
        quickSwitch
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
