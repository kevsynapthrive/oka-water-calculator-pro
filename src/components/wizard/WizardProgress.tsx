import React from 'react';

interface Props {
  step: number;
  totalSteps: number;
}

export const WizardProgress: React.FC<Props> = ({ step, totalSteps }) => {
  const pct = Math.round(((step + 1) / totalSteps) * 100);
  return (
    <div className="px-8 pt-4 pb-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-500">Step {step + 1} of {totalSteps}</span>
        <span className="text-xs text-gray-400">{pct}% complete</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100">
        <div
          className="h-1.5 rounded-full bg-brand-600 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
