'use client';

import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-accent hover:bg-accent-hover text-white',
  success: 'bg-success text-white',
  danger: 'bg-danger text-white',
  warning: 'bg-warning text-bg-primary',
  ghost: 'bg-transparent hover:bg-accent/20 text-text-primary border border-accent/30',
};

const sizes = {
  sm: 'px-3 py-2 text-sm h-11',
  md: 'px-5 py-3 text-base h-11',
  lg: 'px-8 py-4 text-lg h-12',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold rounded-lg
        transition-colors duration-200
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  );
}
