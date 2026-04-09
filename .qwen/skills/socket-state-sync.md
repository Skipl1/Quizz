---
name: socket-state-sync
description: Настройка синхронизации состояния между сервером (Socket.IO) и React-клиентом через кастомные хуки и Context.
---

# Socket-State Sync Skill

## Контекст
Проект QUIZZ использует **Socket.IO** для real-time коммуникации. При миграции на React, все socket-события должны быть обёрнуты в **React Context + Custom Hooks**.

## Архитектура

```
lib/hooks/
├── useQuizSocket.js    # Главный хук — подключение + все события
├── useTimer.js         # Хук таймера (синхронизирован с сервером)
└── usePlayer.js        # Хук состояния текущего игрока

components/providers/
└── SocketProvider.jsx  # React Context провайдер
```

## Инструкции

### 1. SocketProvider — React Context

Создай Context провайдер, который оборачивает всё приложение:

```jsx
// components/providers/SocketProvider.jsx
'use client';

import { createContext, useEffect, useState } from 'react';
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
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('connect_error', () => {
      setConnectionError(true);
    });

    setSocket(newSocket);

    // Cleanup при unmount
    return () => {
      newSocket.close();
    };
  }, []);

  if (!socket) return null; // Или loading spinner

  return (
    <SocketContext.Provider value={{ socket, connected, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
}
```

### 2. useQuizSocket — Главный хук

Хук управляет всеми игровыми событиями:

```jsx
// lib/hooks/useQuizSocket.js
'use client';

import { useContext, useEffect, useState, useCallback } from 'react';
import { SocketContext } from '@/components/providers/SocketProvider';

export function useQuizSocket() {
  const { socket, connected } = useContext(SocketContext);
  
  const [player, setPlayer] = useState(null);
  const [question, setQuestion] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [gameState, setGameState] = useState('idle'); // idle | waiting | playing | ended

  // Регистрация игрока
  const register = useCallback((name) => {
    if (!socket) return;
    
    return new Promise((resolve) => {
      socket.emit('register', name, (response) => {
        if (response.playerId) {
          setPlayer({ id: response.playerId, name: response.name });
          // Сохраняем sessionId для восстановления
          sessionStorage.setItem('quiz_player_session', JSON.stringify({
            playerId: response.playerId,
            name: response.name,
          }));
        }
        resolve(response);
      });
    });
  }, [socket]);

  // Слушатель: новая вопрос
  useEffect(() => {
    if (!socket) return;
    
    const handler = (data) => {
      setQuestion(data);
      setGameState('playing');
    };
    
    socket.on('new-question', handler);
    return () => { socket.off('new-question', handler); };
  }, [socket]);

  // Слушатель: leaderboard
  useEffect(() => {
    if (!socket) return;
    
    const handler = (data) => {
      setLeaderboard(data);
    };
    
    socket.on('update-leaderboard', handler);
    return () => { socket.off('update-leaderboard', handler); };
  }, [socket]);

  // Отправка ответа
  const submitAnswer = useCallback((answerData) => {
    if (!socket) return;
    socket.emit('submit-answer', answerData);
  }, [socket]);

  // Время вышло
  const timeUp = useCallback(() => {
    if (!socket) return;
    socket.emit('time-up');
  }, [socket]);

  // Запрос финального leaderboard
  const getFinalLeaderboard = useCallback(() => {
    if (!socket) return;
    
    return new Promise((resolve) => {
      socket.emit('get-final-leaderboard');
      socket.once('final-leaderboard', (data) => {
        setLeaderboard(data);
        setGameState('ended');
        resolve(data);
      });
    });
  }, [socket]);

  return {
    socket,
    connected,
    player,
    question,
    leaderboard,
    gameState,
    register,
    submitAnswer,
    timeUp,
    getFinalLeaderboard,
  };
}
```

### 3. useTimer — Хук таймера

```jsx
// lib/hooks/useTimer.js
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useTimer(initialTime, onTimeUp) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const start = useCallback((duration) => {
    const time = duration ?? initialTime;
    setTimeLeft(time);
    setIsRunning(true);
    startTimeRef.current = Date.now();
  }, [initialTime]);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setTimeLeft(initialTime);
  }, [stop, initialTime]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = initialTime - elapsed;
      
      if (remaining <= 0) {
        setTimeLeft(0);
        setIsRunning(false);
        clearInterval(intervalRef.current);
        onTimeUp?.();
      } else {
        setTimeLeft(remaining);
      }
    }, 100); // 100ms для плавности

    return () => clearInterval(intervalRef.current);
  }, [isRunning, initialTime, onTimeUp]);

  // Возвращаем точное время для бонусных расчётов
  const getElapsedTime = useCallback(() => {
    if (!startTimeRef.current) return 0;
    return (Date.now() - startTimeRef.current) / 1000;
  }, []);

  return { timeLeft, isRunning, start, stop, reset, getElapsedTime };
}
```

### 4. Reconnection Handling

При обрыве соединения — показывай индикатор и восстанавливай сессию:

```jsx
// components/shared/ConnectionStatus.jsx
'use client';

import { useQuizSocket } from '@/lib/hooks/useQuizSocket';

export function ConnectionStatus() {
  const { connected, connectionError } = useQuizSocket();

  if (connected && !connectionError) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-warning text-bg-primary px-4 py-2 rounded-full text-sm font-medium animate-pulse">
      {connectionError ? '⚠️ Ошибка подключения' : '🔄 Переподключение...'}
    </div>
  );
}
```

### 5. Optimistic UI

Для плавности — обновляй UI до подтверждения сервером:

```jsx
// При отправке ответа — сразу показывай фидбек
const handleAnswer = (selectedIndex) => {
  // Optimistic: показываем выбор сразу
  setSelectedOption(selectedIndex);
  
  // Отправляем на сервер
  submitAnswer(selectedIndex);
  
  // Сервер подтвердит через leaderboard update
};
```

### 6. Использование в компонентах

```jsx
// app/page.js (Player page)
'use client';

import { useQuizSocket } from '@/lib/hooks/useQuizSocket';
import { JoinScreen } from '@/components/player/JoinScreen';
import { WaitingScreen } from '@/components/player/WaitingScreen';
import { GameScreen } from '@/components/player/GameScreen';
import { ResultsScreen } from '@/components/player/ResultsScreen';

export default function PlayerPage() {
  const { player, gameState, question, leaderboard } = useQuizSocket();

  if (!player) return <JoinScreen />;
  if (gameState === 'waiting') return <WaitingScreen />;
  if (gameState === 'playing' && question) return <GameScreen question={question} />;
  if (gameState === 'ended') return <ResultsScreen leaderboard={leaderboard} />;
  
  return <WaitingScreen />;
}
```

## Правила

1. **ВСЕГДА** отписывайся от событий при unmount: `socket.off(event, handler)`
2. **ВСЕГДА** используй `useCallback` для socket-эммитов (избегай re-renders)
3. **ВСЕГДА** обрабатывай reconnection — не оставляй клиента в подвешенном состоянии
4. **НИКОГДА** не используй `socket.on` напрямую в компонентах — только через хуки
5. **НИКОГДА** не храни socket-объект в localStorage — только sessionId
6. sessionId сохраняется в sessionStorage для восстановления после reload

## Примеры применения

**Пример 1:** "Напиши хук для получения текущего вопроса, который корректно отписывается от событий при смене экрана."

→ См. `useQuizSocket` выше — `useEffect` с cleanup функцией `socket.off('new-question', handler)`.

**Пример 2:** "Добавь индикатор качества соединения в верхний угол экрана игрока."

→ См. `ConnectionStatus` компонент выше — fixed positioning, показывает "Переподключение..." при `connect_error`.
