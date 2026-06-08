import React from 'react';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  tooltip?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  label, value, onChange, min, max, step = 1, prefix, suffix,
  tooltip, placeholder, className = '', disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFloat(e.target.value);
    if (!isNaN(raw)) {
      const clamped = min !== undefined ? Math.max(min, max !== undefined ? Math.min(max, raw) : raw) : raw;
      onChange(clamped);
    }
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
        {label}
        {tooltip && (
          <span className="group relative cursor-help">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="invisible absolute bottom-full left-1/2 z-10 mb-1 w-64 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-normal text-white group-hover:visible">
              {tooltip}
            </div>
          </span>
        )}
      </label>
      <div className="flex rounded-lg border border-gray-300 focus-within:border-brand-600 focus-within:ring-1 focus-within:ring-brand-600">
        {prefix && (
          <span className="flex items-center rounded-l-lg border-r border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full rounded-${prefix ? 'none' : 'l-lg'} ${suffix ? '' : 'rounded-r-lg'} border-0 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400`}
        />
        {suffix && (
          <span className="flex items-center rounded-r-lg border-l border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tooltip?: string;
  className?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  label, value, onChange, placeholder, tooltip, className = '',
}) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
      {label}
      {tooltip && (
        <span className="group relative cursor-help">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="invisible absolute bottom-full left-1/2 z-10 mb-1 w-64 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-normal text-white group-hover:visible">
            {tooltip}
          </div>
        </span>
      )}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
    />
  </div>
);
