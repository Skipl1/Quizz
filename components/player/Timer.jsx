'use client';

import { motion } from 'framer-motion';

const TIMER_THRESHOLDS = {
  warning: 10,
  danger: 5,
};

export function Timer({ timeLeft, totalTime }) {
  const percent = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;

  let colorClass = 'from-accent to-accent-hover';
  let textColor = 'text-accent';

  if (timeLeft <= TIMER_THRESHOLDS.danger) {
    colorClass = 'from-danger to-red-600';
    textColor = 'text-danger';
  } else if (timeLeft <= TIMER_THRESHOLDS.warning) {
    colorClass = 'from-warning to-amber-600';
    textColor = 'text-warning';
  }

  return (
    <div className="w-full">
      {/* Цифровой таймер */}
      <motion.div
        className={`text-4xl md:text-5xl font-extrabold text-center mb-3 tabular-nums ${textColor}`}
        key={timeLeft}
        initial={timeLeft <= TIMER_THRESHOLDS.danger ? { scale: 1.15 } : {}}
        animate={timeLeft <= TIMER_THRESHOLDS.danger ? { scale: [1, 1.1, 1] } : {}}
        transition={timeLeft <= TIMER_THRESHOLDS.danger ? { duration: 0.5, repeat: Infinity } : {}}
      >
        {timeLeft}
      </motion.div>

      {/* Прогресс-бар */}
      <div className="w-full h-[6px] bg-bg-secondary/50 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
          initial={{ width: '100%' }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.3, ease: 'linear' }}
        />
      </div>
    </div>
  );
}
