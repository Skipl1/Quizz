'use client';

import { useContext, useEffect, useState, useCallback } from 'react';
import { SocketContext } from '@/components/providers/SocketProvider';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@/lib/constants/socket-events';

export function useQuizSocket() {
  const { socket, connected } = useContext(SocketContext);

  const [player, setPlayer] = useState(null);
  const [question, setQuestion] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [gameState, setGameState] = useState('idle'); // idle | waiting | playing | ended
  const [playersCount, setPlayersCount] = useState(0);
  const [quizInfo, setQuizInfo] = useState(null);

  // Регистрация игрока
  const register = useCallback((name) => {
    if (!socket) return Promise.resolve({ error: 'Нет подключения' });

    return new Promise((resolve) => {
      socket.emit(CLIENT_EVENTS.REGISTER, name, (response) => {
        if (response.playerId && !response.error) {
          setPlayer({ id: response.playerId, name: response.name });
          sessionStorage.setItem('quiz_player_session', JSON.stringify({
            playerId: response.playerId,
            name: response.name,
          }));
        }
        resolve(response);
      });
    });
  }, [socket]);

  // Слушатель: registered
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      if (data.playerId && !data.error) {
        setPlayer({ id: data.playerId, name: data.name });
      }
    };
    socket.on(SERVER_EVENTS.REGISTERED, handler);
    return () => { socket.off(SERVER_EVENTS.REGISTERED, handler); };
  }, [socket]);

  // Слушатель: quiz-ready
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      setGameState('waiting');
      setQuizInfo(data);
    };
    socket.on(SERVER_EVENTS.QUIZ_READY, handler);
    return () => { socket.off(SERVER_EVENTS.QUIZ_READY, handler); };
  }, [socket]);

  // Слушатель: new-question
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      setQuestion(data);
      setGameState('playing');
    };
    socket.on(SERVER_EVENTS.NEW_QUESTION, handler);
    return () => { socket.off(SERVER_EVENTS.NEW_QUESTION, handler); };
  }, [socket]);

  // Слушатель: update-leaderboard
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      setLeaderboard(data);
    };
    socket.on(SERVER_EVENTS.UPDATE_LEADERBOARD, handler);
    return () => { socket.off(SERVER_EVENTS.UPDATE_LEADERBOARD, handler); };
  }, [socket]);

  // Слушатель: players-count
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      setPlayersCount(data.count);
    };
    socket.on(SERVER_EVENTS.PLAYERS_COUNT, handler);
    return () => { socket.off(SERVER_EVENTS.PLAYERS_COUNT, handler); };
  }, [socket]);

  // Слушатель: player-quiz-ended
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      setGameState('ended');
      setQuestion(null);
    };
    socket.on(SERVER_EVENTS.PLAYER_QUIZ_ENDED, handler);
    return () => { socket.off(SERVER_EVENTS.PLAYER_QUIZ_ENDED, handler); };
  }, [socket]);

  // Слушатель: all-players-finished
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      setGameState('ended');
      setQuestion(null);
    };
    socket.on(SERVER_EVENTS.ALL_PLAYERS_FINISHED, handler);
    return () => { socket.off(SERVER_EVENTS.ALL_PLAYERS_FINISHED, handler); };
  }, [socket]);

  // Отправка ответа
  const submitAnswer = useCallback((answerData) => {
    if (!socket) return;
    socket.emit(CLIENT_EVENTS.SUBMIT_ANSWER, answerData);
  }, [socket]);

  // Время вышло
  const timeUp = useCallback(() => {
    if (!socket) return;
    socket.emit(CLIENT_EVENTS.TIME_UP);
  }, [socket]);

  // Запрос финального leaderboard
  const getFinalLeaderboard = useCallback(() => {
    if (!socket) return Promise.resolve([]);

    return new Promise((resolve) => {
      socket.emit(CLIENT_EVENTS.GET_FINAL_LEADERBOARD);
      socket.once(SERVER_EVENTS.FINAL_LEADERBOARD, (data) => {
        setLeaderboard(data);
        setGameState('ended');
        resolve(data);
      });
    });
  }, [socket]);

  // quiz-restarted
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      setGameState('waiting');
      setQuestion(null);
      setQuizInfo(data);
    };
    socket.on(SERVER_EVENTS.QUIZ_RESTARTED, handler);
    return () => { socket.off(SERVER_EVENTS.QUIZ_RESTARTED, handler); };
  }, [socket]);

  // quiz-already-started
  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      setGameState('already-started');
    };
    socket.on(SERVER_EVENTS.QUIZ_ALREADY_STARTED, handler);
    return () => { socket.off(SERVER_EVENTS.QUIZ_ALREADY_STARTED, handler); };
  }, [socket]);

  return {
    socket,
    connected,
    player,
    question,
    leaderboard,
    gameState,
    playersCount,
    quizInfo,
    register,
    submitAnswer,
    timeUp,
    getFinalLeaderboard,
  };
}
