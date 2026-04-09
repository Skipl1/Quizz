'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/shared/Button';

export function OrderingQuestion({ question, onAnswer, disabled = false }) {
  // Перемешиваем элементы при первом рендере
  const [items, setItems] = useState(() => {
    const shuffled = [...question.options].sort(() => Math.random() - 0.5);
    return shuffled.map((text, index) => ({
      text,
      originalIndex: question.options.indexOf(text),
    }));
  });

  const moveItem = (fromIndex, direction) => {
    if (disabled) return;
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= items.length) return;

    setItems((prev) => {
      const newItems = [...prev];
      const temp = newItems[fromIndex];
      newItems[fromIndex] = newItems[toIndex];
      newItems[toIndex] = temp;
      return newItems;
    });
  };

  const handleSubmit = () => {
    if (disabled) return;
    const userOrder = items.map((item) => item.originalIndex);
    onAnswer({ type: 'ordering', answer: userOrder });
  };

  return (
    <div className="space-y-4">
      {/* Список элементов */}
      <ul className="space-y-2">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.li
              key={item.originalIndex}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                flex items-center gap-3 bg-bg-secondary/50 border-2 border-accent/20
                rounded-xl px-4 py-3 min-h-[44px]
                ${disabled ? 'opacity-50' : ''}
              `}
            >
              {/* Текст элемента */}
              <span className="flex-1 font-medium text-text-primary">{item.text}</span>

              {/* Кнопки перемещения */}
              {!disabled && (
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Переместить вверх"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === items.length - 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Переместить вниз"
                  >
                    ↓
                  </button>
                </div>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {/* Кнопка ответить */}
      <Button
        onClick={handleSubmit}
        disabled={disabled}
        size="lg"
        className="w-full"
      >
        Ответить
      </Button>
    </div>
  );
}
