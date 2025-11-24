import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const NetworkContext = createContext();

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
};

export const NetworkProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [serverReachable, setServerReachable] = useState(true);

  // Check if server is reachable
  const checkServerHealth = async () => {
    try {
      await axios.get(`${API_URL}/health`, { timeout: 5000 });
      setServerReachable(true);
      return true;
    } catch (error) {
      setServerReachable(false);
      return false;
    }
  };

  // Handle online event
  const handleOnline = () => {
    setIsOnline(true);
    checkServerHealth();
  };

  // Handle offline event
  const handleOffline = () => {
    setIsOnline(false);
    setServerReachable(false);
  };

  useEffect(() => {
    // Listen to browser online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial server health check
    checkServerHealth();

    // Periodic server health check (every 30 seconds)
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkServerHealth();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Combined online status (both browser and server)
  const isFullyOnline = isOnline && serverReachable;

  return (
    <NetworkContext.Provider
      value={{
        isOnline: isFullyOnline,
        browserOnline: isOnline,
        serverReachable,
        checkServerHealth
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};
