'use client';

import { useState } from 'react';
import { Button } from '@/components/shared/Button';

export function MatchingQuestion({ question, onAnswer, disabled = false }) {
  // Перемешиваем левую и правую колонки
  const [leftItems] = useState(() =>
    [...question.options].sort(() => Math.random() - 0.5)
  );
  const [rightItems] = useState(() =>
    [...question.options].sort(() => Math.random() - 0.5)
  );
  const [pairs, setPairs] = useState({}); // { leftIndex: rightIndex }

  const handleSelect = (leftIndex, rightIndex) => {
    if (disabled) return;
    setPairs((prev) => ({
      ...prev,
      [leftIndex]: rightIndex,
    }));
  };

  const handleSubmit = () => {
    if (disabled) return;
    // Проверяем, все ли пары собраны
    if (Object.keys(pairs).length < leftItems.length) return;

    // Формируем пары для сервера
    const userPairs = Object.entries(pairs).map(([leftIdx, rightIdx]) => ({
      questionIndex: leftItems[parseInt(leftIdx)]
        ? question.options.indexOf(leftItems[parseInt(leftIdx)])
        : parseInt(leftIdx),
      answerIndex: rightItems[rightIdx]
        ? question.options.indexOf(rightItems[rightIdx])
        : rightIdx,
    }));

    const allCorrect = userPairs.every(
      (p) => p.questionIndex === p.answerIndex
    );

    onAnswer({ type: 'matching', correct: allCorrect });
  };

  const canSubmit = Object.keys(pairs).length === leftItems.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Левая колонка — вопросы */}
        <div className="space-y-2">
          {leftItems.map((item, leftIndex) => {
            const originalIndex = question.options.indexOf(item);
            const isPaired = pairs[leftIndex] !== undefined;

            return (
              <div
                key={leftIndex}
                className={`
                  bg-bg-secondary/50 border-2 rounded-xl px-4 py-3 min-h-[44px]
                  font-medium text-text-primary transition-colors
                  ${
                    isPaired
                      ? 'border-accent bg-accent/10'
                      : 'border-accent/20'
                  }
                `}
              >
                {item}
              </div>
            );
          })}
        </div>

        {/* Правая колонка — выпадающие списки */}
        <div className="space-y-2">
          {leftItems.map((item, leftIndex) => {
            const originalIndex = question.options.indexOf(item);

            return (
              <div key={`select-${leftIndex}`}>
                <select
                  value={pairs[leftIndex] ?? ''}
                  onChange={(e) =>
                    handleSelect(leftIndex, parseInt(e.target.value))
                  }
                  disabled={disabled}
                  className={`
                    w-full min-h-[44px] px-4 py-3 rounded-xl
                    bg-bg-secondary/50 border-2 border-accent/30
                    text-text-primary text-sm
                    focus:outline-none focus:border-accent
                    transition-colors duration-200
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    appearance-none
                  `}
                >
                  <option value="" disabled>
                    Выберите ответ...
                  </option>
                  {rightItems.map((rightItem, rightIndex) => {
                    const originalRightIndex = question.options.indexOf(rightItem);
                    return (
                      <option key={rightIndex} value={rightIndex}>
                        {rightItem}
                      </option>
                    );
                  })}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      {/* Кнопка ответить */}
      <Button
        onClick={handleSubmit}
        disabled={disabled || !canSubmit}
        size="lg"
        className="w-full"
      >
        Ответить ({Object.keys(pairs).length}/{leftItems.length})
      </Button>
    </div>
  );
}
