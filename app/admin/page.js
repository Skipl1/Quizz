'use client';

import { useState } from 'react';
import { useQuizSocket } from '@/lib/hooks/useQuizSocket';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { ConnectionStatus } from '@/components/shared/ConnectionStatus';

export default function AdminPage() {
  const { socket } = useQuizSocket();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!socket) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-secondary text-lg">Подключение...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <ConnectionStatus />
        <AdminLogin socket={socket} onSuccess={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <ConnectionStatus />
      <AdminDashboard socket={socket} />
    </div>
  );
}
