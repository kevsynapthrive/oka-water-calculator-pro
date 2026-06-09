import React from 'react';
import { NumberInput, TextInput } from '../../shared/NumberInput';
import type { WizardData } from '../wizardData';

interface Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}

export const WizardCommunity: React.FC<Props> = ({ data, onChange }) => (
  <div className="space-y-5">
    <p className="text-sm text-gray-600 leading-relaxed">
      Community income data is used to calculate whether your water rates are affordable for
      residents — a key benchmark for USDA and EPA funding eligibility.
    </p>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <TextInput
        label="Community or System Name"
        value={data.communityName}
        onChange={(v) => onChange({ communityName: v })}
        placeholder="e.g. Ada Water Authority"
      />
      <TextInput
        label="State"
        value={data.state}
        onChange={(v) => onChange({ state: v })}
        placeholder="e.g. OK"
      />
    </div>

    <div>
      <NumberInput
        label="Median Household Income (Annual)"
        value={data.medianIncome}
        onChange={(v) => onChange({ medianIncome: v })}
        min={0}
        step={500}
        prefix="$"
        tooltip="Used to calculate whether water rates are affordable. EPA guidelines say typical monthly water bills should be under 2.5% of median household income."
      />
      <p className="mt-1.5 text-xs text-gray-500">
        Find this in the U.S. Census Bureau American Community Survey for your county or ZIP code.{' '}
        <button
          onClick={() => onChange({ medianIncome: 42_000 })}
          className="text-brand-600 hover:text-brand-700 underline underline-offset-2"
        >
          Use typical rural value ($42,000)
        </button>
      </p>
    </div>

    <div>
      <NumberInput
        label="Households Below Poverty Level"
        value={data.povertyPercent}
        onChange={(v) => onChange({ povertyPercent: v })}
        min={0}
        max={100}
        step={0.5}
        suffix="%"
        tooltip="Percentage of households in your service area at or below the federal poverty level. Higher rates affect funding eligibility and affordability analysis."
      />
      <p className="mt-1.5 text-xs text-gray-500">
        Also from the Census Bureau ACS.{' '}
        <button
          onClick={() => onChange({ povertyPercent: 22 })}
          className="text-brand-600 hover:text-brand-700 underline underline-offset-2"
        >
          Use typical rural value (22%)
        </button>
      </p>
    </div>
  </div>
);
