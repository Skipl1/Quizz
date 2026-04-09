'use client';

import { SocketProvider } from './SocketProvider';

export function RootProvider({ children }) {
  return (
    <SocketProvider>
      {children}
    </SocketProvider>
  );
}
