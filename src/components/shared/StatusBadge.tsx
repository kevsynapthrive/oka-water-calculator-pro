import React from 'react';

interface StatusBadgeProps {
  label: string;
  colorClass: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, colorClass, size = 'md' }) => (
  <span
    className={`inline-flex items-center rounded border font-medium ${
      size === 'sm' ? 'px-2 py-0.5 text-xs'
      : size === 'lg' ? 'px-3 py-1.5 text-base'
      : 'px-2 py-1 text-sm'
    } ${colorClass}`}
  >
    {label}
  </span>
);
