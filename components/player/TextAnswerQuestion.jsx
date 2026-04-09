'use client';

import { useState } from 'react';
import { Button } from '@/components/shared/Button';

export function TextAnswerQuestion({ question, onAnswer, disabled = false }) {
  const [text, setText] = useState('');

  const isFillBlank = question.type === 'fill_blank';
  const placeholder = isFillBlank ? 'Заполните пропуск...' : 'Введите ваш ответ...';

  const handleSubmit = () => {
    if (disabled) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    onAnswer({ type: 'text', answer: trimmed });
  };

  return (
    <div className="space-y-4">
      {/* Поле ввода */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={4}
        className={`
          w-full min-h-[120px] px-4 py-3 rounded-xl
          bg-bg-secondary/50 border-2 border-accent/30
          text-text-primary text-base
          placeholder:text-text-secondary
          focus:outline-none focus:border-accent
          transition-colors duration-200 resize-none
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />

      {/* Кнопка ответить */}
      <Button
        onClick={handleSubmit}
        disabled={disabled || !text.trim()}
        size="lg"
        className="w-full"
      >
        Ответить
      </Button>
    </div>
  );
}
