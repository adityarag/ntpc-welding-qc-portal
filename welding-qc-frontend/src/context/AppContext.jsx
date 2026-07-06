import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [activeTab, setActiveTab] = useState('Offer Sheet');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Toast state
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'info' });

  // Initialize user from localStorage if token exists
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const triggerGlobalRefresh = () => setRefreshTrigger(prev => prev + 1);

  const showToast = useCallback((message, type = 'error') => {
    setToast({ isVisible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  const handleLoginSuccess = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    showToast('Logged in successfully!', 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    showToast('Logged out successfully.', 'info');
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      activeTab, 
      setActiveTab, 
      refreshTrigger, 
      triggerGlobalRefresh,
      toast,
      showToast,
      hideToast,
      handleLoginSuccess,
      handleLogout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);