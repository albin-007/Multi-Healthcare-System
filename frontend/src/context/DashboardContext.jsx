import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const { user } = useAuth();
  const [subTabs, setSubTabs] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('users/notifications/');
      setNotifications(res.data || []);
      setUnreadCount((res.data || []).filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, [user]);

  const markNotificationAsRead = async (id) => {
    try {
      await api.post(`users/notifications/${id}/mark_as_read/`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.post('users/notifications/mark_all_as_read/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Optional: Polling or WebSocket could go here
      const interval = setInterval(fetchNotifications, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  return (
    <DashboardContext.Provider value={{ 
      subTabs, setSubTabs, 
      activeSubTab, setActiveSubTab,
      globalSearch, setGlobalSearch,
      notifications, unreadCount,
      fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
