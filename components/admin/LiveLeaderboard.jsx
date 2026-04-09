'use client';

import { useQuizSocket } from '@/lib/hooks/useQuizSocket';
import { Card } from '@/components/shared/Card';

export function LiveLeaderboard() {
  const { leaderboard } = useQuizSocket();

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card className="text-center text-text-secondary py-12">
        <div className="text-4xl mb-3">📊</div>
        <p>Пока нет данных. Запустите викторину!</p>
      </Card>
    );
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">📊 Рейтинг в реальном времени</h3>
      <div className="space-y-2">
        {leaderboard.map((player, i) => (
          <div key={player.name} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${i === 0 ? 'bg-accent/20 border border-accent/50' : 'bg-bg-primary/50'}`}>
            <span className="text-xl w-10 text-center flex-shrink-0">{i < 3 ? medals[i] : `#${i + 1}`}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{player.name}</div>
              <div className="text-sm text-text-secondary">
                {player.answered}/{player.totalQuestions} отвечено • {player.percentage}%
              </div>
            </div>
            <div className="text-accent font-bold text-lg">{player.score}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
