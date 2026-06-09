import React, { useState } from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title, subtitle, children, collapsible = false, defaultOpen = true, badge, className = '',
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-xl border border-gray-200 border-l-[3px] border-l-brand-600 bg-white shadow-sm ${className}`}>
      <div
        className={`flex items-center justify-between px-6 py-4 ${collapsible ? 'cursor-pointer select-none hover:bg-gray-50' : ''}`}
        onClick={collapsible ? () => setOpen((o) => !o) : undefined}
      >
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {badge}
          {collapsible && (
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
      {(!collapsible || open) && (
        <div className="border-t border-gray-100 px-6 py-5">{children}</div>
      )}
    </div>
  );
};
