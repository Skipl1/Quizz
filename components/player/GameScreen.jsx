'use client';

import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuizSocket } from '@/lib/hooks/useQuizSocket';
import { useTimer } from '@/lib/hooks/useTimer';
import { Timer } from '@/components/player/Timer';
import { Leaderboard } from '@/components/player/Leaderboard';
import { MultipleChoiceQuestion } from '@/components/player/MultipleChoiceQuestion';
import { TrueFalseQuestion } from '@/components/player/TrueFalseQuestion';
import { TextAnswerQuestion } from '@/components/player/TextAnswerQuestion';
import { OrderingQuestion } from '@/components/player/OrderingQuestion';
import { MatchingQuestion } from '@/components/player/MatchingQuestion';
import { Card } from '@/components/shared/Card';

const QUESTION_TYPE_NAMES = {
  multiple_choice: 'Множественный выбор',
  true_false: 'Правда/Ложь',
  fill_blank: 'Заполнить пробел',
  open_ended: 'Открытый вопрос',
  ordering: 'Изменение порядка',
  matching: 'Соответствие',
};

const QUESTION_TYPE_HINTS = {
  multiple_choice: 'Выберите один правильный ответ',
  true_false: 'Выберите правильный вариант',
  fill_blank: 'Введите текст для заполнения пропуска',
  open_ended: 'Дайте развёрнутый ответ',
  ordering: 'Расположите элементы в правильном порядке (сверху вниз)',
  matching: 'Сопоставьте каждый элемент с правильным ответом',
};

export function GameScreen() {
  const { question, submitAnswer, timeUp, leaderboard, player } = useQuizSocket();
  const { timeLeft, start, stop, getElapsedTime } = useTimer(30, () => {
    handleTimeUp();
  });

  const handleTimeUp = useCallback(() => {
    stop();
    timeUp();
  }, [stop, timeUp]);

  const handleAnswer = useCallback(
    (answer) => {
      stop();
      submitAnswer(answer);
    },
    [stop, submitAnswer]
  );

  // Запуск таймера при получении нового вопроса
  useEffect(() => {
    if (question?.timeLeft) {
      start(question.timeLeft);
    }
  }, [question, start]);

  // Cleanup при unmount
  useEffect(() => {
    return () => stop();
  }, [stop]);

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-secondary">Загрузка вопроса...</p>
      </div>
    );
  }

  const typeName = QUESTION_TYPE_NAMES[question.type] || 'Вопрос';
  const hint = QUESTION_TYPE_HINTS[question.type] || '';

  const renderQuestion = () => {
    const commonProps = {
      question,
      onAnswer: handleAnswer,
    };

    switch (question.type) {
      case 'multiple_choice':
        return <MultipleChoiceQuestion {...commonProps} />;
      case 'true_false':
        return <TrueFalseQuestion {...commonProps} />;
      case 'fill_blank':
      case 'open_ended':
        return <TextAnswerQuestion {...commonProps} />;
      case 'ordering':
        return <OrderingQuestion {...commonProps} />;
      case 'matching':
        return <MatchingQuestion {...commonProps} />;
      default:
        return <p className="text-text-secondary">Неизвестный тип вопроса</p>;
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 md:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Шапка вопроса */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-text-secondary text-sm font-semibold uppercase tracking-wider">
            Вопрос {question.questionIndex} из {question.totalQuestions}
          </span>
          <span className="bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-semibold">
            {typeName}
          </span>
        </div>

        {/* Таймер */}
        <div className="mb-6">
          <Timer timeLeft={timeLeft} totalTime={question.timeLeft || 30} />
        </div>

        {/* Карточка вопроса */}
        <motion.div
          key={question.questionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="mb-6">
            {/* Изображение вопроса */}
            {question.image && (
              <img
                src={question.image}
                alt="К вопросу"
                className="w-full max-h-48 object-contain rounded-lg mb-4"
                loading="lazy"
              />
            )}

            {/* Текст вопроса */}
            <h2 className="text-lg md:text-xl font-bold mb-2">{question.text}</h2>

            {/* Подсказка */}
            {hint && (
              <p className="text-accent text-sm mb-4">{hint}</p>
            )}

            {/* Компонент вопроса */}
            {renderQuestion()}
          </Card>
        </motion.div>

        {/* Leaderboard — на мобильных под вопросом, на десктопе справа */}
        <div className="md:hidden">
          <Leaderboard leaderboard={leaderboard} currentPlayer={player?.name} compact />
        </div>
        <div className="hidden md:block fixed top-4 right-4 w-64 max-h-[calc(100vh-2rem)] overflow-y-auto">
          <Leaderboard leaderboard={leaderboard} currentPlayer={player?.name} />
        </div>
      </div>
    </div>
  );
}
