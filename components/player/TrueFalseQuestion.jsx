'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export function TrueFalseQuestion({ question, onAnswer, disabled = false }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (index) => {
    if (disabled) return;
    setSelected(index);
    // Сразу отправляем ответ
    onAnswer(index);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Правда */}
        <motion.button
          onClick={() => handleSelect(0)}
          disabled={disabled}
          whileTap={!disabled ? { scale: 0.95 } : {}}
          className={`
            min-h-[80px] md:min-h-[100px] px-6 py-4 rounded-xl font-bold text-lg
            border-2 transition-all duration-200
            ${
              selected === 0
                ? 'bg-success border-success text-white shadow-lg shadow-success/30'
                : 'bg-bg-secondary/50 border-success/40 text-success hover:border-success hover:bg-success/10'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          ✓ Правда
        </motion.button>

        {/* Ложь */}
        <motion.button
          onClick={() => handleSelect(1)}
          disabled={disabled}
          whileTap={!disabled ? { scale: 0.95 } : {}}
          className={`
            min-h-[80px] md:min-h-[100px] px-6 py-4 rounded-xl font-bold text-lg
            border-2 transition-all duration-200
            ${
              selected === 1
                ? 'bg-danger border-danger text-white shadow-lg shadow-danger/30'
                : 'bg-bg-secondary/50 border-danger/40 text-danger hover:border-danger hover:bg-danger/10'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          ✗ Ложь
        </motion.button>
      </div>
    </div>
  );
}
