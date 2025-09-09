import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Get WebSocket URL from environment variable or use localhost for development
  const WS_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(WS_BASE_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('Connected to safety system');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from safety system');
      setIsConnected(false);
    });

    newSocket.on('dashboard_update', (data) => {
      console.log('Safety update received:', data);
      setLastUpdate(new Date());
    });

    newSocket.on('critical_alert', (alert) => {
      console.log('Critical public alert received:', alert);
      // Only handle critical alerts that are relevant to public safety
      if (alert.priority === 'critical' || 
          (alert.priority === 'high' && ['weather', 'emergency'].includes(alert.type))) {
        setLastUpdate(new Date());
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [WS_BASE_URL]);

  const emitEvent = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  const value = {
    socket,
    isConnected,
    lastUpdate,
    emitEvent,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
