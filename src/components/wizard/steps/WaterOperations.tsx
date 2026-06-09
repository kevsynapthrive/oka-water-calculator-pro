import React from 'react';
import { NumberInput } from '../../shared/NumberInput';
import type { WizardData } from '../wizardData';

interface Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}

export const WaterOperations: React.FC<Props> = ({ data, onChange }) => (
  <div className="space-y-5">
    <p className="text-sm text-gray-600 leading-relaxed">
      Your customer count and usage figures determine your total billing volume, which is the
      foundation of your rate calculations.
    </p>

    <div>
      <NumberInput
        label="Residential Connections"
        value={data.residentialCount}
        onChange={(v) => onChange({ residentialCount: v })}
        min={1}
        step={10}
        tooltip="Number of active residential metered accounts in your system. Each connection pays the monthly base charge and a volumetric charge based on usage."
      />
    </div>

    <div>
      <NumberInput
        label="Average Monthly Residential Usage"
        value={data.avgUsageGal}
        onChange={(v) => onChange({ avgUsageGal: v })}
        min={100}
        step={100}
        suffix="gal/mo"
        tooltip="Average gallons used per residential account per month. Used to estimate total annual billing volume. Typical rural household uses 3,000–6,000 gallons/month."
      />
      <p className="mt-1.5 text-xs text-gray-500">
        Calculate from your billing records (total annual residential gallons ÷ 12 ÷ number of accounts), or{' '}
        <button
          onClick={() => onChange({ avgUsageGal: 5_000 })}
          className="text-brand-600 hover:text-brand-700 underline underline-offset-2"
        >
          use typical rural value (5,000 gal/mo)
        </button>
      </p>
    </div>

    <div>
      <NumberInput
        label="Non-Revenue Water (Water Loss)"
        value={data.waterLossPercent}
        onChange={(v) => onChange({ waterLossPercent: v })}
        min={0}
        max={60}
        step={0.5}
        suffix="%"
        tooltip="Percentage of water produced that is never billed — includes leaks, meter error, flushing, and theft. The AWWA considers anything over 15% a concern."
      />
      <p className="mt-1.5 text-xs text-gray-500">
        Compare your production meter readings to total billed volume, or{' '}
        <button
          onClick={() => onChange({ waterLossPercent: 15 })}
          className="text-brand-600 hover:text-brand-700 underline underline-offset-2"
        >
          use AWWA baseline (15%)
        </button>
      </p>
    </div>

    <div className="rounded-xl border border-gray-200 p-4">
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={data.hasCommercial}
          onChange={(e) => onChange({ hasCommercial: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600"
        />
        <span className="text-sm font-medium text-gray-700">
          My system also serves commercial or industrial accounts
        </span>
      </label>

      {data.hasCommercial && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 pl-7">
          <NumberInput
            label="Commercial Connections"
            value={data.commercialCount}
            onChange={(v) => onChange({ commercialCount: v })}
            min={0}
            step={5}
          />
          <NumberInput
            label="Avg Monthly Commercial Usage"
            value={data.commercialAvgUsage}
            onChange={(v) => onChange({ commercialAvgUsage: v })}
            min={0}
            step={500}
            suffix="gal/mo"
          />
        </div>
      )}
    </div>
  </div>
);
