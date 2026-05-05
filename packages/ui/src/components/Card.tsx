import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'bordered' | 'navy' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

const variantClasses: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'bg-white border border-stone rounded-2xl',
  elevated: 'bg-white rounded-2xl shadow-navy-md',
  bordered: 'bg-white border-2 border-navy/10 rounded-2xl hover:border-gold/50',
  navy: 'bg-navy text-white rounded-2xl shadow-navy-md',
  glass: 'bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white',
};

const paddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  hover = false,
}) => {
  const classes = [
    variantClasses[variant],
    paddingClasses[padding],
    hover || onClick
      ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-navy-md cursor-pointer'
      : 'transition-shadow duration-200',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} onClick={onClick} role={onClick ? 'button' : undefined}>
      {children}
    </div>
  );
};

Card.displayName = 'Card';
