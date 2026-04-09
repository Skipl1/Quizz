'use client';

import { useQuizSocket } from '@/lib/hooks/useQuizSocket';

export function ConnectionStatus() {
  const { connected, connectionError } = useQuizSocket();

  if (connected && !connectionError) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-warning text-bg-primary px-4 py-2 rounded-full text-sm font-medium animate-pulse shadow-lg">
      {connectionError ? '⚠️ Ошибка подключения' : '🔄 Переподключение...'}
    </div>
  );
}
