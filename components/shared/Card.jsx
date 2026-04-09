'use client';

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-bg-card rounded-xl p-4 md:p-6 border border-accent/30 shadow-lg ${className}`}>
      {children}
    </div>
  );
}
