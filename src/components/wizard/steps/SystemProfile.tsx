import React from 'react';
import type { WizardData } from '../wizardData';
import { PROFILE_SEEDS } from '../wizardData';

interface Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}

interface ProfileOption {
  id: WizardData['systemProfile'];
  title: string;
  description: string;
  details: string;
}

const PROFILES: ProfileOption[] = [
  {
    id: 'small-rural',
    title: 'Small Rural System',
    description: 'Under 500 connections',
    details: 'Typically serving small towns or farming communities. Often has higher water loss and lower median income.',
  },
  {
    id: 'mid-tribal',
    title: 'Tribal Water District',
    description: '500–1,000 connections',
    details: 'Serving tribal communities, often with lower median income and significant infrastructure needs.',
  },
  {
    id: 'medium-rural',
    title: 'Mid-Size Rural System',
    description: '1,000–2,500 connections',
    details: 'A typical rural municipal water system with moderate income levels and standard infrastructure needs.',
  },
  {
    id: 'growing-suburb',
    title: 'Growing Community',
    description: '2,500+ connections',
    details: 'Higher income, lower water loss, growing customer base with larger capital improvement plans.',
  },
];

export const SystemProfile: React.FC<Props> = ({ data, onChange }) => {
  const selectProfile = (id: WizardData['systemProfile']) => {
    onChange({ systemProfile: id, ...(PROFILE_SEEDS[id] ?? {}) });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 leading-relaxed">
        Select the option that best describes your water system. This pre-fills sensible starting
        values throughout the setup — you can adjust any of them as you go.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PROFILES.map((p) => {
          const selected = data.systemProfile === p.id;
          return (
            <button
              key={p.id}
              onClick={() => selectProfile(p.id)}
              className={`text-left rounded-xl border-2 p-4 transition-all focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 ${
                selected
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className={`font-semibold text-sm block ${selected ? 'text-brand-700' : 'text-gray-900'}`}>
                    {p.title}
                  </span>
                  <span className={`text-xs font-medium block mt-0.5 ${selected ? 'text-brand-600' : 'text-gray-500'}`}>
                    {p.description}
                  </span>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{p.details}</p>
                </div>
                {selected && (
                  <svg className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 italic">
        Not sure? "Mid-Size Rural System" is a good starting point for most communities.
      </p>
    </div>
  );
};
