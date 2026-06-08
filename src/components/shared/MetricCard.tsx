import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  status?: 'good' | 'warn' | 'danger' | 'neutral';
  tooltip?: string;
  icon?: string;
}

const statusClasses = {
  good:    'border-green-200 bg-green-50',
  warn:    'border-yellow-200 bg-yellow-50',
  danger:  'border-red-200 bg-red-50',
  neutral: 'border-gray-200 bg-white',
};

const valueClasses = {
  good:    'text-green-800',
  warn:    'text-yellow-800',
  danger:  'text-red-800',
  neutral: 'text-gray-900',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label, value, subValue, status = 'neutral', tooltip, icon,
}) => (
  <div
    className={`rounded-lg border p-4 ${statusClasses[status]}`}
    title={tooltip}
  >
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{icon && <span className="mr-1">{icon}</span>}{label}</p>
    <p className={`mt-1 text-2xl font-bold tabular-nums ${valueClasses[status]}`}>{value}</p>
    {subValue && <p className="mt-0.5 text-sm text-gray-500">{subValue}</p>}
  </div>
);
