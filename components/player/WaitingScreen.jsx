'use client';

import { motion } from 'framer-motion';
import { useQuizSocket } from '@/lib/hooks/useQuizSocket';
import { Card } from '@/components/shared/Card';

export function WaitingScreen() {
  const { player, quizInfo, playersCount } = useQuizSocket();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="text-center">
          {/* Информация об игроке */}
          <div className="bg-bg-secondary/50 rounded-lg p-3 mb-6 border border-accent/20">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="font-semibold text-accent">{player?.name}</span>
              {player?.restored && (
                <span className="bg-success text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase">
                  Восстановлено
                </span>
              )}
            </div>
          </div>

          {/* Спиннер */}
          <motion.div
            className="mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <div className="w-12 h-12 rounded-full border-[3px] border-accent/20 border-t-accent" />
          </motion.div>

          {/* Текст ожидания */}
          <h2 className="text-xl font-bold mb-3">Ожидание начала игры...</h2>

          {quizInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-2 text-text-secondary text-sm"
            >
              <p>
                Викторина:{' '}
                <span className="text-text-primary font-medium">{quizInfo.name}</span>
              </p>
              <p>
                Вопросов:{' '}
                <span className="text-text-primary font-medium">{quizInfo.questionsCount || 0}</span>
              </p>
              {playersCount > 0 && (
                <p>
                  Игроков:{' '}
                  <span className="text-text-primary font-medium">{playersCount}</span>
                </p>
              )}
            </motion.div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
