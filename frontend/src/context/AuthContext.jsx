import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('user_role'));
  const [userName, setUserName] = useState(localStorage.getItem('user_name'));
  const [user, setUser] = useState(null);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('users/profiles/me/');
      setUser(response.data);
      setUserName(response.data.display_name);
      localStorage.setItem('user_name', response.data.display_name);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [isAuthenticated]);

  const login = (access, refresh, role, name) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user_role', role);
    if (name) localStorage.setItem('user_name', name);
    
    setIsAuthenticated(true);
    setUserRole(role);
    if (name) setUserName(name);
    fetchUserProfile();
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, userName, user, login, logout, fetchUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
