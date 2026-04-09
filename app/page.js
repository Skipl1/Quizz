'use client';

import { useQuizSocket } from '@/lib/hooks/useQuizSocket';
import { JoinScreen } from '@/components/player/JoinScreen';
import { WaitingScreen } from '@/components/player/WaitingScreen';
import { GameScreen } from '@/components/player/GameScreen';
import { ResultsScreen } from '@/components/player/ResultsScreen';
import { AlreadyStartedScreen } from '@/components/player/AlreadyStartedScreen';
import { ConnectionStatus } from '@/components/shared/ConnectionStatus';

export default function PlayerPage() {
  const { player, gameState } = useQuizSocket();

  return (
    <div className="min-h-screen bg-bg-primary">
      <ConnectionStatus />

      {/* Нет игрока — экран входа */}
      {!player && <JoinScreen />}

      {/* Игрок есть, ожидание старта */}
      {player && (gameState === 'idle' || gameState === 'waiting') && (
        <WaitingScreen />
      )}

      {/* Игра идёт */}
      {player && gameState === 'playing' && <GameScreen />}

      {/* Игра завершена */}
      {player && gameState === 'ended' && <ResultsScreen />}

      {/* Игра уже началась — нельзя войти */}
      {player && gameState === 'already-started' && <AlreadyStartedScreen />}
    </div>
  );
}
