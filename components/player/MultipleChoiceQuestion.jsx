'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/shared/Button';

export function MultipleChoiceQuestion({ question, onAnswer, disabled = false }) {
  const isMultiple = question.answerType === 'multiple';
  const [selected, setSelected] = useState(isMultiple ? [] : null);

  const handleSelect = (index) => {
    if (disabled) return;
    if (isMultiple) {
      setSelected((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setSelected(index);
    }
  };

  const handleSubmit = () => {
    if (disabled) return;
    const answer = isMultiple ? selected : selected !== null ? selected : null;
    if (answer === null || (Array.isArray(answer) && answer.length === 0)) return;
    onAnswer(answer);
  };

  const canSubmit = isMultiple
    ? Array.isArray(selected) && selected.length > 0
    : selected !== null;

  return (
    <div className="space-y-4">
      {/* Варианты ответов */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {question.options.map((option, index) => {
          const isSelected = isMultiple
            ? selected.includes(index)
            : selected === index;

          return (
            <motion.button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={disabled}
              whileTap={!disabled ? { scale: 0.97 } : {}}
              className={`
                min-h-[44px] w-full text-left px-4 py-3 rounded-xl font-medium text-base
                border-2 transition-all duration-200
                ${
                  isSelected
                    ? 'bg-accent border-accent text-white'
                    : 'bg-bg-secondary/50 border-accent/20 text-text-primary hover:border-accent/50 hover:bg-accent/10'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {option}
            </motion.button>
          );
        })}
      </div>

      {/* Кнопка ответить */}
      <Button
        onClick={handleSubmit}
        disabled={disabled || !canSubmit}
        size="lg"
        className="w-full"
      >
        Ответить
      </Button>
    </div>
  );
}
