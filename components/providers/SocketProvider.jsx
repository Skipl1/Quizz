'use client';

import { createContext, useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    const newSocket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      setConnectionError(false);
      console.log('Socket подключён:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Socket отключён');
    });

    newSocket.on('connect_error', (err) => {
      setConnectionError(true);
      console.error('Socket ошибка подключения:', err.message);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  const contextValue = useMemo(
    () => ({ socket, connected, connectionError }),
    [socket, connected, connectionError]
  );

  if (!socket) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-secondary text-lg">Подключение...</div>
      </div>
    );
  }

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}
