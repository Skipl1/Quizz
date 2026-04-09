'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuizSocket } from '@/lib/hooks/useQuizSocket';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Leaderboard } from '@/components/player/Leaderboard';

const MEDALS = ['🥇', '🥈', '🥉'];

export function ResultsScreen() {
  const { leaderboard, player, quizInfo, getFinalLeaderboard, gameState } = useQuizSocket();
  const [finalLeaderboard, setFinalLeaderboard] = useState(null);
  const [loading, setLoading] = useState(false);

  // Запрашиваем финальный leaderboard при монтировании
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      const data = await getFinalLeaderboard();
      if (data) {
        setFinalLeaderboard(data);
      }
      setLoading(false);
    };
    fetchResults();
  }, [getFinalLeaderboard]);

  const displayLeaderboard = finalLeaderboard || leaderboard;

  // Находим данные текущего игрока
  const playerEntry = displayLeaderboard?.find((p) => p.name === player?.name);
  const playerRank = displayLeaderboard
    ? displayLeaderboard.findIndex((p) => p.name === player?.name) + 1
    : 0;
  const totalPlayers = displayLeaderboard?.length || 0;
  const medal = playerRank > 0 && playerRank <= 3 ? MEDALS[playerRank - 1] : '';

  // Проверяем, был ли рестарт
  const isRestarted = gameState === 'waiting' && player;

  if (isRestarted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="text-center">
            <motion.div
              className="text-5xl mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              🔄
            </motion.div>
            <h2 className="text-xl md:text-2xl font-bold mb-3">
              Викторина перезапущена!
            </h2>
            <p className="text-text-secondary text-sm md:text-base mb-2">
              {quizInfo?.name || 'Новая викторина'}
            </p>
            <p className="text-text-secondary text-sm">
              Ожидание начала...
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="text-center">
          {/* Заголовок */}
          <motion.h1
            className="text-2xl md:text-3xl font-extrabold mb-6"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            Итоги игры
          </motion.h1>

          {/* Результат игрока */}
          {playerEntry && (
            <motion.div
              className="bg-bg-secondary/50 rounded-xl p-6 mb-6 border border-accent/20"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-text-secondary text-sm mb-2">Ваш результат:</p>
              <motion.p
                className="text-5xl md:text-6xl font-extrabold text-accent mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {playerEntry.score}
              </motion.p>
              <p className="text-text-secondary text-sm">баллов</p>

              {playerRank > 0 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="text-text-secondary">Место:</span>
                  <span className="text-xl font-bold text-accent">
                    {playerRank}
                  </span>
                  <span className="text-2xl">{medal}</span>
                  <span className="text-text-secondary">из {totalPlayers}</span>
                </div>
              )}

              {playerEntry.percentage !== undefined && (
                <p className="text-text-secondary text-sm mt-2">
                  Правильных ответов:{' '}
                  <span className="text-text-primary font-semibold">
                    {playerEntry.percentage}%
                  </span>
                </p>
              )}

              {playerEntry.answered !== undefined && playerEntry.totalQuestions !== undefined && (
                <p className="text-text-secondary text-sm">
                  Отвечено:{' '}
                  <span className="text-text-primary font-semibold">
                    {playerEntry.answered}/{playerEntry.totalQuestions}
                  </span>
                </p>
              )}
            </motion.div>
          )}

          {/* Leaderboard */}
          <h3 className="text-lg font-bold mb-3 text-left">Финальный рейтинг:</h3>
          {loading ? (
            <p className="text-text-secondary text-sm">Загрузка результатов...</p>
          ) : (
            <Leaderboard
              leaderboard={displayLeaderboard}
              currentPlayer={player?.name}
            />
          )}
        </Card>
      </motion.div>
    </div>
  );
}
