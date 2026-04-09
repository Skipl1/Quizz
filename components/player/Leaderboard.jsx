'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/shared/Card';

const MEDALS = ['🥇', '🥈', '🥉'];

export function Leaderboard({ leaderboard = [], currentPlayer, compact = false }) {
  if (!leaderboard || leaderboard.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <Card className="mb-4">
        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">
          Рейтинг
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {leaderboard.slice(0, 10).map((entry, index) => {
            const isCurrent = entry.name === currentPlayer;
            return (
              <motion.div
                key={entry.name || index}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                  ${isCurrent ? 'bg-accent/20 border border-accent/40' : ''}
                `}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="w-6 text-center font-bold text-text-secondary">
                  {index < 3 ? MEDALS[index] : index + 1}
                </span>
                <span className={`flex-1 truncate ${isCurrent ? 'font-semibold text-accent' : 'text-text-primary'}`}>
                  {entry.name}
                </span>
                <span className="font-bold text-accent tabular-nums">{entry.score}</span>
              </motion.div>
            );
          })}
        </div>
      </Card>
    );
  }

  // Десктопная версия — полный список
  return (
    <Card>
      <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">
        Рейтинг
      </h3>
      <div className="space-y-2 max-h-[calc(100vh-6rem)] overflow-y-auto">
        {leaderboard.map((entry, index) => {
          const isCurrent = entry.name === currentPlayer;
          return (
            <motion.div
              key={entry.name || index}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                ${isCurrent ? 'bg-accent/20 border border-accent/40' : 'bg-bg-secondary/30'}
              `}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <span className="w-6 text-center font-bold text-text-secondary">
                {index < 3 ? MEDALS[index] : index + 1}
              </span>
              <span className={`flex-1 truncate ${isCurrent ? 'font-semibold text-accent' : 'text-text-primary'}`}>
                {entry.name}
              </span>
              <span className="font-bold text-accent tabular-nums">{entry.score}</span>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
