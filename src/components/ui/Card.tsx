import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverGlow?: boolean;
}

export function Card({ children, className = '', onClick, hoverGlow = true }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-xl p-5 border border-slate-200 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 backdrop-blur-md transition-all duration-200 ${
        onClick ? 'cursor-pointer select-none active:scale-[0.99]' : ''
      } ${
        hoverGlow && onClick ? 'hover:border-primary-accent/30 hover:shadow-primary-accent/5' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
