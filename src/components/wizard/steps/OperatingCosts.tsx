import React from 'react';
import { NumberInput } from '../../shared/NumberInput';
import type { WizardData } from '../wizardData';

interface Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}

export const OperatingCosts: React.FC<Props> = ({ data, onChange }) => {
  const estimateOM = () => {
    const base = data.residentialCount * 650;
    const commercial = data.hasCommercial ? data.commercialCount * 1_500 : 0;
    onChange({ annualOM: Math.round((base + commercial) / 1_000) * 1_000 });
  };

  const estimatedOM = Math.round(
    (data.residentialCount * 650 + (data.hasCommercial ? data.commercialCount * 1_500 : 0)) / 1_000,
  ) * 1_000;

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600 leading-relaxed">
        Your rates must cover operating costs, debt payments, and infrastructure reserves to keep
        your system financially healthy. Operating costs are the biggest driver.
      </p>

      <div>
        <NumberInput
          label="Annual Operating & Maintenance Cost"
          value={data.annualOM}
          onChange={(v) => onChange({ annualOM: v })}
          min={0}
          step={1_000}
          prefix="$"
          tooltip="Total annual cost to run your system: staff, electricity, chemicals, maintenance, insurance, and administration. Find this in your most recent annual budget or audit."
        />
        <p className="mt-1.5 text-xs text-gray-500">
          Find this in your latest annual budget or financial audit, or{' '}
          <button
            onClick={estimateOM}
            className="text-brand-600 hover:text-brand-700 underline underline-offset-2"
          >
            estimate from connection count (~${(estimatedOM / 1_000).toFixed(0)}K/yr)
          </button>
        </p>
      </div>

      <div>
        <NumberInput
          label="Current Reserve Fund Balance"
          value={data.reserveBalance}
          onChange={(v) => onChange({ reserveBalance: v })}
          min={0}
          step={1_000}
          prefix="$"
          tooltip="Money currently set aside in a capital reserve or emergency fund. This reduces the annual contribution your rates need to make toward infrastructure replacement."
        />
        <p className="mt-1.5 text-xs text-gray-500">
          Check your dedicated infrastructure or emergency reserve accounts.{' '}
          <button
            onClick={() => onChange({ reserveBalance: 0 })}
            className="text-brand-600 hover:text-brand-700 underline underline-offset-2"
          >
            Use $0 if you don't have one
          </button>
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 p-4 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={data.hasExistingDebt}
            onChange={(e) => onChange({ hasExistingDebt: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">
              My system has existing loan payments
            </span>
            <p className="text-xs text-gray-500 mt-0.5">
              USDA Rural Development, OWRB, or other infrastructure loans already in repayment
            </p>
          </div>
        </label>

        {data.hasExistingDebt && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pl-7">
            <NumberInput
              label="Annual Debt Service"
              value={data.existingDebtService}
              onChange={(v) => onChange({ existingDebtService: v })}
              min={0}
              step={1_000}
              prefix="$"
              tooltip="Total annual principal + interest payments on your current infrastructure loans. Find this in your loan coupon book or annual financial statements."
            />
            <NumberInput
              label="Years Remaining"
              value={data.debtYearsRemaining}
              onChange={(v) => onChange({ debtYearsRemaining: v })}
              min={0}
              max={40}
              step={1}
              suffix="years"
            />
          </div>
        )}
      </div>
    </div>
  );
};
