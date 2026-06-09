import React from 'react';
import { NumberInput } from '../../shared/NumberInput';
import type { WizardData } from '../wizardData';

interface Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}

export const CurrentRates: React.FC<Props> = ({ data, onChange }) => (
  <div className="space-y-5">
    <p className="text-sm text-gray-600 leading-relaxed">
      Enter your current residential water rates. If you don't have rates set yet, the suggested
      values are reasonable starting points — the Financial Advisor tab will help you find the
      right rates to cover your costs.
    </p>

    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">Rate structure type</p>
      <div className="flex rounded-xl border border-gray-200 overflow-hidden">
        {(['flat', 'tiered'] as const).map((type) => (
          <button
            key={type}
            onClick={() => onChange({ rateType: type })}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors text-left ${
              data.rateType === type
                ? 'bg-brand-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            } ${type === 'tiered' ? 'border-l border-gray-200' : ''}`}
          >
            <span className="block font-semibold">
              {type === 'flat' ? 'Flat Rate' : 'Tiered Rate'}
            </span>
            <span className={`block text-xs mt-0.5 ${data.rateType === type ? 'text-brand-100' : 'text-gray-400'}`}>
              {type === 'flat'
                ? 'Same price per gallon for all usage'
                : 'Higher price per gallon at higher usage levels'}
            </span>
          </button>
        ))}
      </div>
    </div>

    <div>
      <NumberInput
        label="Monthly Fixed Charge (Base Rate)"
        value={data.baseRate}
        onChange={(v) => onChange({ baseRate: v })}
        min={0}
        step={0.5}
        prefix="$"
        suffix="/mo"
        tooltip="Flat monthly fee charged to every account, before any usage. Covers meter reading, billing, and fixed system costs. Every customer pays this even if they use no water."
      />
      <p className="mt-1.5 text-xs text-gray-500">
        Common rural range: $12–$30/month.{' '}
        <button
          onClick={() => onChange({ baseRate: 18 })}
          className="text-brand-600 hover:text-brand-700 underline underline-offset-2"
        >
          Use typical rural value ($18/mo)
        </button>
      </p>
    </div>

    {data.rateType === 'flat' ? (
      <div>
        <NumberInput
          label="Volumetric Rate"
          value={data.tier1Rate}
          onChange={(v) => onChange({ tier1Rate: v })}
          min={0}
          step={0.1}
          prefix="$"
          suffix="/kgal"
          tooltip="Price per 1,000 gallons used. Multiplied by the customer's actual monthly usage to determine the variable portion of their bill."
        />
        <p className="mt-1.5 text-xs text-gray-500">
          Common rural range: $4–$8/kgal.{' '}
          <button
            onClick={() => onChange({ tier1Rate: 5.5 })}
            className="text-brand-600 hover:text-brand-700 underline underline-offset-2"
          >
            Use typical rural value ($5.50/kgal)
          </button>
        </p>
      </div>
    ) : (
      <div className="space-y-4">
        <div>
          <NumberInput
            label="Tier 1 Rate"
            value={data.tier1Rate}
            onChange={(v) => onChange({ tier1Rate: v })}
            min={0}
            step={0.1}
            prefix="$"
            suffix="/kgal"
            tooltip="Rate for the first block of water usage, up to the Tier 1 limit. This is the lowest per-gallon rate."
          />
        </div>
        <div>
          <NumberInput
            label="Tier 1 Upper Limit"
            value={data.tier1LimitGal}
            onChange={(v) => onChange({ tier1LimitGal: v })}
            min={500}
            step={500}
            suffix="gal/mo"
            tooltip="Usage threshold where Tier 1 ends and Tier 2 begins. Usage at or below this level is billed at the Tier 1 rate."
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Common rural range: 4,000–6,000 gallons/month.
          </p>
        </div>
        <div>
          <NumberInput
            label="Tier 2 Rate"
            value={data.tier2Rate}
            onChange={(v) => onChange({ tier2Rate: v })}
            min={0}
            step={0.1}
            prefix="$"
            suffix="/kgal"
            tooltip="Rate applied to all usage above the Tier 1 limit. Typically 1.3–2x the Tier 1 rate to discourage excess use."
          />
        </div>
      </div>
    )}

    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
      <strong>Not sure about your rates?</strong> Enter your best estimate — the Financial Advisor
      tab will calculate what your rates need to be to cover your actual costs.
    </div>
  </div>
);
