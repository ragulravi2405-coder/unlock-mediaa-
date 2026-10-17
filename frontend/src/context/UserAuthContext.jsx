import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';

const UserAuthContext = createContext();

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('pay_unlock_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('pay_unlock_user_token') || null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (token && !user) {
      api.getCurrentUser()
        .then((res) => {
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('pay_unlock_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const loginOrRegister = async ({ name, password }) => {
    setLoading(true);
    try {
      const res = await api.userAuthEntry({ name, password });
      if (res.success && res.token) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('pay_unlock_user_token', res.token);
        localStorage.setItem('pay_unlock_user', JSON.stringify(res.user));
        addToast(res.message || `Welcome, ${res.user.name}!`, 'success');
        setIsAuthModalOpen(false);
        return { success: true, user: res.user, isNewUser: res.isNewUser };
      } else {
        throw new Error(res.error || 'Authentication failed');
      }
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pay_unlock_user_token');
    localStorage.removeItem('pay_unlock_user');
    addToast('Logged out successfully.', 'info');
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <UserAuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        loading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        loginOrRegister,
        logout
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
}
