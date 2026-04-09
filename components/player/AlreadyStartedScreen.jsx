'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';

export function AlreadyStartedScreen() {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="text-center">
          {/* Иконка */}
          <motion.div
            className="text-6xl mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            🚫
          </motion.div>

          <h2 className="text-xl md:text-2xl font-bold mb-3">
            Игра уже началась
          </h2>

          <p className="text-text-secondary text-sm md:text-base mb-6">
            Вы не можете присоединиться к игре после её начала. Подождите следующую викторину или обратитесь к ведущему.
          </p>

          <Button onClick={handleGoHome} size="lg" className="w-full">
            Вернуться на главную
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}
