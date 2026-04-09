'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuizSocket } from '@/lib/hooks/useQuizSocket';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';

export function JoinScreen() {
  const { register } = useQuizSocket();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Введите имя!');
      return;
    }
    setError('');
    setLoading(true);

    const response = await register(trimmed);
    setLoading(false);

    if (response?.error) {
      setError(response.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <Card className="text-center">
          {/* Логотип */}
          <motion.h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <span className="bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">
              QUIZZ
            </span>
            <span className="text-accent">.</span>
          </motion.h1>

          <p className="text-text-secondary text-sm md:text-base mb-6">
            Многопользовательская викторина в реальном времени
          </p>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ваше имя"
              maxLength={20}
              className="text-center tracking-wide"
              disabled={loading}
            />

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-danger text-sm"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" size="lg" disabled={loading} className="w-full">
              {loading ? 'Подключение...' : 'Войти в игру'}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
