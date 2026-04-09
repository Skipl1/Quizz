'use client';

export function Input({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  className = '',
  ...props
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`
        w-full h-11 px-4 py-3
        bg-bg-card border-2 border-accent/30 rounded-lg
        text-text-primary text-base
        placeholder:text-text-secondary
        focus:outline-none focus:border-accent
        transition-colors duration-200
        ${className}
      `}
      {...props}
    />
  );
}
