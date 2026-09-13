import React from 'react';

export type BadgeStatusType = 'success' | 'error' | 'warning';

export interface BadgeStatusProps {
  status: BadgeStatusType;
  children: React.ReactNode;
  className?: string;
}

const statusStyles: Record<BadgeStatusType, string> = {
  success: 'bg-secondary/15 text-secondary border border-secondary/20',
  error: 'bg-red-500/15 text-red-400 border border-red-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
};

export const BadgeStatus: React.FC<BadgeStatusProps> = ({
  status,
  children,
  className = '',
}) => {
  return (
    <span
      className={`font-sans inline-flex items-center justify-center px-3 py-1 text-xs font-semibold tracking-wide rounded-full ${statusStyles[status]} ${className}`}
    >
      {children}
    </span>
  );
};
